// 추천 API 진입점.
// 자연어 추천은 React → Spring → FastAPI 순서로 호출한다.

import { api } from './client'
import { getWebtoon, searchWebtoons } from './webtoon'
import { toCardModel, toDetailModel } from '../lib/webtoon'

function clampScore(value) {
  const score = Math.round(Number(value) || 0)
  return Math.max(0, Math.min(100, score))
}

function toAxisTags(radar) {
  const axes = Array.isArray(radar?.axes) ? radar.axes : []
  const values = Array.isArray(radar?.values) ? radar.values : []
  return axes.slice(0, 5).map((name, index) => ({
    name,
    value: clampScore(values[index]),
  }))
}

/**
 * 검색어 기반 웹툰 추천 목록을 반환한다.
 * @param {string} query
 * @param {{ tasteTags?: string[], limit?: number }} options
 */
export async function getRecommendations(query, { limit = 10 } = {}) {
  if (!query?.trim()) return []

  const response = await api.post('/api/recommend', { query: query.trim() })
  const items = Array.isArray(response?.results) ? response.results.slice(0, limit) : []
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const detail = await getWebtoon(item.webtoonId)
        const webtoon = toDetailModel(detail)
        return {
          webtoon: {
            ...webtoon,
            catchphrase: webtoon.aiSummary ?? item.reasonText,
          },
          reasonText: item.reasonText,
          queryScore: clampScore(item.scoreQuery),
          tasteScore: clampScore(item.scoreTaste),
          total: clampScore(item.scoreTotal),
          axisTags: toAxisTags(item.radar),
        }
      } catch {
        return null
      }
    }),
  )

  return results.filter(Boolean)
}

/**
 * 특정 웹툰과 비슷한 작품 (장르 기반 실 DB 검색).
 */
export async function getSimilarWebtoons(webtoon, limit = 5) {
  const genre = webtoon?.genres?.[0] ?? webtoon?.genre ?? webtoon?.mainGenre
  if (!genre) return []
  const data = await searchWebtoons({ genre, size: limit + 4 })
  const selfId = String(webtoon.id)
  return (data?.content ?? [])
    .map(toCardModel)
    .filter((w) => String(w.id) !== selfId)
    .slice(0, limit)
}

/**
 * 취향 태그 기반 추천 (실 DB 태그 검색).
 */
export async function getRecommendationsByTaste(tasteTags, { excludeIds = [], limit = 10 } = {}) {
  if (!tasteTags?.length) return []
  const tag = typeof tasteTags[0] === 'string' ? tasteTags[0] : tasteTags[0]?.name
  if (!tag) return []
  const excluded = new Set(excludeIds.map(String))
  const data = await searchWebtoons({ tag, size: limit + excluded.size })
  return (data?.content ?? [])
    .map(toCardModel)
    .filter((w) => !excluded.has(String(w.id)))
    .slice(0, limit)
    .map((webtoon) => ({ webtoon, score: 1 }))
}
