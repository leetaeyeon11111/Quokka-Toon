"""
쿼카툰 - LLM 통합 생성 (동적 radar 5축 + 추천이유)
==================================================
레진식 동적 radar: 고정 5축(장르/테마/감성/캐릭터/배경) 대신,
LLM이 줄거리+태그 근거로 '그 작품 대표 축 5개 + 원점수'를 생성.
추천이유와 한 번의 LLM 호출로 통합(JSON) → 비용 절감.

점수 처리:
  LLM 원점수(0~100) → 50~100으로 압축 매핑 (바닥50, 순위·상대차 보존)
  → 오각형이 안 찌그러지면서 축끼리 차별화 유지. 최고점이 12시 대표축.

캐싱/폴백:
  결과를 캐시(models/webtoon_llm_meta.pkl)에 저장, 있으면 재사용(Lazy).
  --save-db: radar_json, ai_summary(훅), ai_reason(추천이유) 컬럼에 저장.
  LLM 실패 시 → radar는 기존 고정5축(webtoon_radar.pkl), reason은 템플릿 폴백.

핵심 함수:
  ensure_enrichment(webtoon_id, title, summary, tags, genre, cache, client)
    -> {"reason": str, "radar": [{"axis","score"}...]}

실행:
  python make_radar_llm.py --demo
  python make_radar_llm.py 1234 5678        # 특정 웹툰
  python make_radar_llm.py --batch --limit 300
"""
import argparse
import json
import os
import pickle

from filter_meta import radar_token
from llm_client import generate_json, get_client, available, fix_endings
from make_reason import template_reason

REASON_MODEL = os.environ.get("QUOKKA_REASON_MODEL", "gemini-3.5-flash-lite")
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(HERE, "..", "models", "webtoon_llm_meta.pkl")
FIXED_RADAR = os.path.join(HERE, "..", "models", "webtoon_radar.pkl")

FLOOR = 50          # 압축 후 최소 점수
N_AXES = 5
MIN_INFO = 15


def build_prompt(title, summary, tags, genre=None):
    tag_str = ", ".join(tags[:15]) if tags else "(없음)"
    return (
        "너는 웹툰 큐레이터다. 아래 작품을 분석해 JSON으로만 답하라.\n"
        "출력 형식(JSON만, 코드펜스·설명 금지):\n"
        '{"summary": "...", "reason": "...", "radar": [{"axis":"키워드","score":정수}, ...5개]}\n\n'
        "[summary 규칙]\n"
        "- 작품을 한 문장으로 잡아채는 후킹 카피(20~40자). 줄거리 요약이 아니라 '훅'.\n"
        "- 궁금증·여운을 남겨라. 스포일러·결말 금지. 예: '전역 하루 전날, 이세계 소환수라니.'\n"
        "[reason 규칙]\n"
        "- 2~3문장. 줄거리 속 구체적 인물·장면을 언급하며 생생하게.\n"
        "- 다정한 큐레이터 말투(~요/~답니다체). 스포일러·결말 금지.\n"
        "- 줄거리에 없는 내용 지어내지 마라.\n"
        "[radar 규칙]\n"
        "- 이 작품을 대표하는 축(키워드) 5개. 태그·줄거리에 근거해서.\n"
        "- 태그에 있는 표현 우선, 없으면 줄거리에서 뽑아도 됨(단 지어내기 금지).\n"
        "- score는 0~100 정수. 그 축이 작품의 '무게중심'일수록 높게.\n"
        "- 대부분 40~90 범위. 5개를 전부 100으로 주지 마라(순위가 드러나게).\n"
        "- 제일 중요한 축이 첫 번째로 오게 정렬.\n\n"
        f"제목: {title}\n장르: {genre or '미상'}\n태그: {tag_str}\n"
        f"줄거리: {(summary or '').strip()[:600]}\n"
    )


def _compress(raw):
    """원점수 0~100 → FLOOR~100 선형 압축 (바닥 올리되 순위 보존)."""
    raw = max(0, min(100, float(raw)))
    return int(round(FLOOR + raw * (100 - FLOOR) / 100))


def _parse_radar(radar_raw):
    """LLM radar 리스트 정리: 5개 컷, 압축, score 내림차순 정렬."""
    axes = []
    for item in radar_raw:
        if not isinstance(item, dict):
            continue
        ax = str(item.get("axis", "")).strip()
        sc = item.get("score", 0)
        try:
            sc = float(sc)
        except (TypeError, ValueError):
            sc = 0
        if ax:
            axes.append({"axis": ax, "score": _compress(sc)})
    axes.sort(key=lambda x: -x["score"])
    return axes[:N_AXES]


def generate_enrichment(title, summary, tags, genre=None, client=None):
    """
    reason + 동적 radar를 한 번의 LLM 호출로. 실패 시 None.
    """
    info = len(summary or "") + sum(len(t) for t in (tags or []))
    if info < MIN_INFO:
        return None
    data = generate_json(build_prompt(title, summary, tags, genre),
                        client=client, model=REASON_MODEL)
    if not isinstance(data, dict):
        return None
    reason = fix_endings(str(data.get("reason", "")).strip().strip('"'))
    summary_hook = fix_endings(str(data.get("summary", "")).strip().strip('"'))
    radar = _parse_radar(data.get("radar", []))
    if not reason or len(radar) < 3:      # 최소 품질 미달 → 실패 취급
        return None
    return {"summary": summary_hook, "reason": reason, "radar": radar}


