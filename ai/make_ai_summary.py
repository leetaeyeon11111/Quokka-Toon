"""
쿼카툰 - ai_summary (한 줄 후킹 캐치프레이즈) 생성
==================================================
레진 스타일: 원문 줄거리 압축이 아니라, 작품 성격을 한 문장으로 잡아채는 훅.
  예) "전역 하루 전날, 이세계 소환수라니."
      "남자가 사라진 세계에서 받은 의뢰."

특징:
  - 출력이 한 문장(~20~40자)이라 토큰·비용·환각 위험 모두 낮음
  - 원문 줄거리 + 태그 + 장르를 근거로 투입, "원문 밖 내용 금지"
  - 스포일러 금지(여운·궁금증만), 반말 임팩트 톤
  - webtoon.ai_summary 컬럼에 저장 (있으면 skip → 재실행/증분 안전)

모드:
  --batch       : summary 있는 작품 전체를 채움(비어있는 것만). rate limit 대비 sleep.
  --limit N     : 이번 실행에서 N개까지만 (무료 티어 분할용)
  webtoon_id ...: 특정 작품만 (검색 결과 상위 K개 Lazy 생성에 사용)
  --demo        : LLM 없이 프롬프트/폴백 로직만 확인

핵심 함수(다른 모듈에서 import):
  ensure_ai_summary(conn, webtoon_id) -> str   # 있으면 반환, 없으면 생성·저장·반환 (Lazy)

실행:
  python make_ai_summary.py --batch --limit 500
  python make_ai_summary.py 1234 5678
  python make_ai_summary.py --demo
"""
import argparse
import os
import time

from filter_meta import radar_token
from llm_client import generate_text, available, fix_endings

SLEEP_SEC = float(os.environ.get("QUOKKA_LLM_SLEEP", "0.5"))  # rate limit 대비
MIN_INFO_LEN = 10   # 줄거리+태그가 이보다 짧으면 생성 포기(환각 방지) → 원문 폴백


def build_prompt(title, summary, tags, genre=None):
    tag_str = ", ".join(tags[:12]) if tags else "(없음)"
    return (
        "너는 웹툰 큐레이터다. 아래 작품을 한 문장 '후킹 카피'로 만들어라.\n"
        "규칙:\n"
        "- 20~40자 사이 한 문장. 작품의 매력을 한 번에 잡아채는 캐치프레이즈.\n"
        "- 줄거리 요약이 아니라 '훅'. 궁금증과 여운을 남겨라(스포일러 금지, 결말 언급 금지).\n"
        "- 반드시 아래 제공된 정보 안에서만 써라. 없는 설정·인물·전개를 지어내지 마라.\n"
        "- 임팩트 있는 간결한 어조. 따옴표·설명·이모지 없이 문장만 출력.\n"
        f"\n제목: {title}\n"
        f"장르: {genre or '미상'}\n"
        f"태그: {tag_str}\n"
        f"원문 줄거리: {(summary or '').strip()[:500]}\n"
        "\n한 문장 후킹 카피:"
    )


def _clean(line):
    if not line:
        return None
    s = line.strip().splitlines()[0].strip()
    s = s.strip('"\u201c\u201d\'')          # 양끝 따옴표 제거
    s = fix_endings(s.strip())
    if not s or len(s) > 60:                 # 너무 길면 실패로 간주
        return None
    return s


def generate_ai_summary(title, summary, tags, genre=None, client=None):
    """
    한 줄 캐치프레이즈 생성. 실패/정보부족 시 None(→ 호출부에서 원문 폴백).
    """
    info_len = len((summary or "")) + sum(len(t) for t in (tags or []))
    if info_len < MIN_INFO_LEN:
        return None  # 근거 부족 → 지어내기 방지
    prompt = build_prompt(title, summary, tags, genre)
    raw = generate_text(prompt, client=client)
    return _clean(raw)


