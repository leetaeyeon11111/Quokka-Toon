// 웹툰 API 모듈. (/api/webtoons)

import { api } from './client'

/** 웹툰 목록 (글쓰기 웹툰 선택 등). Page 응답에서 content 배열만 반환 */
export async function listWebtoons({ size = 100 } = {}) {
  const data = await api.get(`/api/webtoons?size=${size}`, { auth: false })
  return data?.content ?? data ?? []
}
