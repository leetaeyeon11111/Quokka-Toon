"""FastAPI adapter for the Quokka-Toon semantic recommendation pipeline."""

import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from make_radar_llm import (
    ensure_enrichment,
    load_cache as load_enrichment_cache,
    save_cache as save_enrichment_cache,
)
from make_reason import template_reason
from search_demo import Pipeline
from llm_client import available as llm_available


MODELS_DIR = os.environ.get("QUOKKA_MODELS_DIR", os.path.join(PROJECT_ROOT, "models"))
META_FILE = "webtoon_meta.pkl"
SEARCH_INDEX_FILES = ("webtoon_index.faiss", "webtoon_tfidf.joblib")
LLM_WORKERS = max(1, int(os.environ.get("QUOKKA_LLM_WORKERS", "4")))
_enrichment_lock = Lock()


class RecommendRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    userId: int | None = None


class RadarPayload(BaseModel):
    axes: list[str]
    values: list[int]


class RecommendItem(BaseModel):
    webtoonId: int
    reasonText: str
    scoreQuery: int
    scoreTaste: int
    scoreTotal: int
    radar: RadarPayload


class RecommendResponse(BaseModel):
    query: str
    results: list[RecommendItem]


app = FastAPI(title="Quokka-Toon AI Recommendation API", version="1.0.0")


def _missing_model_files() -> list[str]:
    missing = []
    if not os.path.isfile(os.path.join(MODELS_DIR, META_FILE)):
        missing.append(os.path.join(MODELS_DIR, META_FILE))
    if not any(os.path.isfile(os.path.join(MODELS_DIR, name)) for name in SEARCH_INDEX_FILES):
        missing.append("FAISS 또는 TF-IDF 검색 인덱스")
    return missing


def _search_engine() -> str | None:
    if os.path.isfile(os.path.join(MODELS_DIR, "webtoon_index.faiss")):
        return "faiss"
    if os.path.isfile(os.path.join(MODELS_DIR, "webtoon_tfidf.joblib")):
        return "tfidf"
    return None


@lru_cache(maxsize=1)
def get_pipeline() -> Pipeline:
    missing = _missing_model_files()
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"필수 AI 모델 파일이 없습니다: {joined}")
    return Pipeline()


def _score(value: Any) -> int:
    try:
        return max(0, min(100, round(float(value))))
    except (TypeError, ValueError):
        return 0


def _radar_payload(raw: Any) -> RadarPayload:
    axes: list[str] = []
    values: list[int] = []

    if isinstance(raw, dict):
        axes = [str(key) for key in raw.keys()]
        values = [_score(value) for value in raw.values()]
    elif isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict):
                continue
            axis = item.get("axis") or item.get("name")
            if axis:
                axes.append(str(axis))
                values.append(_score(item.get("score", item.get("value", 0))))

    return RadarPayload(axes=axes[:5], values=values[:5])


def _generate_enrichment(pipeline: Pipeline, candidate: dict[str, Any]) -> dict[str, Any]:
    """Generate one uncached result without writing the shared pickle file."""
    webtoon_id = int(candidate["webtoon_id"])
    return ensure_enrichment(
        webtoon_id,
        candidate.get("title", ""),
        pipeline.full_summary.get(webtoon_id, ""),
        pipeline.full_tags.get(webtoon_id, []),
        pipeline.genre.get(webtoon_id),
        cache={},
        save=False,
    )


def _enrich_all(pipeline: Pipeline, ranked: list[dict[str, Any]]) -> dict[int, Any]:
    """Fill Gemini metadata for every uncached recommendation and persist once."""
    cache = load_enrichment_cache()
    if not llm_available():
        return cache

    # Avoid duplicate Gemini calls and competing pickle writes when requests overlap.
    with _enrichment_lock:
        cache = load_enrichment_cache()
        missing = [
            candidate
            for candidate in ranked
            if not cache.get(int(candidate["webtoon_id"]))
        ]
        if not missing:
            return cache

        generated: dict[int, dict[str, Any]] = {}
        worker_count = min(LLM_WORKERS, len(missing))
        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            future_to_id = {
                executor.submit(_generate_enrichment, pipeline, candidate): int(candidate["webtoon_id"])
                for candidate in missing
            }
            for future in as_completed(future_to_id):
                webtoon_id = future_to_id[future]
                try:
                    enrichment = future.result()
                except Exception:
                    # One failed Gemini response must not fail the other 11 results.
                    continue
                if enrichment and enrichment.get("source") == "llm":
                    generated[webtoon_id] = enrichment

        if generated:
            cache.update(generated)
            save_enrichment_cache(cache)
        return cache


@app.get("/health")
def health() -> dict[str, Any]:
    missing = _missing_model_files()
    return {
        "status": "ready" if not missing else "missing-models",
        "modelsDir": MODELS_DIR,
        "engine": _search_engine(),
        "llmReady": llm_available(),
        "missing": missing,
    }


@app.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest) -> RecommendResponse:
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="query는 비어 있을 수 없습니다.")

    try:
        pipeline = get_pipeline()
        _, _, ranked = pipeline.search(query, top_k=12)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    enrichment_cache = _enrich_all(pipeline, ranked)
    results: list[RecommendItem] = []

    for candidate in ranked:
        webtoon_id = int(candidate["webtoon_id"])
        tags = pipeline.full_tags.get(webtoon_id, [])
        enrichment = enrichment_cache.get(webtoon_id) or {}
        radar = _radar_payload(enrichment.get("radar") or pipeline.radar.get(webtoon_id))
        reason = enrichment.get("reason") or template_reason(
            candidate.get("title", ""),
            tags,
            candidate.get("matched_tags") or [],
            enrichment.get("radar"),
        )
        score_query = _score(candidate.get("score_query"))
        score_total = _score(candidate.get("score_total", score_query))

        results.append(
            RecommendItem(
                webtoonId=webtoon_id,
                reasonText=reason,
                scoreQuery=score_query,
                scoreTaste=0,
                scoreTotal=score_total,
                radar=radar,
            )
        )

    return RecommendResponse(query=query, results=results)
