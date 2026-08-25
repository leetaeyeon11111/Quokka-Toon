import unittest
from types import SimpleNamespace
from unittest.mock import patch

from ai import api


class EnrichAllTest(unittest.TestCase):
    def setUp(self):
        self.pipeline = SimpleNamespace(
            full_summary={webtoon_id: f"summary-{webtoon_id}" for webtoon_id in range(1, 13)},
            full_tags={webtoon_id: ["tag"] for webtoon_id in range(1, 13)},
            genre={webtoon_id: 1 for webtoon_id in range(1, 13)},
        )
        self.ranked = [
            {"webtoon_id": webtoon_id, "title": f"title-{webtoon_id}"}
            for webtoon_id in range(1, 13)
        ]

    def test_generates_all_twelve_and_saves_once(self):
        saved = {}

        def generate(_, candidate):
            return {
                "reason": f"reason-{candidate['webtoon_id']}",
                "radar": [],
                "source": "llm",
            }

        def save(cache):
            saved.update(cache)

        with (
            patch.object(api, "llm_available", return_value=True),
            patch.object(api, "load_enrichment_cache", return_value={}),
            patch.object(api, "_generate_enrichment", side_effect=generate) as generator,
            patch.object(api, "save_enrichment_cache", side_effect=save) as saver,
        ):
            result = api._enrich_all(self.pipeline, self.ranked)

        self.assertEqual(12, generator.call_count)
        self.assertEqual(1, saver.call_count)
        self.assertEqual(set(range(1, 13)), set(result))
        self.assertEqual(result, saved)

    def test_reuses_cache_without_gemini_calls(self):
        cache = {
            webtoon_id: {"reason": "cached", "radar": [], "source": "llm"}
            for webtoon_id in range(1, 13)
        }
        with (
            patch.object(api, "llm_available", return_value=True),
            patch.object(api, "load_enrichment_cache", return_value=cache),
            patch.object(api, "_generate_enrichment") as generator,
            patch.object(api, "save_enrichment_cache") as saver,
        ):
            result = api._enrich_all(self.pipeline, self.ranked)

        self.assertEqual(cache, result)
        generator.assert_not_called()
        saver.assert_not_called()


if __name__ == "__main__":
    unittest.main()
