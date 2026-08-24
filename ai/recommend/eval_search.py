"""
쿼카툰 - 검색 평가 (태그 relevance 기반 NDCG@10 / P@10)
======================================================
평가 방식: "쿼리 태그를 모두 가진 웹툰"을 정답(relevant)으로 본다.
  예) 쿼리 "회귀 판타지" → 회귀 AND 판타지 태그를 가진 웹툰 전부가 정답.
  검색이 이런 웹툰을 상위에 올리는지 = 검색 의도 부합도.
  (이전의 '정답 1개' 방식은 2단어 쿼리에 맞는 작품이 수백 개라 부적절했음)

지표:
  NDCG@10 : 상위 10 결과의 관련도 순위 품질 (0~1)
  P@10    : 상위 10 중 관련 작품 비율
  Hit@10  : 관련 작품이 상위 10에 하나라도 있는 비율

주의: 합성 쿼리+태그 기반이라 절대값은 낙관적. 파인튜닝 '전 vs 후' 비교가 핵심.
test 웹툰(학습 제외)의 쿼리로만 평가.

실행:
  python eval_search.py                              # 파인튜닝 전(기본 KoSimCSE)
  python eval_search.py --model ../models/finetuned  # 파인튜닝 후
  python eval_search.py --limit 3000
"""
import argparse
import json
import math
import os
import pickle

import numpy as np
from filter_meta import radar_token

HERE = os.path.dirname(os.path.abspath(__file__))
DEF_INDEX = os.path.join(HERE, "..", "models", "webtoon_index.faiss")
DEF_META = os.path.join(HERE, "..", "models", "webtoon_meta.pkl")
DEF_EVAL = os.path.join(HERE, "..", "data", "eval_queries.jsonl")
DEF_MODEL = "BM-K/KoSimCSE-roberta-multitask"


def load_eval(path, limit=None):
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            rows.append(json.loads(line))
            if limit and len(rows) >= limit:
                break
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEF_MODEL)
    ap.add_argument("--index", default=DEF_INDEX)
    ap.add_argument("--meta", default=DEF_META)
    ap.add_argument("--eval", default=DEF_EVAL)
    ap.add_argument("--k", type=int, default=10)
    ap.add_argument("--pool", type=int, default=50)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--batch", type=int, default=256)
    ap.add_argument("--tagged-only", action="store_true",
                    help="태그 있는 웹툰만 검색 풀로 사용(태그 없는 kmas 등 제외)")
    args = ap.parse_args()

    import faiss
    from sentence_transformers import SentenceTransformer

    print(f"[모델] {args.model}")
    model = SentenceTransformer(args.model)
    index = faiss.read_index(args.index)
    with open(args.meta, "rb") as f:
        meta = pickle.load(f)

    pos_tags = [set(radar_token(t) for t in str(tg or "").split(",") if t.strip())
                for tg in meta["tags"]]
    pos_tags = [set(t for t in s if t) for s in pos_tags]
    # 태그 → 그 태그 가진 웹툰 위치 역색인 (정답 집합 계산용)
    tag_index = {}
    for i, s in enumerate(pos_tags):
        for t in s:
            tag_index.setdefault(t, set()).add(i)

    # tagged-only: 태그 있는 웹툰만 담은 서브 인덱스 구성 (원본 인덱스는 유지)
    localmap = None
    search_index = index
    if args.tagged_only:
        tagged_pos = [i for i in range(len(pos_tags)) if pos_tags[i]]
        all_vecs = index.reconstruct_n(0, index.ntotal)
        sub_vecs = all_vecs[tagged_pos]
        sub = faiss.IndexFlatIP(sub_vecs.shape[1])
        sub.add(sub_vecs)
        search_index = sub
        localmap = tagged_pos   # 서브위치 → 원본위치
        print(f"[tagged-only] 검색 풀 {len(tagged_pos):,}개 (전체 {index.ntotal:,} 중 태그 보유)")

    rows = load_eval(args.eval, limit=args.limit)
    rows = [r for r in rows if r.get("query_tags")]
    print(f"[평가] 쿼리 {len(rows):,}개 (태그 relevance)")

    queries = [r["query"] for r in rows]
    emb = model.encode(queries, batch_size=args.batch, convert_to_numpy=True,
                       show_progress_bar=True)
    faiss.normalize_L2(emb)
    _, idxs = search_index.search(emb, args.pool)
    # 서브 인덱스면 원본 위치로 환원
    if localmap is not None:
        idxs = np.array([[localmap[p] for p in row] for row in idxs])

    k = args.k
    ndcg_sum = p_sum = hit_sum = 0.0
    n = len(rows)
    for qi, r in enumerate(rows):
        qtags = [radar_token(t) for t in r["query_tags"]]
        qtags = [t for t in qtags if t]
        if not qtags:
            n -= 1
            continue
        # 정답 집합 = 쿼리 태그를 '모두' 가진 웹툰
        relevant = None
        for t in qtags:
            s = tag_index.get(t, set())
            relevant = s if relevant is None else (relevant & s)
        relevant = relevant or set()
        R = len(relevant)
        if R == 0:
            n -= 1
            continue
        # 상위 k에서 DCG / P / Hit
        dcg = 0.0
        hits = 0
        for rank, pos in enumerate(idxs[qi][:k], start=1):
            if pos in relevant:
                dcg += 1.0 / math.log2(rank + 1)
                hits += 1
        idcg = sum(1.0 / math.log2(i + 1) for i in range(1, min(k, R) + 1))
        ndcg_sum += (dcg / idcg) if idcg else 0
        p_sum += hits / k
        hit_sum += 1 if hits > 0 else 0

    print("\n=== 결과 ===")
    print(f"  모델   : {args.model}")
    print(f"  평가수 : {n:,}")
    print(f"  NDCG@{k}: {ndcg_sum / n:.4f}")
    print(f"  P@{k}   : {p_sum / n:.4f}")
    print(f"  Hit@{k} : {hit_sum / n:.4f}")
    print("\n※ 합성 쿼리+태그 기반, 절대값은 낙관적. 파인튜닝 전/후 '차이'로 해석.")


if __name__ == "__main__":
    main()
