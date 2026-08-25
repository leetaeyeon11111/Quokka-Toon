// 메인페이지 추천 검색어 버튼 API (/api/quick-prompts). 조회는 공개.

import { api } from './client'

/** 공개: 추천 검색어 목록 (label + query). */
export async function getQuickPrompts() {
  return api.get('/api/quick-prompts', { auth: false })
}
