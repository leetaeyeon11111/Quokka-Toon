"""
쿼카툰 - 취향 리포트 배치 (taste_report)
=========================================
kikz 참고: 유저가 고른 작품들의 장르·태그를 집계해 취향을 만든다.
우리 DB엔 '본 작품(열람)' 테이블이 없어 → life_pick(인생작) + favorite(찜)로 대체.

입력 가중치:
  life_pick(인생작) : W_PICK   (최애, 제일 강함. rank 있으면 상위픽 가산)
  favorite(찜)      : W_FAV    (관심 표현, 중간)
  review 4~5점      : W_REVIEW (선택, 보강)

집계(유저별):
  장르 → taste_report_genre : score = Σ가중치, top_percent = 전체 유저 중 백분위
  태그 → taste_report_tag   : count = 태그 등장 가중합, rank = 유저 내 순위

모드:
  --dummy         : DB 안 건드림. 실제 webtoon_id로 가짜 유저 생성 → 계산 → 화면 출력 (로직 검증)
  --user <id>     : 실제 유저 1명 → 계산 → taste_report UPSERT
  --batch         : 전체 유저 → UPSERT (실데이터 쌓인 후)

실행:
  python make_taste_report.py --dummy
  python make_taste_report.py --user 42
"""
import argparse
import os
import random
from collections import defaultdict

# 태그 필터 기준: radar와 동일하게 공유 (완결/무료/19금/미디어믹스 + 공모전/미친작화 등 노이즈)
from filter_meta import is_filter_tag
try:
    from expand_axis_map import is_noise
except Exception:
    def is_noise(_tag):
        return False


def _skip_tag(name):
    """취향 집계에서 뺄 태그인가? (필터성 or 노이즈)"""
    return is_filter_tag(name) or is_noise(name)

# 가중치 (설정값)
W_PICK = 3.0
W_FAV = 1.0
W_REVIEW = 1.5
PICK_RANK_BONUS = 0.5   # 인생작 rank 1위에 주는 추가 가산(순위 낮을수록 감소)
TOP_TAGS = 5
TOP_GENRES = 3


def get_conn():
    import getpass, pymysql
    return pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=getpass.getpass("DB 비밀번호 입력: "),
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )


# ---------------------------------------------------------------------------
# 웹툰 → 장르/태그 조회 (집계 대상 펼치기)
# ---------------------------------------------------------------------------
def load_webtoon_maps(conn, webtoon_ids):
    """주어진 webtoon_id들의 장르/태그를 한 번에 로드."""
    if not webtoon_ids:
        return {}, {}
    ids = ",".join(str(int(w)) for w in set(webtoon_ids))
    genre_of, tags_of = defaultdict(list), defaultdict(list)
    with conn.cursor() as cur:
        # 장르 (webtoon_genre + genre 이름)
        cur.execute(f"""
            SELECT wg.webtoon_id, g.genre_id, g.name
            FROM webtoon_genre wg JOIN genre g ON wg.genre_id = g.genre_id
            WHERE wg.webtoon_id IN ({ids})
        """)
        for wid, gid, gname in cur.fetchall():
            genre_of[wid].append((gid, gname))
        # 태그 (필터/노이즈 태그 제외, 나머지는 원래 tag_id·이름 유지 → radar와 동일 기준)
        cur.execute(f"""
            SELECT wt.webtoon_id, t.tag_id, t.name
            FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
            WHERE wt.webtoon_id IN ({ids})
        """)
        for wid, tid, tname in cur.fetchall():
            if not _skip_tag(tname):           # 완결/무료/19금/미친작화/공모전 등 제외
                tags_of[wid].append((tid, tname))
    return genre_of, tags_of


