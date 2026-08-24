"""
쿼카툰 - 자연어 검색 (기본 버전)
검색어 → KoSimCSE 임베딩 → FAISS 유사도 → kmas 우선 → 결과

실행:
  python search.py
  → 검색어 입력 → 추천 결과 + 유사도 + 매칭 태그

전제: build_embedding.py로 인덱스 생성 완료
"""
import json
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'

# 신조어 사전
try:
    with open('../data/slang_dict.json', encoding='utf-8') as f:
        SLANG = json.load(f)
except FileNotFoundError:
    SLANG = {}


class WebtoonSearcher:
    def __init__(self):
        print('모델 + 인덱스 로딩...')
        self.model = SentenceTransformer(MODEL_NAME)
        self.index = faiss.read_index('../models/webtoon_index.faiss')
        with open('../models/webtoon_meta.pkl', 'rb') as f:
            self.meta = pickle.load(f)
        print(f'준비 완료: {self.index.ntotal:,}개 웹툰')

    def _preprocess(self, query):
        """신조어 치환 (검색어에도 동일 적용)"""
        for k, v in SLANG.items():
            query = query.replace(k, v)
        return query

    def _matched_tags(self, query, tags_str):
        """검색어와 웹툰 태그의 교집합 (근거용)"""
        if not tags_str:
            return []
        tags = str(tags_str).split(',')
        return [t for t in tags if t in query or any(kw in t for kw in query.split())]

    def search(self, query, top_k=10, kmas_first=True):
        q = self._preprocess(query)
        q_emb = self.model.encode([q])
        faiss.normalize_L2(q_emb)

        # 넉넉히 뽑고 후처리 (kmas 우선 재정렬 위해)
        scores, idxs = self.index.search(q_emb, top_k * 3)

        results = []
        for score, i in zip(scores[0], idxs[0]):
            results.append({
                'webtoon_id': self.meta['webtoon_ids'][i],
                'title': self.meta['titles'][i],
                'source': self.meta['sources'][i],
                'score_query': round(float(score) * 100, 1),
                'tags': self.meta['tags'][i],
                'matched_tags': self._matched_tags(q, self.meta['tags'][i]),
                'summary': str(self.meta['summaries'][i])[:80],
            })

        # kmas 우선 정렬 (같은 유사도대면 kmas를 앞으로)
        if kmas_first:
            results.sort(key=lambda x: (x['source'] != 'kmas', -x['score_query']))

        return results[:top_k]


def main():
    searcher = WebtoonSearcher()
    print()
    print('검색어를 입력하세요 (종료: q)')
    while True:
        query = input('\n검색> ').strip()
        if query.lower() == 'q':
            break
        if not query:
            continue

        results = searcher.search(query, top_k=5)
        print(f'\n[{query}] 검색 결과 상위 5개:')
        for i, r in enumerate(results, 1):
            tags = f" | 매칭: {', '.join(r['matched_tags'])}" if r['matched_tags'] else ''
            print(f"  {i}. [{r['title']}] 유사도 {r['score_query']}% ({r['source']}){tags}")
            print(f"     {r['summary']}...")


if __name__ == '__main__':
    main()