# ---------------------------------------------------------------------------
# Lazy: 검색 결과 상위 K개에 대해 필요할 때만 생성·저장
# ---------------------------------------------------------------------------
def ensure_ai_summary(conn, webtoon_id, client=None):
    """
    ai_summary 있으면 그대로 반환. 없으면 생성·저장 후 반환. 실패 시 원문 summary.
    conn: 열린 pymysql 커넥션
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT w.title, w.summary, w.ai_summary, w.main_genre_id,
                (SELECT GROUP_CONCAT(t.name SEPARATOR ',')
                 FROM webtoon_tag wt JOIN tag t ON wt.tag_id=t.tag_id
                 WHERE wt.webtoon_id=w.webtoon_id) AS tags
            FROM webtoon w WHERE w.webtoon_id=%s
        """, (webtoon_id,))
        row = cur.fetchone()
    if not row:
        return None
    title, summary, ai_summary, genre, tags_raw = row
    if ai_summary and ai_summary.strip():
        return ai_summary                       # 캐시 히트
    tags = [radar_token(t) for t in (tags_raw or "").split(",") if t.strip()]
    tags = [t for t in tags if t]
    cap = generate_ai_summary(title, summary, tags, genre, client=client)
    if cap:
        with conn.cursor() as cur:
            cur.execute("UPDATE webtoon SET ai_summary=%s WHERE webtoon_id=%s",
                        (cap, webtoon_id))
        conn.commit()
        return cap
    return summary                              # 폴백: 원문


# ---------------------------------------------------------------------------
# Batch: 비어있는 작품 채우기 (증분·분할 안전)
# ---------------------------------------------------------------------------
def run_batch(limit=None):
    import getpass, pymysql
    conn = pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=getpass.getpass("DB 비밀번호 입력: "),
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )
    if not available():
        print("[경고] LLM 사용 불가(GEMINI_API_KEY 없음). 생성 중단.")
        conn.close()
        return
    sql = """
        SELECT webtoon_id FROM webtoon
        WHERE summary IS NOT NULL AND summary!=''
          AND (ai_summary IS NULL OR ai_summary='')
    """
    if limit:
        sql += f" LIMIT {int(limit)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        ids = [r[0] for r in cur.fetchall()]
    print(f"[배치] 대상 {len(ids):,}개 (ai_summary 비어있음)")
    done = fail = 0
    for i, wid in enumerate(ids, 1):
        cap = ensure_ai_summary(conn, wid)
        if cap:
            done += 1
        else:
            fail += 1
        if i % 50 == 0:
            print(f"  {i}/{len(ids)} ... 생성 {done} 폴백/실패 {fail}")
        time.sleep(SLEEP_SEC)
    conn.close()
    print(f"[완료] 생성 {done} / 폴백·실패 {fail}")


def run_ids(ids):
    import getpass, pymysql
    conn = pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=getpass.getpass("DB 비밀번호 입력: "),
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )
    for wid in ids:
        cap = ensure_ai_summary(conn, wid)
        print(f"  {wid}: {cap}")
    conn.close()


def demo():
    print("=== 프롬프트 미리보기 ===")
    print(build_prompt(
        "데우스 바드 마카나 2 : 선택받은 잡것",
        "전역 전날 판타지 세계로 떨어져버린 말년 병장 철수의 이세계 군대 캥판 수난기.",
        ["이세계", "말년병장", "판타지"], "판타지"))
    print("\n=== 폴백 로직 확인 (정보 부족 시 None) ===")
    print("  정보부족:", generate_ai_summary("제목만", "", [], None))   # None (LLM 없이도)
    print("  * 실제 생성은 GEMINI_API_KEY 있을 때. 없으면 None→원문 폴백.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", type=int, help="특정 webtoon_id (Lazy)")
    ap.add_argument("--batch", action="store_true")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()
    if args.demo:
        demo()
    elif args.batch:
        run_batch(limit=args.limit)
    elif args.ids:
        run_ids(args.ids)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
