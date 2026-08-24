"""
쿼카툰 - 추천 재정렬 (크기보정)  [조건부 활성 구조]
====================================================
설계 확정 사항 반영:
  - 크기보정은 radar가 아니라 '추천 랭킹(score_total)'에만 적용
  - 뷰는 '서브' → 적합도 밴드(5점) 안에서만 강하게 개입 (타이브레이커)
  - 평점은 베이지안 보정 + 저별점 소프트 감점 (뷰0.7 / 평점0.3)

★ 현재 DB 상태: view_count·bookmark_count·rating_* 전부 0 (실측 확인).
  → 신호가 없으면 '자동 skip' 하고 순수 적합도 순위를 그대로 반환한다.
  → 나중에 조원들이 뷰/평점을 채우면 코드 수정 없이 자동으로 켜진다.
    (데이터 게이트가 커버리지를 체크해서 판단)

파이프라인:
  1. (외부) 필터 적용 = search_filter.py
  2. 저별점 소프트 감점  ← 평점 데이터 있을 때만
  3. 적합도 밴드 재정렬  ← 뷰(또는 대체신호) 데이터 있을 때만
  4. 상위 K 반환

사용:
  from rerank import rerank
  results = rerank(candidates, top_k=10)   # candidates: [{webtoon_id, score_total, ...}]
  # 신호 없으면 score_total 내림차순 그대로, 있으면 크기보정 적용
"""
import math
import os
import pickle

# ---------------------------------------------------------------------------
# 설정값 (나중에 숫자만 바꿔 실험 가능)
# ---------------------------------------------------------------------------
BAND_WIDTH = 5.0          # 적합도 밴드폭: 이 안에 든 후보끼리 인기로 재정렬
W_VIEW = 0.7              # popularity 내부 비중: 뷰
W_RATING = 0.3           #                       평점
BAYES_M = 50             # 베이지안 신뢰 최소표본 (실행 시 rating_count 중앙값으로 자동 보정)
LOW_RATING_PCT = 0.15    # 저별점 컷: adj_rating 하위 15%
LOW_RATING_GAMMA = 8.0   # 저별점 소프트 감점 강도

# 데이터 게이트: 신호가 이 비율 미만으로만 채워져 있으면 '없음'으로 간주하고 skip
MIN_COVERAGE = 0.30

SIGNAL_META = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "..", "models", "webtoon_signal_meta.pkl")


# ---------------------------------------------------------------------------
# 신호 메타 로드 + 커버리지 판정
# ---------------------------------------------------------------------------
def load_signal_meta(path=SIGNAL_META):
    """
    webtoon_id -> {'view_count','bookmark_count','rating_avg','rating_count'}
    build_signal_meta()로 생성. 없으면 None (→ 크기보정 전면 skip).
    """
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return None


def _coverage(meta, key):
    if not meta:
        return 0.0
    n = sum(1 for m in meta.values() if (m.get(key) or 0) > 0)
    return n / len(meta) if meta else 0.0


def gate(meta):
    """어떤 신호가 쓸 만큼 채워져 있는지 판정."""
    return {
        "view": _coverage(meta, "view_count") >= MIN_COVERAGE,
        "bookmark": _coverage(meta, "bookmark_count") >= MIN_COVERAGE,
        "rating": _coverage(meta, "rating_count") >= MIN_COVERAGE,
    }


