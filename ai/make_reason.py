"""
쿼카툰 - 추천 이유 생성 (작품 소개형)
======================================
레진 스타일: 줄거리를 읽고 구체적 인물·장면을 언급하며, 다정한 큐레이터 톤으로
작품을 추천하는 2~3문장. 검색어 무관(작품 고유) → 웹툰 단위 캐싱.
  예) "오덕훈이 피규어를 부수며 흑화를 다짐하는 장면에서 시작된답니다.
       요한·철묵과의 끈끈한 동료애로 학교 권력을 뒤엎는 성장이 참 멋져요."

특징:
  - 모델 기본 gemini-3.5-flash-lite (추천 이유는 단순 → Lite로 충분, 저렴)
  - 웹툰 단위 캐싱(models/webtoon_reason.pkl): 한 번 생성→재사용, 재생성 0원
  - Lazy: 검색 결과 상위 K개에만 필요할 때 생성
  - 원문 근거 강제(지어내기 금지), 스포일러 금지
  - 키 없으면 None → 호출부에서 폴백(태그 기반 한 줄)

핵심 함수:
  ensure_reason(webtoon_id, title, summary, tags, genre, cache, client) -> str

실행:
  python make_reason.py --demo               # 프롬프트 + (키 있으면)실제 생성 미리보기
  python make_reason.py 1234 5678            # 특정 작품 생성(DB에서 내용 로드)
  python make_reason.py --batch --limit 500  # 대량(비어있는 것)
"""
import argparse
import os
import pickle

from filter_meta import radar_token
from llm_client import generate_text, available, fix_endings

REASON_MODEL = os.environ.get("QUOKKA_REASON_MODEL", "gemini-3.5-flash-lite")
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(HERE, "..", "models", "webtoon_reason.pkl")
MIN_INFO = 15   # 줄거리+태그가 이보다 짧으면 생성 포기(환각 방지)


def build_prompt(title, summary, tags, genre=None):
    tag_str = ", ".join(tags[:12]) if tags else "(없음)"
    return (
        "너는 웹툰 추천 큐레이터다. 아래 작품의 줄거리를 읽고, 이 작품을 추천하는 이유를 써라.\n"
        "규칙:\n"
        "- 2~3문장. 줄거리에 나온 구체적인 인물 이름과 장면을 언급하며 생생하게.\n"
        "- 다정하고 감성적인 큐레이터 말투(~요/~답니다체). "
        "예: '~참 멋져요', '~인상적이에요', '~오래 기억하게 돼요'.\n"
        "- 도입·설정·매력 위주로. 결말과 반전은 말하지 마라(스포일러 금지).\n"
        "- 줄거리에 없는 인물·설정·전개를 지어내지 마라.\n"
        "- 따옴표·머리말·이모지 없이 추천 이유 문장만 출력.\n"
        f"\n제목: {title}\n"
        f"장르: {genre or '미상'}\n"
        f"태그: {tag_str}\n"
        f"줄거리: {(summary or '').strip()[:600]}\n"
        "\n추천 이유:"
    )


def _clean(text):
    if not text:
        return None
    s = text.strip().strip('"\u201c\u201d').strip()
    s = fix_endings(s)
    return s if len(s) >= 10 else None


def generate_reason(title, summary, tags, genre=None, client=None):
    """추천 이유 생성. 정보 부족/실패 시 None."""
    info = len(summary or "") + sum(len(t) for t in (tags or []))
    if info < MIN_INFO:
        return None
    raw = generate_text(build_prompt(title, summary, tags, genre),
                        client=client, model=REASON_MODEL)
    return _clean(raw)


def template_reason(title, tags, matched_tags=None, radar=None):
    """LLM 없을 때 폴백: 태그·radar 기반 한 줄 (품질 낮지만 0원)."""
    mt = matched_tags or []
    if mt:
        return f"'{', '.join(mt[:3])}' 요소가 돋보이는 작품이에요."
    if tags:
        return f"'{', '.join(tags[:3])}' 태그의 매력이 담긴 작품이에요."
    return "줄거리가 검색 의도와 잘 어울리는 작품이에요."


