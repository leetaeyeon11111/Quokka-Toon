"""
쿼카툰 - 임베딩 fine-tuning 학습쌍 생성 (task B)
================================================
공식 가이드 반영:
  1) 학습 데이터가 실제 태스크(검색: 쿼리→작품)를 모사해야 함
     → 각 작품의 태그·줄거리에서 자연어 검색어를 합성해 positive로.
  2) 하드 네거티브가 성능을 좌우 (긍정만으론 향상 미미)
     → 태그 그래프(부분 겹침·동일 장르)로 하드 네거티브 채굴.
  3) 손실은 MultipleNegativesRankingLoss / TripletLoss 정석.

출력: 삼중항 JSONL  {"anchor": 검색어, "positive": 정답작품텍스트, "negative": 하드네거티브텍스트}
      + 평가셋 JSONL {"query": 검색어, "relevant_id": webtoon_id}  (NDCG/recall 측정용)

합성 쿼리 방식:
  - 기본(무료): 축 인식 규칙 — 감성+장르, 테마+장르, 배경+장르, 캐릭터+장르 조합
  - 옵션(--use-llm): Gemini로 자연스러운 검색어 보강 (llm_client, 무료 우선)

데이터 소스: 팀 DB (webtoon + webtoon_tag), 또는 --csv 오프라인.
실행:
  python make_training_pairs.py                 # DB에서 생성
  python make_training_pairs.py --use-llm       # 합성 쿼리 LLM 보강
  python make_training_pairs.py --demo          # 가짜 데이터로 로직 확인
"""
import argparse
import json
import os
import random

from filter_meta import radar_token

HERE = os.path.dirname(os.path.abspath(__file__))
AXIS_PATH = os.path.join(HERE, "..", "data", "axis_map.json")
OUT_TRIPLES = os.path.join(HERE, "..", "data", "train_triples.jsonl")
OUT_EVAL = os.path.join(HERE, "..", "data", "eval_queries.jsonl")

# 파라미터
MIN_TAGS = 3               # 학습에 쓸 최소 태그 수
MAX_QUERIES_PER_WT = 5     # 작품당 합성 쿼리 상한
N_HARD_PER_QUERY = 3       # 쿼리당 하드 네거티브 수 (자료 권장: 여유 있게, 상한은 학습 때 조절)
JACCARD_LOW = 0.10         # 하드 네거티브 태그 겹침 하한 (너무 낮으면 이지 네거티브)
JACCARD_HIGH = 0.45        # 상한 (너무 높으면 사실상 positive)
SEED = 42
MAX_CAND = 2000            # 하드네거티브 후보 스캔 상한 (대규모 성능)


def load_axis():
    with open(AXIS_PATH, encoding="utf-8") as f:
        m = json.load(f)
    axes = m.get("_axes", ["장르", "테마", "감성", "캐릭터", "배경"])
    tag2axis = {}
    for ax in axes:
        for t in m.get(ax, []):
            tag2axis[t] = ax
    return tag2axis


def synth_queries(tags_norm, tag2axis):
    """축 인식 규칙으로 자연어 검색어 합성. 반환: [(쿼리, [소스태그])]."""
    by = {"장르": [], "테마": [], "감성": [], "캐릭터": [], "배경": []}
    for t in tags_norm:
        ax = tag2axis.get(t)
        if ax in by:
            by[ax].append(t)

    qs = []
    def combo(a, b):
        for x in by.get(a, [])[:2]:
            for y in by.get(b, [])[:2]:
                qs.append((f"{x} {y}", [x, y]))

    combo("감성", "장르")     # 달달한 로맨스
    combo("테마", "장르")     # 회귀 판타지
    combo("배경", "장르")     # 학원 로맨스
    combo("캐릭터", "장르")   # 먼치킨 판타지
    if by["감성"] and by["테마"] and by["장르"]:
        qs.append((f"{by['감성'][0]} {by['테마'][0]} {by['장르'][0]}",
                   [by['감성'][0], by['테마'][0], by['장르'][0]]))

    seen, out = set(), []
    for q, ts in qs:
        q = q.strip()
        if q and q not in seen:
            seen.add(q)
            out.append((q, ts))
    random.shuffle(out)
    return out[:MAX_QUERIES_PER_WT]


def naturalize_with_llm(webtoon_title, summary, base_queries):
    """(옵션) Gemini로 검색어를 자연스럽게 보강. 실패 시 base 그대로."""
    from llm_client import generate_json, available
    if not available():
        return base_queries
    prompt = (
        "다음 웹툰을 찾을 법한 자연스러운 한국어 검색어 3개를 JSON 배열로만 출력해라.\n"
        "설명·코드펜스 없이 배열만.\n"
        f"제목: {webtoon_title}\n줄거리: {summary[:300]}\n"
        f"참고 키워드: {', '.join(base_queries[:3])}\n"
        '예시 형식: ["완결된 달달한 로맨스", "회귀물 여주 성장", "먼치킨 판타지"]'
    )
    res = generate_json(prompt)
    if isinstance(res, list) and res:
        return [str(x).strip() for x in res if str(x).strip()][:MAX_QUERIES_PER_WT]
    return base_queries