# ---------------------------------------------------------------------------
# 정규화 (롱테일 압축 + 백분위) / 베이지안 평점
# ---------------------------------------------------------------------------
def _percentile_rank(values):
    """값 리스트 -> {원본인덱스: 0~1 백분위}. 이상치에 강함."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = {}
    n = len(values)
    for rank, idx in enumerate(order):
        ranks[idx] = rank / (n - 1) if n > 1 else 1.0
    return ranks


def _bayesian_rating(R, v, C, m):
    """베이지안 보정 평점: (v*R + m*C)/(v+m). 표본 적으면 전체평균 C로 당김."""
    if not v:
        return C
    return (v * R + m * C) / (v + m)


# ---------------------------------------------------------------------------
# 핵심: 재정렬
# ---------------------------------------------------------------------------
def rerank(candidates, top_k=10, signal_meta=None):
    """
    candidates: [{'webtoon_id', 'score_total', ...}] (적합도 내림차순 아니어도 됨)
    반환: 크기보정 적용된 상위 top_k. 신호 없으면 순수 적합도 순.
    """
    cands = list(candidates)
    if not cands:
        return []

    meta = signal_meta if signal_meta is not None else load_signal_meta()
    g = gate(meta) if meta else {"view": False, "bookmark": False, "rating": False}

    # --- 신호가 하나도 없으면: 순수 적합도 순 (현재 DB 상태) ---
    if not any(g.values()):
        return sorted(cands, key=lambda c: -c["score_total"])[:top_k]

    ids = [c["webtoon_id"] for c in cands]

    # --- 2) 저별점 소프트 감점 (평점 신호 있을 때만) ---
    if g["rating"]:
        rc = [(meta.get(i, {}).get("rating_count") or 0) for i in ids]
        ra = [(meta.get(i, {}).get("rating_avg") or 0) for i in ids]
        rated = [r for r, c in zip(ra, rc) if c > 0]
        C = sum(rated) / len(rated) if rated else 0.0
        m = BAYES_M  # TODO: build 시 rating_count 중앙값으로 자동 세팅
        adj = [_bayesian_rating(ra[k], rc[k], C, m) for k in range(len(ids))]
        # 하위 LOW_RATING_PCT 임계
        srt = sorted(adj)
        thr = srt[int(len(srt) * LOW_RATING_PCT)] if srt else 0.0
        for k, c in enumerate(cands):
            if adj[k] < thr:
                c["score_total"] -= LOW_RATING_GAMMA * (thr - adj[k])
        # popularity용 평점 백분위
        adj_pct = _percentile_rank(adj)
    else:
        adj_pct = {k: 0.0 for k in range(len(ids))}

    # --- popularity_norm 구성 (뷰 0.7 / 평점 0.3, 가능한 신호만) ---
    if g["view"]:
        base = [math.log1p(meta.get(i, {}).get("view_count") or 0) for i in ids]
    elif g["bookmark"]:
        base = [math.log1p(meta.get(i, {}).get("bookmark_count") or 0) for i in ids]
    else:
        base = [0.0] * len(ids)
    view_pct = _percentile_rank(base) if any(base) else {k: 0.0 for k in range(len(ids))}

    has_view = g["view"] or g["bookmark"]
    has_rating = g["rating"]
    if has_view and has_rating:
        wv, wr = W_VIEW, W_RATING
    elif has_view:
        wv, wr = 1.0, 0.0
    else:
        wv, wr = 0.0, 1.0
    pop = {k: wv * view_pct.get(k, 0.0) + wr * adj_pct.get(k, 0.0)
           for k in range(len(ids))}

    # --- 3) 적합도 밴드 재정렬 ---
    # score_total 내림차순 정렬 후, BAND_WIDTH 안에 든 연속 구간끼리 pop 내림차순 재정렬
    idx_sorted = sorted(range(len(cands)), key=lambda k: -cands[k]["score_total"])
    reranked = []
    i = 0
    while i < len(idx_sorted):
        j = i
        top_score = cands[idx_sorted[i]]["score_total"]
        # 밴드: 최고점 기준 BAND_WIDTH 이내를 한 묶음으로
        while j < len(idx_sorted) and \
                top_score - cands[idx_sorted[j]]["score_total"] <= BAND_WIDTH:
            j += 1
        band = idx_sorted[i:j]
        band.sort(key=lambda k: -pop[k])   # 밴드 안에서 인기 강하게
        reranked.extend(band)
        i = j

    return [cands[k] for k in reranked[:top_k]]


# ---------------------------------------------------------------------------
# 신호 메타 생성 (팀 DB) - 실행하면 커버리지 리포트도 출력
# ---------------------------------------------------------------------------
def build_signal_meta():
    import getpass
    import pymysql
    conn = pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=getpass.getpass("DB 비밀번호 입력: "),
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT webtoon_id, view_count, bookmark_count, rating_avg, rating_count
                FROM webtoon
            """)
            meta = {r[0]: {"view_count": r[1], "bookmark_count": r[2],
                           "rating_avg": float(r[3]) if r[3] is not None else 0.0,
                           "rating_count": r[4]} for r in cur.fetchall()}
    finally:
        conn.close()

    os.makedirs(os.path.dirname(SIGNAL_META), exist_ok=True)
    with open(SIGNAL_META, "wb") as f:
        pickle.dump(meta, f)

    g = gate(meta)
    print(f"[저장] {SIGNAL_META} ({len(meta):,}개)")
    print(f"  커버리지: view {_coverage(meta,'view_count'):.1%} / "
          f"bookmark {_coverage(meta,'bookmark_count'):.1%} / "
          f"rating {_coverage(meta,'rating_count'):.1%}")
    print(f"  크기보정 게이트: {g}")
    if not any(g.values()):
        print("  → 신호 없음. rerank는 순수 적합도 순으로 동작(자동 skip).")
    else:
        print("  → 신호 감지. rerank에서 크기보정 자동 활성.")
    return meta


def demo():
    print("=== rerank 데모 (신호 없음 → 순수 적합도 / 신호 있음 → 밴드 재정렬) ===")
    cands = [
        {"webtoon_id": 1, "title": "적합88·인기낮", "score_total": 88},
        {"webtoon_id": 2, "title": "적합84·인기높", "score_total": 84},
        {"webtoon_id": 3, "title": "적합82·인기중", "score_total": 82},
        {"webtoon_id": 4, "title": "적합60·인기폭발", "score_total": 60},
    ]
    print("\n[신호 없음] (현재 DB)")
    for c in rerank([dict(x) for x in cands], top_k=4):
        print(f"  {c['score_total']:>4} {c['title']}")

    print("\n[신호 있음 가정] view_count 부여")
    fake = {1: {"view_count": 10, "bookmark_count": 0, "rating_avg": 0, "rating_count": 0},
            2: {"view_count": 900000, "bookmark_count": 0, "rating_avg": 0, "rating_count": 0},
            3: {"view_count": 50000, "bookmark_count": 0, "rating_avg": 0, "rating_count": 0},
            4: {"view_count": 2000000, "bookmark_count": 0, "rating_avg": 0, "rating_count": 0}}
    for c in rerank([dict(x) for x in cands], top_k=4, signal_meta=fake):
        print(f"  {c['score_total']:>4} {c['title']}")
    print("\n  → 88·84는 적합도 5점 이내(같은 밴드)라 인기순으로 뒤집혀 84가 1위로.")
    print("  → 82는 88과 6점 차라 밴드 밖 → 3위 유지(인기로 못 올라감).")
    print("  → 60은 인기 폭발이어도 밴드 밖이라 최하위. 적합도가 문지기 역할.")


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--build-meta", action="store_true")
    args = ap.parse_args()
    if args.build_meta:
        build_signal_meta()
    else:
        demo()