# ---------------------------------------------------------------------------
# 핵심: 한 유저의 취향 집계
# ---------------------------------------------------------------------------
def compute_taste(weighted_webtoons, genre_of, tags_of):
    """
    weighted_webtoons: [(webtoon_id, weight)]
    반환: (genre_scores{gid:(name,score)}, tag_counts{tid:(name,count)})
    """
    gscore = defaultdict(float)
    gname = {}
    tcount = defaultdict(float)
    tname = {}
    for wid, w in weighted_webtoons:
        for gid, gn in genre_of.get(wid, []):
            gscore[gid] += w
            gname[gid] = gn
        for tid, tn in tags_of.get(wid, []):
            tcount[tid] += w
            tname[tid] = tn
    genres = {gid: (gname[gid], round(s, 2)) for gid, s in gscore.items()}
    tags = {tid: (tname[tid], round(c, 2)) for tid, c in tcount.items()}
    return genres, tags


def rank_tags(tags, top=TOP_TAGS):
    """태그를 count 내림차순으로 순위 매김 → [(rank, tid, name, count)]."""
    ordered = sorted(tags.items(), key=lambda kv: -kv[1][1])
    return [(i + 1, tid, nm, cnt) for i, (tid, (nm, cnt)) in enumerate(ordered[:top])]


def compute_top_percent(all_user_genre, uid):
    """
    전체 유저의 장르 score로, 특정 유저의 각 장르 '상위 %' 계산.
    all_user_genre: {uid: {gid: (name, score)}}
    반환: {gid: top_percent}  (작을수록 상위. 상위 4% = 4.0)
    """
    # 장르별로 전체 유저 score 분포 모으기
    per_genre = defaultdict(list)
    for u, gmap in all_user_genre.items():
        for gid, (_, s) in gmap.items():
            per_genre[gid].append(s)
    out = {}
    my = all_user_genre.get(uid, {})
    for gid, (_, s) in my.items():
        scores = per_genre[gid]
        n = len(scores)
        # 본인 포함 순위 기반 백분위: 내 등수 / 전체. 1등이면 1/n → 상위 (1/n)*100%
        higher = sum(1 for x in scores if x > s)
        my_rank = higher + 1                     # 공동순위 보수적(위에 있는 수 + 1)
        out[gid] = round(100.0 * my_rank / n, 1) if n else 100.0
    return out


# ---------------------------------------------------------------------------
# 입력 수집: 가중 웹툰 리스트
# ---------------------------------------------------------------------------
def collect_weighted(conn, user_id):
    """실제 유저의 life_pick+favorite+review → [(webtoon_id, weight)]."""
    ww = []
    with conn.cursor() as cur:
        cur.execute("SELECT webtoon_id, rank FROM life_pick WHERE user_id=%s", (user_id,))
        for wid, rank in cur.fetchall():
            bonus = PICK_RANK_BONUS / rank if rank else 0
            ww.append((wid, W_PICK + bonus))
        cur.execute("SELECT webtoon_id FROM favorite WHERE user_id=%s", (user_id,))
        for (wid,) in cur.fetchall():
            ww.append((wid, W_FAV))
        cur.execute("SELECT webtoon_id FROM review WHERE user_id=%s AND rating>=4", (user_id,))
        for (wid,) in cur.fetchall():
            ww.append((wid, W_REVIEW))
    return ww


# ---------------------------------------------------------------------------
# 리포트 출력 (kikz 스타일)
# ---------------------------------------------------------------------------
def print_report(uid, genres, tags, top_percent):
    print(f"\n{'='*50}\n[유저 {uid}] 취향 리포트\n{'='*50}")
    print("■ 선호 장르 TOP 3")
    top_g = sorted(genres.items(), key=lambda kv: -kv[1][1])[:TOP_GENRES]
    for gid, (name, score) in top_g:
        tp = top_percent.get(gid)
        tp_str = f"상위 {tp}%" if tp is not None else ""
        print(f"    {name}  (score {score})  {tp_str}")
    print("■ 최애 태그 TOP 5")
    for rank, tid, name, cnt in rank_tags(tags):
        print(f"    {rank}. #{name}  ({int(cnt)}작품 가중)")


