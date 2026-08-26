"""
쿼카툰 - 자연어 검색 (기본 버전)
검색어 → KoSimCSE 임베딩 → FAISS 유사도 → kmas 우선 → 결과

실행:
  python search.py
  → 검색어 입력 → 추천 결과 + 유사도 + 매칭 태그

전제: build_embedding.py로 인덱스 생성 완료
"""
import json
import os
import pickle
from threading import Lock

# Must be set before faiss/torch/OpenMP load — duplicate libomp SIGSEGVs on macOS.
os.environ.setdefault('KMP_DUPLICATE_LIB_OK', 'TRUE')
os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')

import joblib
import numpy as np

MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'
# Apple Silicon MPS + concurrent uvicorn requests → torch SIGSEGV. Keep encoder on CPU.
ENCODER_DEVICE = os.environ.get('QUOKKA_ENCODER_DEVICE', 'cpu')
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
DATA_DIR = os.environ.get('QUOKKA_DATA_DIR', os.path.join(HERE, 'data'))
MODELS_DIR = os.environ.get('QUOKKA_MODELS_DIR', os.path.join(PROJECT_ROOT, 'models'))

# Serialize encode: SentenceTransformer/torch are not safe under concurrent races.
_encode_lock = Lock()


# 신조어 사전
try:
    with open(os.path.join(DATA_DIR, 'slang_dict.json'), encoding='utf-8') as f:
        SLANG = json.load(f)
except FileNotFoundError:
    SLANG = {}


class WebtoonSearcher:
    def __init__(self):
        print('검색 인덱스 로딩...')
        meta_path = os.path.join(MODELS_DIR, 'webtoon_meta.pkl')
        faiss_path = os.path.join(MODELS_DIR, 'webtoon_index.faiss')
        tfidf_path = os.path.join(MODELS_DIR, 'webtoon_tfidf.joblib')
        with open(meta_path, 'rb') as f:
            self.meta = pickle.load(f)

        self.mode = None
        if os.path.isfile(faiss_path):
            try:
                # Load torch/ST BEFORE faiss — importing faiss first can SIGSEGV with libomp.
                from sentence_transformers import SentenceTransformer
                import torch

                if ENCODER_DEVICE == 'cpu':
                    try:
                        torch.set_default_device('cpu')
                    except Exception:
                        pass
                    # Avoid accidental MPS even if ST internals probe availability.
                    try:
                        torch.backends.mps.is_available = lambda: False  # type: ignore[method-assign]
                    except Exception:
                        pass

                # Prefer offline cache; if missing, allow one download then stay local.
                try:
                    self.model = SentenceTransformer(
                        MODEL_NAME, device=ENCODER_DEVICE, local_files_only=True
                    )
                except Exception as local_exc:
                    print(f'로컬 임베딩 모델 없음 → 다운로드 시도 ({local_exc.__class__.__name__})')
                    self.model = SentenceTransformer(
                        MODEL_NAME, device=ENCODER_DEVICE, local_files_only=False
                    )
                self.model.to(ENCODER_DEVICE)

                import faiss

                self.mode = 'faiss'
                self.index = faiss.read_index(faiss_path)
                count = self.index.ntotal
            except Exception as faiss_exc:
                print(f'FAISS 엔진 로딩 실패 → TF-IDF 폴백 시도: {faiss_exc}')

        if self.mode is None and os.path.isfile(tfidf_path):
            self.mode = 'tfidf'
            payload = joblib.load(tfidf_path)
            self.vectorizer = payload['vectorizer']
            self.matrix = payload['matrix']
            count = self.matrix.shape[0]

        if self.mode is None:
            raise FileNotFoundError(
                '검색 엔진을 준비하지 못했습니다. '
                'models/webtoon_index.faiss + HuggingFace 모델(BM-K/KoSimCSE-roberta-multitask) '
                '또는 models/webtoon_tfidf.joblib 이 필요합니다.'
            )
        print(f'준비 완료({self.mode}): {count:,}개 웹툰')

    def _preprocess(self, query):
        """신조어 치환 (검색어에도 동일 적용)"""
        for k, v in SLANG.items():
            query = query.replace(k, v)
        return query

    def _matched_tags(self, query, tags_str):
        """검색어와 웹툰 태그의 교집합 (근거용)"""
        if tags_str is None or (isinstance(tags_str, float) and np.isnan(tags_str)):
            return []
        tags = str(tags_str).split(',')
        return [t for t in tags if t in query or any(kw in t for kw in query.split())]

    def search(self, query, top_k=10, kmas_first=True):
        q = self._preprocess(query)
        candidate_count = min(top_k * 3, len(self.meta['webtoon_ids']))

        if self.mode == 'faiss':
            import faiss

            with _encode_lock:
                q_emb = self.model.encode(
                    [q],
                    convert_to_numpy=True,
                    show_progress_bar=False,
                )
            q_emb = np.ascontiguousarray(q_emb, dtype=np.float32)
            faiss.normalize_L2(q_emb)
            scores, idxs = self.index.search(q_emb, candidate_count)
            score_pairs = zip(scores[0], idxs[0])
        else:
            q_vec = self.vectorizer.transform([q])
            similarities = (self.matrix @ q_vec.T).toarray().ravel()
            if candidate_count >= len(similarities):
                idxs = np.argsort(-similarities)
            else:
                idxs = np.argpartition(-similarities, candidate_count - 1)[:candidate_count]
                idxs = idxs[np.argsort(-similarities[idxs])]
            score_pairs = ((similarities[i], i) for i in idxs)

        results = []
        for score, i in score_pairs:
            results.append({
                'webtoon_id': self.meta['webtoon_ids'][i],
                'title': self.meta['titles'][i],
                'source': self.meta['sources'][i],
                'score_query': round(float(score) * 100, 1),
                'tags': self.meta['tags'][i],
                'matched_tags': self._matched_tags(q, self.meta['tags'][i]),
                'summary': str(self.meta['summaries'][i])[:80],
                'engine': self.mode,
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