def embed_text(title, summary, tags):
    """positive/negative 문서 텍스트 (build_embedding.py와 동일 컨셉)."""
    parts = []
    if summary:
        parts.append(summary)
    if tags:
        parts.append("태그: " + " ".join(tags))
    return " ".join(parts) if parts else title


def mine_hard_negatives(anchor_id, anchor_tags, tag_index, wt_tags, wt_genre, k):
    """
    태그 부분 겹침(JACCARD_LOW~HIGH) + 가능하면 동일 장르 = 하드 네거티브.
    tag_index: tag -> set(webtoon_id) (역색인)
    """
    a_set = set(anchor_tags)
    if not a_set:
        return []
    # 태그를 하나라도 공유하는 후보만 수집 (O(전체) 회피)
    cand = set()
    for t in a_set:
        cand |= tag_index.get(t, set())
    cand.discard(anchor_id)
    # 56k 규모 대비: 후보가 너무 많으면 표본만 스캔 (흔한 태그 폭발 방지)
    if len(cand) > MAX_CAND:
        cand = set(random.sample(list(cand), MAX_CAND))

    scored = []
    a_genre = wt_genre.get(anchor_id)
    for c in cand:
        c_set = wt_tags.get(c, set())
        if not c_set:
            continue
        inter = len(a_set & c_set)
        union = len(a_set | c_set)
        jac = inter / union if union else 0
        if JACCARD_LOW <= jac <= JACCARD_HIGH:
            # 동일 장르면 더 어려운 네거티브 → 가산점
            same_genre = (a_genre is not None and wt_genre.get(c) == a_genre)
            scored.append((c, jac, same_genre))
    # 동일 장르 우선, 그다음 겹침 큰 순 (더 헷갈리는 것)
    scored.sort(key=lambda x: (-int(x[2]), -x[1]))
    return [c for c, _, _ in scored[:k]]


def generate(webtoons, use_llm=False, test_ratio=0.1):
    """
    webtoons: [{'webtoon_id','title','summary','main_genre_id','tags'(list)}]
    반환: (triples, eval_rows)
    train/test 분리: 삼중항(학습)은 train 웹툰만, 평가쿼리는 test 웹툰만
      → 파인튜닝 전후 NDCG 비교가 '외운 것'이 아닌 일반화 성능을 재게 함.
    분리는 webtoon_id 해시로 결정적(재실행해도 동일).
    """
    random.seed(SEED)
    tag2axis = load_axis()

    def is_test(wid):
        # 결정적 분리: md5 해시 하위 버킷을 test로 (재실행해도 동일)
        import hashlib
        h = int(hashlib.md5(f"split:{wid}".encode()).hexdigest(), 16)
        return (h % 1000) < int(test_ratio * 1000)

    # 정규화 태그 + 역색인 + 장르맵
    wt_tags, wt_genre, wt_meta = {}, {}, {}
    tag_index = {}
    for w in webtoons:
        norm = set(t for t in (radar_token(x) for x in w["tags"]) if t)
        if w.get("summary") and len(norm) >= MIN_TAGS:
            wt_tags[w["webtoon_id"]] = norm
            wt_genre[w["webtoon_id"]] = w.get("main_genre_id")
            wt_meta[w["webtoon_id"]] = w
            for t in norm:
                tag_index.setdefault(t, set()).add(w["webtoon_id"])

    triples, eval_rows = [], []
    n_train = n_test = 0
    for wid, tags in wt_tags.items():
        w = wt_meta[wid]
        base_q = synth_queries(tags, tag2axis)   # [(쿼리, [소스태그])]
        if not base_q:
            continue

        if is_test(wid):
            # test 웹툰 → 평가쿼리만 (학습에 안 씀). 태그 relevance 판정용으로 소스태그 저장
            n_test += 1
            for q, qtags in base_q:
                eval_rows.append({"query": q, "relevant_id": wid, "query_tags": qtags})
            continue

        # train 웹툰 → 삼중항 생성 (LLM 보강은 쿼리 문자열만)
        n_train += 1
        queries = [q for q, _ in base_q]
        if use_llm:
            queries = naturalize_with_llm(w["title"], w.get("summary", ""), queries)
        pos_text = embed_text(w["title"], w.get("summary", ""), list(tags))
        hard = mine_hard_negatives(wid, tags, tag_index, wt_tags, wt_genre, N_HARD_PER_QUERY)
        for q in queries:
            if hard:
                for hn in hard:
                    hw = wt_meta[hn]
                    neg_text = embed_text(hw["title"], hw.get("summary", ""), list(wt_tags[hn]))
                    triples.append({"anchor": q, "positive": pos_text, "negative": neg_text})
            else:
                triples.append({"anchor": q, "positive": pos_text})

    print(f"  train 웹툰 {n_train:,} / test 웹툰 {n_test:,} (test_ratio={test_ratio})")
    return triples, eval_rows