# --------------------------------------------------------------------------
# 폴백: 기존 고정 5축 radar (webtoon_radar.pkl)
# --------------------------------------------------------------------------
_fixed_cache = None
def fixed_radar(webtoon_id):
    global _fixed_cache
    if _fixed_cache is None:
        try:
            with open(FIXED_RADAR, "rb") as f:
                _fixed_cache = pickle.load(f)
        except FileNotFoundError:
            _fixed_cache = {}
    r = _fixed_cache.get(webtoon_id)
    if not r:
        return None
    # {축:점수} → [{axis,score}] 형태로 변환 (내림차순)
    items = sorted(r.items(), key=lambda kv: -kv[1])
    return [{"axis": k, "score": v} for k, v in items]


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


def ensure_enrichment(webtoon_id, title, summary, tags, genre=None,
                      cache=None, client=None, save=True):
    """
    캐시에 있으면 반환. 없으면 LLM 생성·캐싱. 실패 시 폴백(고정radar+템플릿이유).
    반환: {"reason", "radar", "source": "llm"|"fallback"}
    """
    own = cache is None
    if own:
        cache = load_cache()
    if webtoon_id in cache and cache[webtoon_id]:
        return cache[webtoon_id]

    norm = [t for t in (radar_token(x) for x in (tags or [])) if t]
    result = generate_enrichment(title, summary, norm, genre, client=client)
    if result:
        result["source"] = "llm"
        cache[webtoon_id] = result
        if save:
            save_cache(cache)
        return result

    # 폴백
    fb_radar = fixed_radar(webtoon_id)
    fb = {"summary": (summary or "")[:40], "reason": template_reason(title, norm),
          "radar": fb_radar or [], "source": "fallback"}
    return fb


# --------------------------------------------------------------------------
# DB 조회 + 배치
# --------------------------------------------------------------------------
def _fetch(conn, ids=None, limit=None, exclude_adult=True):
    where = "w.summary IS NOT NULL AND w.summary!=''"
    if exclude_adult and not ids:
        # 대량 배치: 성인물(19금) + 테스트 데이터 제외
        where += " AND (w.age_rating IS NULL OR w.age_rating != '19')"
        where += " AND w.title NOT LIKE '%%테스트%%'"
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


def run_db(ids=None, limit=None, save_db=False):
    import getpass, pymysql, time
    if not available():
        print("[경고] GEMINI_API_KEY 없음 → LLM 생성 불가.")
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
    cache = load_cache()
    todo = [r for r in rows if r[0] not in cache]
    print(f"[배치] 대상 {len(rows):,} / 신규 생성 {len(todo):,} (캐시 {len(rows)-len(todo):,} 재사용)")
    done = fail = 0
    for n, (wid, title, summary, genre, tags_raw) in enumerate(todo, 1):
        tags = [t.strip() for t in (tags_raw or "").split(",") if t.strip()]
        res = ensure_enrichment(wid, title, summary, tags, genre,
                                cache=cache, save=False)
        if res and res.get("source") == "llm":
            done += 1
            if save_db:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE webtoon SET radar_json=%s, ai_summary=%s, ai_reason=%s WHERE webtoon_id=%s",
                        (json.dumps(res["radar"], ensure_ascii=False),
                         res.get("summary", ""),   # 한 줄 훅 → ai_summary
                         res.get("reason", ""),     # 추천 이유 → ai_reason
                         wid))
                conn.commit()
        else:
            fail += 1
        if n % 20 == 0:
            print(f"  {n}/{len(todo)} ... 생성 {done} 폴백/실패 {fail}")
            save_cache(cache)          # 중간 저장(중단 대비)
        time.sleep(float(os.environ.get("QUOKKA_LLM_SLEEP", "0.5")))
    save_cache(cache)
    conn.close()
    print(f"[완료] LLM 생성 {done} / 폴백·실패 {fail} / 캐시 총 {len(cache)}")


def demo():
    print(f"모델: {REASON_MODEL} / LLM: {available()}\n")
    title = "찐따의 제국"
    summary = ("오덕훈은 학교에서 무시당하는 찐따다. 피규어를 부수며 흑화를 다짐한 덕훈은 "
               "요한, 철묵과 동료가 되어 지옥 훈련 끝에 학교 권력 구조를 뒤엎는다.")
    tags = ["성장", "학원", "먼치킨", "복수", "완결액션"]
    print("=== 프롬프트 ===")
    print(build_prompt(title, summary, [t for t in map(radar_token, tags) if t], "액션"))
    if available():
        print("\n=== 실제 생성 ===")
        res = generate_enrichment(title, summary,
                                  [t for t in map(radar_token, tags) if t], "액션")
        if res:
            print("summary:", res["summary"])
            print("reason :", res["reason"])
            print("radar  :")
            for a in res["radar"]:
                print(f"   {a['axis']}: {a['score']}")
        else:
            print("생성 실패(폴백 대상)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", type=int)
    ap.add_argument("--batch", action="store_true")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--save-db", action="store_true", help="radar_json·ai_summary·ai_reason 컬럼에 저장")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()
    if args.demo:
        demo()
    elif args.batch:
        run_db(limit=args.limit, save_db=args.save_db)
    elif args.ids:
        run_db(ids=args.ids, save_db=args.save_db)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
