// 게시판 백엔드 API 모듈. (/api/board/*)
// 백엔드 응답(ISO createdAt)을 화면이 쓰는 date 문자열로 매핑해 준다.

import { api } from './client'
import { formatDate } from '../lib/date'

function mapPost(p) {
  return { ...p, date: formatDate(p.createdAt) }
}

function mapComment(c) {
  return { ...c, date: formatDate(c.createdAt) }
}

/** 목록 조회. board: 'all' | 'free' | 'webtoon' */
export async function listPosts(board = 'all') {
  const list = await api.get(`/api/board?board=${encodeURIComponent(board)}`, { auth: false })
  return list.map(mapPost)
}

/** 내가 쓴 게시글 (로그인 필요) */
export async function listMyPosts() {
  const list = await api.get('/api/board/mine')
  return list.map(mapPost)
}

/** 상세 조회 (댓글 포함). 로그인 상태면 mine 플래그가 채워진다. */
export async function getPost(id) {
  const post = await api.get(`/api/board/${id}`)
  return { ...mapPost(post), comments: (post.comments ?? []).map(mapComment) }
}

/** 글쓰기 → 생성된 postId */
export function createPost(payload) {
  return api.post('/api/board', payload)
}

/** 삭제 (작성자 본인) */
export function deletePost(id) {
  return api.delete(`/api/board/${id}`)
}

/** 댓글/대댓글 등록 → 생성된 댓글 */
export async function addComment(postId, { text, parentId = null }) {
  const c = await api.post(`/api/board/${postId}/comments`, { text, parentId })
  return mapComment(c)
}

/** 게시글 추천/비추천(1인 1표 토글) → { likes, dislikes, myReaction } */
export function reactPost(id, kind = 'like') {
  return api.post(`/api/board/${id}/react?kind=${kind}`)
}

/** 댓글 좋아요 토글 → { likes, liked } */
export function reactComment(commentId) {
  return api.post(`/api/board/comments/${commentId}/react`)
}
