// 추천 API 진입점.
//
// 자연어 추천은 React → Spring → FastAPI 순서로 호출한다.
// 상세/취향 추천의 기존 프론트 계산은 별도 화면 호환을 위해 유지한다.

import { WEBTOONS } from '../data/webtoons'
import { getSimilarWebtoons as computeSimilar } from '../lib/similarity'
import { api } from './client'
import { getWebtoon } from './webtoon'
import { toDetailModel } from '../lib/webtoon'

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
 * 특정 웹툰과 콘텐츠가 비슷한 다른 작품을 반환한다. (상세페이지 "비슷한 작품")
 */
export function getSimilarWebtoons(webtoon, limit = 5) {
  return computeSimilar(webtoon, WEBTOONS, limit)
}

/**
 * 검색어 없이 취향 태그만으로 추천한다. (마이페이지 "취향 리포트" 하단 추천)
 */
export function getRecommendationsByTaste(tasteTags, { excludeIds = [], limit = 10 } = {}) {
  if (!tasteTags.length) return []
  const owned = new Set(tasteTags.map((t) => t.toLowerCase()))

  return WEBTOONS.filter((webtoon) => !excludeIds.includes(webtoon.id))
    .map((webtoon) => {
      const matched = webtoon.tags.filter((tag) => owned.has(tag.name.toLowerCase()))
      const score = matched.reduce((sum, tag) => sum + tag.weight, 0)
      return { webtoon, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.webtoon)
}
