// 웹툰 API 모듈. (/api/webtoons)

import { api } from './client'

/** 웹툰 목록 (글쓰기 웹툰 선택 등). Page 응답에서 content 배열만 반환 */
export async function listWebtoons({ size = 100 } = {}) {
  const data = await api.get(`/api/webtoons?size=${size}`, { auth: false })
  return data?.content ?? data ?? []
}

/** 웹툰 목록 검색 (목록 페이지). Page 객체 그대로 반환 */
export async function searchWebtoons({
  page = 0,
  size = 24,
  sort = 'latest',
  q = '',
  platform = '',
  genre = '',
  author = '',
} = {}) {
  const params = new URLSearchParams({ page, size, sort })
  if (q) params.set('q', q)
  if (platform) params.set('platform', platform)
  if (genre) params.set('genre', genre)
  if (author) params.set('author', author)
  return api.get(`/api/webtoons?${params.toString()}`, { auth: false })
}

/** 웹툰 상세 */
export async function getWebtoon(id) {
  return api.get(`/api/webtoons/${id}`, { auth: false })
}

/**
 * 바로 보기 링크. 백엔드가 로컬 external_url 이 검색 페이지면
 * 클라우드 API(korea-webtoon-api)로 실제 딥링크를 실시간 조회해 반환한다.
 * 응답: { url, platform, source: 'LOCAL' | 'CLOUD_API' }
 */
export async function getWebtoonViewLink(id) {
  return api.get(`/api/webtoons/${id}/view-link`, { auth: false })
}

/** 필터 옵션 */
export async function getGenreOptions() {
  return api.get('/api/webtoons/genres', { auth: false })
}
export async function getPlatformOptions() {
  return api.get('/api/webtoons/platforms', { auth: false })
}
