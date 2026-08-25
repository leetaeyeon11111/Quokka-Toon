"""
쿼카툰 - 통합 검색 CLI (검색 + 필터 + radar + rerank)
=====================================================
네 search.py(WebtoonSearcher)를 그대로 재활용하고, 그 위에
  - parse_query   : "완결된 달달한 로맨스" → 필터 + 검색어 분리 (filter_meta)
  - 필터 적용     : serial_status/age/media_mix (webtoon_filter_meta.pkl)
  - rerank        : 인기 재정렬 (신호 없으면 자동 skip)
  - radar/ai_summary 표시
를 얹는다. search.py는 수정하지 않음.

실행:
  python search_demo.py                      # 대화형
  python search_demo.py "완결된 달달한 로맨스"  # 단발
"""
import os
import pickle
import sys

from filter_meta import parse_query, match_filters
from rerank import rerank
from make_radar_llm import ensure_enrichment          # 추천이유+동적radar 통합
from make_reason import template_reason
from make_radar_llm import load_cache as load_llm_cache
from llm_client import get_client

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.environ.get("QUOKKA_MODELS_DIR", os.path.join(HERE, "..", "models"))
FILTER_META = os.path.join(MODELS_DIR, "webtoon_filter_meta.pkl")
RADAR = os.path.join(MODELS_DIR, "webtoon_radar.pkl")


def _load(path):
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return {}


class Pipeline:
    def __init__(self):
        from search import WebtoonSearcher      # 네 검색기 재활용
        self.searcher = WebtoonSearcher()
        self.fmeta = _load(FILTER_META)
        self.radar = _load(RADAR)
        # 추천 이유용: id -> (전체 줄거리, 태그리스트, 장르) 맵 (searcher.meta 재활용)
        m = self.searcher.meta
        ids = m["webtoon_ids"]
        self.full_summary = dict(zip(ids, m["summaries"]))
        self.full_tags = {
            ids[i]: [
                tag.strip()
                for tag in str(m["tags"][i] or "").split(",")
                if tag.strip() and tag.strip().lower() != "nan"
            ]
            for i in range(len(ids))
        }
        self.genre = dict(zip(ids, m.get("genre_ids", [None] * len(ids))))
        print(f"필터메타 {len(self.fmeta):,} / radar {len(self.radar):,} 로드")

    def search(self, query, top_k=10, pool=100):
        filters, content = parse_query(query)
        # 필터가 있으면 후보 넓게, 없으면 top_k만
        n = pool if filters else top_k
        raw = self.searcher.search(content or query, top_k=n)

        # search.py는 score_query 키 → rerank는 score_total 기대. 매핑.
        cands = []
        for r in raw:
            r = dict(r)
            r["score_total"] = r.get("score_query", 0)
            cands.append(r)

        # 필터 적용
        if filters:
            kept = [c for c in cands
                    if match_filters(self.fmeta.get(c["webtoon_id"], {}), filters)]
        else:
            kept = cands

        # 인기 재정렬 (신호 없으면 자동 순수 적합도 순)
        ranked = rerank(kept, top_k=top_k)
        return filters, content, ranked

    def show(self, query, top_k=5, reason=False):
        filters, content, results = self.search(query, top_k=top_k)
        print(f"\n[검색어] {query}")
        print(f"  → 필터: {filters or '없음'} / 의미검색: '{content}'")
        print(f"  → 결과 {len(results)}개")
        cache = load_llm_cache() if reason else None
        client = get_client() if reason else None
        for i, r in enumerate(results, 1):
            wid = r["webtoon_id"]
            mt = r.get("matched_tags") or []
            mt_str = f"  매칭:{','.join(mt)}" if mt else ""
            print(f"  {i}. [{r['title']}] {r['score_total']}% ({r.get('source','?')}){mt_str}")

            if reason:
                # Lazy: 추천이유 + 동적 radar를 한 번에 (캐시 우선, 실패 시 폴백)
                enr = ensure_enrichment(wid, r["title"],
                                        self.full_summary.get(wid, ""),
                                        self.full_tags.get(wid, []),
                                        self.genre.get(wid),
                                        cache=cache, client=client)
                if enr and enr.get("summary"):
                    print(f'     "{enr["summary"]}"')
                if enr and enr.get("radar"):
                    axes = " ".join(f"{a['axis']}:{a['score']}" for a in enr["radar"])
                    print(f"     radar[{axes}]  ({enr.get('source','?')})")
                if enr and enr.get("reason"):
                    print(f"     추천이유: {enr['reason']}")
            else:
                # reason 미사용 시: 기존 고정 5축 radar 표시
                rd = self.radar.get(wid)
                if rd:
                    axes = " ".join(f"{k}:{v}" for k, v in rd.items())
                    print(f"     radar[{axes}]")


def main():
    # --reason 플래그: 추천 이유 생성(LLM) 켜기
    args = sys.argv[1:]
    reason = "--reason" in args
    args = [a for a in args if a != "--reason"]

    pipe = Pipeline()
    if args:
        pipe.show(" ".join(args), reason=reason)
        return
    print("\n검색어 입력 (종료: q)" + ("  [추천이유 ON]" if reason else ""))
    while True:
        try:
            q = input("\n검색> ").strip()
        except EOFError:
            break
        if q.lower() == "q" or not q:
            break
        pipe.show(q, reason=reason)


if __name__ == "__main__":
    main()
