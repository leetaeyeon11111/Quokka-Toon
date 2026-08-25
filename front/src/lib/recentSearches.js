const KEYWORD_RECENT_KEY = 'quokkatoon:recent-keyword-searches'
const AI_RECENT_KEY = 'quokkatoon:recent-ai-searches'
const AI_MODE_KEY = 'quokkatoon:search-ai-mode'

function readList(key) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string' && item.trim()).slice(0, 8) : []
  } catch {
    return []
  }
}

export function readRecentKeywordSearches() {
  return readList(KEYWORD_RECENT_KEY)
}

export function writeRecentKeywordSearches(items) {
  window.localStorage.setItem(KEYWORD_RECENT_KEY, JSON.stringify(items.slice(0, 8)))
}

export function rememberKeywordSearch(query, previous = readRecentKeywordSearches()) {
  const trimmed = query.trim()
  if (!trimmed) return previous
  const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(0, 8)
  writeRecentKeywordSearches(next)
  return next
}

export function readRecentAiSearches() {
  return readList(AI_RECENT_KEY)
}

export function writeRecentAiSearches(items) {
  window.localStorage.setItem(AI_RECENT_KEY, JSON.stringify(items.slice(0, 8)))
}

export function rememberAiSearch(query, previous = readRecentAiSearches()) {
  const trimmed = query.trim()
  if (!trimmed) return previous
  const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(0, 8)
  writeRecentAiSearches(next)
  return next
}

export function readAiSearchMode() {
  return window.localStorage.getItem(AI_MODE_KEY) === '1'
}

export function writeAiSearchMode(enabled) {
  window.localStorage.setItem(AI_MODE_KEY, enabled ? '1' : '0')
}