def _load_from_db():
    import getpass, pymysql
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
                SELECT w.webtoon_id, w.title, w.summary, w.main_genre_id,
                    (SELECT GROUP_CONCAT(t.name SEPARATOR ',')
                     FROM webtoon_tag wt JOIN tag t ON wt.tag_id=t.tag_id
                     WHERE wt.webtoon_id=w.webtoon_id) AS tags
                FROM webtoon w
                WHERE w.summary IS NOT NULL AND w.summary != ''
            """)
            rows = cur.fetchall()
    finally:
        conn.close()
    out = []
    for wid, title, summary, genre, tags in rows:
        out.append({"webtoon_id": wid, "title": title, "summary": summary,
                    "main_genre_id": genre,
                    "tags": [t.strip() for t in (tags or "").split(",") if t.strip()]})
    return out


def _save(triples, eval_rows):
    os.makedirs(os.path.dirname(OUT_TRIPLES), exist_ok=True)
    with open(OUT_TRIPLES, "w", encoding="utf-8") as f:
        for r in triples:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with open(OUT_EVAL, "w", encoding="utf-8") as f:
        for r in eval_rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    n_triplet = sum(1 for r in triples if "negative" in r)
    print(f"[저장] {OUT_TRIPLES} (삼중항 {len(triples):,}개 / 하드네거티브 포함 {n_triplet:,})")
    print(f"[저장] {OUT_EVAL} (평가쿼리 {len(eval_rows):,}개)")


def demo():
    fake = [
        {"webtoon_id": 1, "title": "달달한 재벌 로맨스", "summary": "평범한 여자와 재벌남의 달달한 사내연애 이야기.",
         "main_genre_id": 10, "tags": ["로맨스", "완결로맨스", "달달", "다정남", "현대", "재벌"]},
        {"webtoon_id": 2, "title": "회귀한 검사", "summary": "죽었던 검사가 과거로 회귀해 복수하는 판타지.",
         "main_genre_id": 20, "tags": ["판타지", "회귀", "복수", "먼치킨", "성장"]},
        {"webtoon_id": 3, "title": "학원 로맨스물", "summary": "고등학교를 배경으로 한 풋풋한 첫사랑.",
         "main_genre_id": 10, "tags": ["로맨스", "학원", "첫사랑", "달달", "청춘"]},
        {"webtoon_id": 4, "title": "먼치킨 회귀 판타지", "summary": "회귀한 주인공이 먼치킨으로 성장하는 액션 판타지.",
         "main_genre_id": 20, "tags": ["판타지", "회귀", "먼치킨", "액션", "성장"]},
        {"webtoon_id": 5, "title": "집착남 로맨스", "summary": "집착하는 남자주인공과의 아슬아슬한 로맨스.",
         "main_genre_id": 10, "tags": ["로맨스", "집착", "다정남", "현대", "달달"]},
    ]
    triples, eval_rows = generate(fake, use_llm=False)
    print("=== 합성 쿼리 예시 ===")
    seen = set()
    for r in eval_rows:
        if r["relevant_id"] not in seen:
            seen.add(r["relevant_id"])
            print(f"  작품{r['relevant_id']} ← '{r['query']}'")
    print(f"\n=== 삼중항 예시 (하드 네거티브 확인) ===")
    for r in triples[:4]:
        neg = r.get("negative", "(없음)")
        print(f"  anchor: {r['anchor']}")
        print(f"    positive: {r['positive'][:35]}...")
        print(f"    negative: {neg[:35]}..." if neg != "(없음)" else "    negative: (없음)")
    print(f"\n삼중항 {len(triples)}개, 평가쿼리 {len(eval_rows)}개")
    print("(로맨스↔로맨스, 판타지↔판타지끼리 하드 네거티브로 잡히는지 확인)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", help="webtoon CSV (webtoon_id,title,summary,main_genre_id,tags)")
    ap.add_argument("--use-llm", action="store_true", help="합성 쿼리 Gemini 보강")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()

    if args.demo:
        demo()
        return
    if args.csv:
        import csv
        webtoons = []
        with open(args.csv, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                webtoons.append({
                    "webtoon_id": int(row["webtoon_id"]),
                    "title": row.get("title", ""),
                    "summary": row.get("summary", ""),
                    "main_genre_id": row.get("main_genre_id"),
                    "tags": [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()],
                })
    else:
        webtoons = _load_from_db()
    print(f"[로드] 웹툰 {len(webtoons):,}개")
    triples, eval_rows = generate(webtoons, use_llm=args.use_llm)
    _save(triples, eval_rows)


if __name__ == "__main__":
    main()