# ---------------------------------------------------------------------------
# 모드들
# ---------------------------------------------------------------------------
def run_dummy(n_users=4):
    """실제 webtoon_id로 가짜 유저 생성 → 계산 → 출력 (DB 저장 안 함).
    유저마다 특정 장르 편향을 줘서 취향이 선명하게 갈리도록 함."""
    random.seed(42)
    conn = get_conn()
    # 장르별로 웹툰 풀을 나눠서 확보 (편향 부여용)
    with conn.cursor() as cur:
        cur.execute("SELECT genre_id, name FROM genre")
        genres = cur.fetchall()
        # 태그+장르 다 있는 웹툰을 장르별로 모음
        cur.execute("""
            SELECT wg.genre_id, wg.webtoon_id
            FROM webtoon_genre wg
            WHERE EXISTS (SELECT 1 FROM webtoon_tag wt WHERE wt.webtoon_id=wg.webtoon_id)
        """)
        by_genre = defaultdict(list)
        for gid, wid in cur.fetchall():
            by_genre[gid].append(wid)
    # 웹툰이 충분한 장르만 후보로
    big_genres = [(gid, nm) for gid, nm in genres if len(by_genre.get(gid, [])) >= 20]
    random.shuffle(big_genres)
    print(f"[더미] 장르 {len(big_genres)}개에서 유저별 편향 부여")

    users, user_fav_genre = {}, {}
    for uid in range(1, n_users + 1):
        gid, gname = big_genres[uid % len(big_genres)]     # 유저마다 다른 주력 장르
        pool = by_genre[gid][:]
        random.shuffle(pool)
        picks = pool[:5]
        favs = pool[5:15]
        ww = [(w, W_PICK + PICK_RANK_BONUS / (i + 1)) for i, w in enumerate(picks)] \
             + [(w, W_FAV) for w in favs]
        users[uid] = ww
        user_fav_genre[uid] = gname

    all_wids = [w for ww in users.values() for w, _ in ww]
    genre_of, tags_of = load_webtoon_maps(conn, all_wids)
    conn.close()

    all_user_genre, all_tags = {}, {}
    for uid, ww in users.items():
        g, t = compute_taste(ww, genre_of, tags_of)
        all_user_genre[uid] = g
        all_tags[uid] = t
    for uid in users:
        tp = compute_top_percent(all_user_genre, uid)
        print(f"\n(주력 장르 세팅: {user_fav_genre[uid]})", end="")
        print_report(uid, all_user_genre[uid], all_tags[uid], tp)
    print("\n※ 더미 모드: DB에 저장하지 않음. 로직 검증용.")


def run_user(user_id, save=True):
    """실제 유저 → 계산 → taste_report UPSERT."""
    conn = get_conn()
    ww = collect_weighted(conn, user_id)
    if not ww:
        print(f"[유저 {user_id}] 인생작/찜/리뷰 없음. 종료.")
        conn.close()
        return
    genre_of, tags_of = load_webtoon_maps(conn, [w for w, _ in ww])
    genres, tags = compute_taste(ww, genre_of, tags_of)
    # top_percent는 전체 유저 대비라야 정확 → 단일 유저 모드에선 생략/근사
    print_report(user_id, genres, tags, {})
    if save:
        with conn.cursor() as cur:
            for gid, (name, score) in genres.items():
                cur.execute("""
                    INSERT INTO taste_report_genre (user_id, genre_id, score, calculated_at)
                    VALUES (%s,%s,%s,NOW())
                    ON DUPLICATE KEY UPDATE score=VALUES(score), calculated_at=NOW()
                """, (user_id, gid, score))
            for rank, tid, name, cnt in rank_tags(tags, top=999):
                cur.execute("""
                    INSERT INTO taste_report_tag (user_id, tag_id, count, `rank`, calculated_at)
                    VALUES (%s,%s,%s,%s,NOW())
                    ON DUPLICATE KEY UPDATE count=VALUES(count), `rank`=VALUES(`rank`), calculated_at=NOW()
                """, (user_id, tid, int(cnt), rank))
        conn.commit()
        print(f"[저장] taste_report UPSERT 완료 (유저 {user_id})")
    conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dummy", action="store_true")
    ap.add_argument("--user", type=int)
    ap.add_argument("--n", type=int, default=4, help="더미 유저 수")
    args = ap.parse_args()
    if args.dummy:
        run_dummy(n_users=args.n)
    elif args.user:
        run_user(args.user)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
