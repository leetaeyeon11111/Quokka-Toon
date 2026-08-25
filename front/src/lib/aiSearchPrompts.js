// 인기 태그·장르·최근 AI 검색을 섞어 추천 문장을 만든다. 고정 문장 목록을 그대로 쓰지 않는다.

const TEMPLATES = [
  (seed) => `${seed} 느낌이 강한 웹툰`,
  (seed) => `${seed} 분위기로 푹 빠질 수 있는 작품`,
  (seed) => `${seed} 요소가 잘 살아있는 추천작`,
  (seed) => `오늘따라 ${seed} 이야기가 땡길 때`,
  (seed) => `${seed} 중심으로 전개되는 몰입형 웹툰`,
  (seed) => `${seed} 취향이면 꼭 한 번 볼 만한 작품`,
]

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/**
 * @param {{ tags?: string[], genres?: string[], recentAi?: string[], limit?: number }} options
 * @returns {{ label: string, query: string }[]}
 */
export function buildAiPromptSuggestions({
  tags = [],
  genres = [],
  recentAi = [],
  limit = 6,
} = {}) {
  const suggestions = []
  const seen = new Set()

  function push(label, query) {
    const key = query.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    suggestions.push({ label, query: query.trim() })
  }

  // 최근 AI 검색은 그대로 추천 문장으로 올린다.
  for (const query of recentAi) {
    push(query.length > 16 ? `${query.slice(0, 16)}…` : query, query)
  }

  const seeds = shuffle([...tags, ...genres].filter(Boolean))
  const templates = shuffle(TEMPLATES)

  seeds.forEach((seed, index) => {
    const template = templates[index % templates.length]
    const query = template(seed)
    push(seed, query)
  })

  return suggestions.slice(0, limit)
}
