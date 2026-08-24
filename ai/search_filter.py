"""
쿼카툰 - 검색 필터 (task A)
============================
"완결된 짜릿한 액션", "드라마화된 로맨스" 같은 복합 검색을 지원.

동작 (방식 C = 메타데이터에 필터정보 넣고 임베딩 검색 후 필터):
  1. parse_query   : 쿼리를 (필터조건 + 의미검색 문장)으로 분리
  2. 의미검색       : search.py의 FAISS 검색으로 후보 top-N (필터 무관)
  3. match_filters : 후보의 메타(serial_status/age_rating/media_mix)로 걸러냄
  4. 상위 K 반환

필터 메타는 build_filter_meta()로 미리 만들어 webtoon_meta.pkl에 함께 저장
(주말 재임베딩 때 build_embedding.py가 넣거나, 이 스크립트로 별도 생성).

의존: filter_meta.py (D와 공유), (선택) search.py
실행:
  python search_filter.py --demo             # DB 없이 파싱/필터 로직 데모
  python search_filter.py --build-meta       # 팀 DB에서 필터메타 생성 → pickle
  python search_filter.py "완결된 짜릿한 액션"  # 실제 검색(search.py 필요)
"""
import argparse
import pickle
import os

from filter_meta import parse_query, derive_filters, match_filters

HERE = os.path.dirname(os.path.abspath(__file__))
META_OUT = os.path.join(HERE, "..", "models", "webtoon_filter_meta.pkl")


# ---------------------------------------------------------------------------
# 필터 메타 생성: webtoon_id → {serial_status, age_rating, media_mix, price}
# ---------------------------------------------------------------------------
def build_filter_meta():
    """팀 DB의 webtoon_tag를 읽어 웹툰별 필터 메타를 만든다."""
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
                SELECT wt.webtoon_id, t.name
                FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    # webtoon_id별 태그 모으기
    tags_by_wt = {}
    for wid, name in rows:
        tags_by_wt.setdefault(wid, []).append(name)

    meta = {wid: derive_filters(tags) for wid, tags in tags_by_wt.items()}

    os.makedirs(os.path.dirname(META_OUT), exist_ok=True)
    with open(META_OUT, "wb") as f:
        pickle.dump(meta, f)

    # 요약 통계
    n_complete = sum(1 for m in meta.values() if m["serial_status"] == "완결")
    n_19 = sum(1 for m in meta.values() if m["age_rating"] == "19금")
    n_media = sum(1 for m in meta.values() if m["media_mix"])
    print(f"[저장] {META_OUT} ({len(meta):,}개 웹툰)")
    print(f"  완결: {n_complete:,} / 19금: {n_19:,} / 미디어믹스: {n_media:,}")
    return meta


# ---------------------------------------------------------------------------
# 검색 + 필터 (search.py 연동)
# ---------------------------------------------------------------------------
def search_with_filter(query, top_k=10, pool=100):
    """
    자연어 쿼리 → 필터 파싱 → 의미검색(pool개) → 필터 → 상위 top_k.
    search.py의 검색 함수를 재사용한다. (함수명이 다르면 아래 import만 맞추면 됨)
    """
    filters, content = parse_query(query)
    print(f"  [파싱] 필터={filters}  의미검색='{content}'")

    # search.py에서 의미검색 함수 가져오기 (프로젝트 구현에 맞게 이름 조정)
    try:
        from search import semantic_search
    except Exception as e:
        raise RuntimeError(
            "search.py의 semantic_search(query, top_k)를 import하지 못함. "
            "함수명/시그니처를 맞춰줘. 원인: %s" % e
        )

    # 필터가 있으면 pool 넓게 뽑고 필터, 없으면 그냥 top_k
    n = pool if filters else top_k
    candidates = semantic_search(content or query, top_k=n)  # [{webtoon_id, title, score, ...}]

    if not filters:
        return candidates[:top_k]

    with open(META_OUT, "rb") as f:
        fmeta = pickle.load(f)

    kept = []
    for c in candidates:
        wf = fmeta.get(c["webtoon_id"], {})
        if match_filters(wf, filters):
            kept.append(c)
        if len(kept) >= top_k:
            break
    return kept


# ---------------------------------------------------------------------------
# 데모 (DB/임베딩 없이 파싱·필터 로직만 확인)
# ---------------------------------------------------------------------------
def demo():
    print("=== parse_query 데모 ===")
    queries = [
        "완결된 짜릿한 액션",
        "드라마화된 로맨스",
        "연재중인 힐링 판타지",
        "전연령 학원물",
        "완결 무료 로맨스판타지",
        "그냥 재밌는 무협",           # 필터 없음
        "애니화된 성인 판타지",
    ]
    for q in queries:
        f, c = parse_query(q)
        print(f"  '{q}'\n     → 필터={f}  검색='{c}'")

    print("\n=== derive_filters 데모 (웹툰 태그 → 메타) ===")
    samples = {
        "A작품": ["로맨스", "완결로맨스", "완결무료", "달달", "다정남"],
        "B작품": ["액션", "판타지", "먼치킨", "연재중"],
        "C작품": ["로맨스", "드라마화", "19금", "집착남"],
    }
    metas = {}
    for name, tags in samples.items():
        m = derive_filters(tags)
        metas[name] = m
        print(f"  {name}: {m}")

    print("\n=== match_filters 데모 (검색결과 필터링) ===")
    fq, _ = parse_query("완결된 달달한 로맨스")
    print(f"  쿼리 필터: {fq}")
    for name, m in metas.items():
        ok = match_filters(m, fq)
        print(f"    {name}: {'통과' if ok else '탈락'}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query", nargs="?", help="검색어")
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--build-meta", action="store_true")
    ap.add_argument("--top-k", type=int, default=10)
    args = ap.parse_args()

    if args.demo:
        demo()
    elif args.build_meta:
        build_filter_meta()
    elif args.query:
        results = search_with_filter(args.query, top_k=args.top_k)
        print(f"\n=== 결과 {len(results)}개 ===")
        for i, r in enumerate(results, 1):
            print(f"  {i}. [{r.get('title','?')}] score={r.get('score','?')}")
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
