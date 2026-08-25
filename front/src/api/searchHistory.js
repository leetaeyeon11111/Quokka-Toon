// 최근 검색 API. mode = 'NORMAL' | 'AI'
import { api, getToken } from './client'

export function hasSearchHistoryAuth() {
  return Boolean(getToken())
}

export async function listSearchHistory(mode = 'NORMAL') {
  return api.get(`/api/search-history?mode=${encodeURIComponent(mode)}`)
}

export async function recordSearchHistory(keyword, mode = 'NORMAL') {
  return api.post('/api/search-history', { keyword, mode })
}

export async function deleteSearchHistoryKeyword(keyword, mode = 'NORMAL') {
  const params = new URLSearchParams({
    keyword,
    mode,
  })
  return api.delete(`/api/search-history?${params.toString()}`)
}

export async function clearSearchHistory(mode = 'NORMAL') {
  return api.delete(`/api/search-history/all?mode=${encodeURIComponent(mode)}`)
}