# --------------------------------------------------------------------------
# 캐시 + Lazy
# --------------------------------------------------------------------------
def load_cache(path=CACHE_PATH):
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return {}


def save_cache(cache, path=CACHE_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(cache, f)


def ensure_reason(webtoon_id, title, summary, tags, genre=None,
                  cache=None, client=None, save=True):
    """
    캐시에 있으면 반환, 없으면 생성·캐싱. 실패 시 None(→ 호출부 폴백).
    cache: dict(webtoon_id->reason). None이면 파일에서 로드.
    """
    own = cache is None
    if own:
        cache = load_cache()
    if webtoon_id in cache and cache[webtoon_id]:
        return cache[webtoon_id]
    norm = [t for t in (radar_token(x) for x in (tags or [])) if t]
    reason = generate_reason(title, summary, norm, genre, client=client)
    if reason:
        cache[webtoon_id] = reason
        if save:
            save_cache(cache)
    return reason


# --------------------------------------------------------------------------
# DB 배치/단발
# --------------------------------------------------------------------------
def _fetch(conn, ids=None, limit=None):
    where = "w.summary IS NOT NULL AND w.summary!=''"
    if ids:
        where += " AND w.webtoon_id IN (%s)" % ",".join(str(int(i)) for i in ids)
    sql = f"""
        SELECT w.webtoon_id, w.title, w.summary, w.main_genre_id,
            (SELECT GROUP_CONCAT(t.name SEPARATOR ',')
             FROM webtoon_tag wt JOIN tag t ON wt.tag_id=t.tag_id
             WHERE wt.webtoon_id=w.webtoon_id) AS tags
        FROM webtoon w WHERE {where}
    """
    if limit:
        sql += f" LIMIT {int(limit)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()


def run_db(ids=None, limit=None):
    import getpass, pymysql, time
    if not available():
        print("[경고] GEMINI_API_KEY 없음 → 생성 불가.")
        return
    conn = pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=getpass.getpass("DB 비밀번호 입력: "),
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )
    rows = _fetch(conn, ids=ids, limit=limit)
    conn.close()
    cache = load_cache()
    done = 0
    for wid, title, summary, genre, tags_raw in rows:
        if wid in cache and cache[wid]:
            continue
        tags = [t.strip() for t in (tags_raw or "").split(",") if t.strip()]
        r = ensure_reason(wid, title, summary, tags, genre, cache=cache, save=False)
        if r:
            done += 1
            print(f"  [{title[:20]}] {r[:60]}...")
        time.sleep(float(os.environ.get("QUOKKA_LLM_SLEEP", "0.5")))
    save_cache(cache)
    print(f"[완료] 생성 {done} / 캐시 총 {len(cache)}")


def demo():
    print(f"모델: {REASON_MODEL} / LLM 사용가능: {available()}\n")
    print("=== 프롬프트 미리보기 ===")
    title = "찐따의 제국"
    summary = ("오덕훈은 학교에서 무시당하는 찐따다. 어느 날 피규어를 부수며 흑화를 다짐한 덕훈은 "
               "요한, 철묵과 동료가 되어 지옥 훈련을 시작한다. 학교의 권력 구조를 뒤엎기 위해.")
    tags = ["성장", "학원", "먼치킨", "복수"]
    print(build_prompt(title, summary, tags, "액션"))
    if available():
        print("\n=== 실제 생성 결과 ===")
        print(" ", generate_reason(title, summary, tags, "액션"))
    else:
        print("\n(GEMINI_API_KEY 설정 시 실제 생성 결과가 여기 출력됨)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", type=int)
    ap.add_argument("--batch", action="store_true")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()
    if args.demo:
        demo()
    elif args.batch:
        run_db(limit=args.limit)
    elif args.ids:
        run_db(ids=args.ids)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
