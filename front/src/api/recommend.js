// 추천 API 진입점.
//
// 지금은 lib/similarity.js의 bigram 코사인 유사도로 프론트에서 직접 계산하지만,
// 실제 NLP 추천 백엔드가 준비되면 이 파일 내부만 fetch() 호출로 교체하면 되도록
// 화면 컴포넌트는 이 함수들의 시그니처에만 의존하게 한다.

import { WEBTOONS } from '../data/webtoons'
import { scoreWebtoon, getSimilarWebtoons as computeSimilar } from '../lib/similarity'

/**
 * 검색어 기반 웹툰 추천 목록을 반환한다.
 * @param {string} query
 * @param {{ tasteTags?: string[], limit?: number }} options
 */
export function getRecommendations(query, { tasteTags = [], limit = 10 } = {}) {
  if (!query?.trim()) return []

  return WEBTOONS.map((webtoon) => ({
    webtoon,
    ...scoreWebtoon(query, webtoon, tasteTags),
  }))
    .filter((result) => result.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
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
