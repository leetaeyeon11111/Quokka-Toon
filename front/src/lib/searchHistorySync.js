import {
  clearSearchHistory,
  deleteSearchHistoryKeyword,
  hasSearchHistoryAuth,
  listSearchHistory,
  recordSearchHistory,
} from '../api/searchHistory'
import {
  readRecentAiSearches,
  readRecentKeywordSearches,
  rememberAiSearch,
  rememberKeywordSearch,
  writeRecentAiSearches,
  writeRecentKeywordSearches,
} from './recentSearches'

function keywordsFromServer(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (typeof item === 'string' ? item : item?.keyword))
    .filter((keyword) => typeof keyword === 'string' && keyword.trim())
    .slice(0, 8)
}

/** 로그인 시 서버, 비로그인 시 localStorage 에서 모드별 최근 검색을 읽는다. */
export async function loadRecentSearches(mode) {
  const isAi = mode === 'AI'
  if (!hasSearchHistoryAuth()) {
    return isAi ? readRecentAiSearches() : readRecentKeywordSearches()
  }
  try {
    const items = await listSearchHistory(mode)
    const keywords = keywordsFromServer(items)
    if (isAi) writeRecentAiSearches(keywords)
    else writeRecentKeywordSearches(keywords)
    return keywords
  } catch {
    return isAi ? readRecentAiSearches() : readRecentKeywordSearches()
  }
}

/** 검색 실행 기록. 로컬은 항상, 로그인이면 서버에도 모드별로 남긴다. */
export async function rememberSearch(keyword, mode) {
  const trimmed = (keyword ?? '').trim()
  if (!trimmed) {
    return mode === 'AI' ? readRecentAiSearches() : readRecentKeywordSearches()
  }

  const localNext =
    mode === 'AI'
      ? rememberAiSearch(trimmed)
      : rememberKeywordSearch(trimmed)

  if (hasSearchHistoryAuth()) {
    try {
      await recordSearchHistory(trimmed, mode)
      return await loadRecentSearches(mode)
    } catch {
      return localNext
    }
  }
  return localNext
}

export async function removeRecentSearch(keyword, mode) {
  const trimmed = (keyword ?? '').trim()
  const isAi = mode === 'AI'
  const previous = isAi ? readRecentAiSearches() : readRecentKeywordSearches()
  const next = previous.filter((item) => item !== trimmed)
  if (isAi) writeRecentAiSearches(next)
  else writeRecentKeywordSearches(next)

  if (hasSearchHistoryAuth() && trimmed) {
    try {
      await deleteSearchHistoryKeyword(trimmed, mode)
      return await loadRecentSearches(mode)
    } catch {
      return next
    }
  }
  return next
}

export async function clearRecentSearches(mode) {
  const isAi = mode === 'AI'
  if (isAi) writeRecentAiSearches([])
  else writeRecentKeywordSearches([])

  if (hasSearchHistoryAuth()) {
    try {
      await clearSearchHistory(mode)
    } catch {
      // 로컬은 이미 비움
    }
  }
  return []
}
