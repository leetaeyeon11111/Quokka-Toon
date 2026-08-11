// 자연어 처리(NLP) 유사도 계산 유틸리티
//
// 형태소 분석기 없이도 한국어 문장 간 유사도를 계산할 수 있도록
// 문자 단위 bigram(2-gram) 벡터 + 코사인 유사도 방식을 사용한다.
// 실제 추천 백엔드가 붙기 전까지 프론트 단독으로 동작하는 자리표시자 구현이며,
// src/api/recommend.js 뒤에 숨겨져 있어 나중에 서버 API 호출로 손쉽게 교체할 수 있다.

function normalize(text) {
  return (text ?? '')
    .toString()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

export function bigramVector(text) {
  const normalized = normalize(text)
  const vector = new Map()
  if (normalized.length < 2) {
    if (normalized.length === 1) vector.set(normalized, 1)
    return vector
  }
  for (let i = 0; i < normalized.length - 1; i++) {
    const gram = normalized.slice(i, i + 2)
    vector.set(gram, (vector.get(gram) ?? 0) + 1)
  }
  return vector
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA.size || !vecB.size) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (const value of vecA.values()) normA += value * value
  for (const value of vecB.values()) normB += value * value

  const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA]
  for (const [gram, value] of smaller) {
    const other = larger.get(gram)
    if (other) dot += value * other
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function textSimilarity(a, b) {
  return cosineSimilarity(bigramVector(a), bigramVector(b))
}

export function webtoonSearchText(webtoon) {
  return [
    webtoon.title,
    webtoon.synopsis,
    webtoon.authors?.writer,
    webtoon.authors?.artist,
    webtoon.genre,
    ...(webtoon.tags ?? []).map((t) => t.name),
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * 검색어 + (선택) 취향 태그를 기준으로 웹툰 한 편의 추천 점수를 계산한다.
 * @param {string} query 검색어(자연어 문장 또는 키워드)
 * @param {object} webtoon 웹툰 mock 데이터
 * @param {string[]} tasteTags 사용자 취향 태그 목록 (로그인 전에는 빈 배열 -> 취향기반 0점)
 */
export function scoreWebtoon(query, webtoon, tasteTags = []) {
  const queryVec = bigramVector(query)
  const contentVec = bigramVector(webtoonSearchText(webtoon))

  let queryScore = cosineSimilarity(queryVec, contentVec) * 100

  // 태그 이름이 검색어에 그대로 포함되면 직접 매칭 가점을 준다.
  const normalizedQuery = normalize(query)
  const tagBoost = (webtoon.tags ?? []).some(
    (tag) => normalizedQuery.length > 0 && normalizedQuery.includes(normalize(tag.name)),
  )
    ? 15
    : 0
  queryScore = Math.min(100, Math.round(queryScore + tagBoost))

  let tasteScore = 0
  if (tasteTags.length) {
    const ownedTags = new Set(tasteTags.map(normalize))
    const matched = (webtoon.tags ?? []).filter((tag) => ownedTags.has(normalize(tag.name)))
    const weightSum = matched.reduce((sum, tag) => sum + tag.weight, 0)
    tasteScore = Math.min(100, Math.round(weightSum / Math.max(1, tasteTags.length)))
  }

  const total = Math.max(queryScore, Math.round(queryScore * 0.7 + tasteScore * 0.3))

  const axisTags = [...(webtoon.tags ?? [])]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((tag) => {
      const querySim = query ? textSimilarity(query, tag.name) : 0
      const axisValue = Math.round(tag.weight * (0.55 + 0.45 * querySim))
      return { name: tag.name, value: Math.min(100, Math.max(8, axisValue)) }
    })

  return { queryScore, tasteScore, total, axisTags }
}

/**
 * 특정 웹툰과 콘텐츠(줄거리+태그) 유사도가 높은 다른 작품을 찾는다.
 */
export function getSimilarWebtoons(webtoon, all, limit = 5) {
  const baseVec = bigramVector(webtoonSearchText(webtoon))
  return all
    .filter((candidate) => candidate.id !== webtoon.id)
    .map((candidate) => ({
      webtoon: candidate,
      similarity: cosineSimilarity(baseVec, bigramVector(webtoonSearchText(candidate))),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((entry) => entry.webtoon)
}
