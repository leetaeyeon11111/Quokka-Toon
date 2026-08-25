import { api } from './client'

async function backendWebtoonId(webtoon) {
  if (webtoon.backendId) return webtoon.backendId
  const page = await api.get('/api/webtoons?size=500', { auth: false })
  const match = (page?.content ?? page ?? []).find((item) => item.title === webtoon.title)
  if (match?.id) return match.id
  const numeric = Number(String(webtoon.id).replace(/^wt-/, ''))
  return Number.isFinite(numeric) ? numeric : webtoon.id
}

export async function listReviews(webtoon) {
  return api.get(`/api/webtoons/${await backendWebtoonId(webtoon)}/reviews`)
}

/** 내가 쓴 리뷰 (로그인 필요) */
export function listMyReviews() {
  return api.get('/api/reviews/mine')
}

export async function createReview(webtoon, payload) {
  return api.post(`/api/webtoons/${await backendWebtoonId(webtoon)}/reviews`, payload)
}

export function updateReview(reviewId, payload) {
  return api.put(`/api/reviews/${reviewId}`, payload)
}

export function deleteReview(reviewId) {
  return api.delete(`/api/reviews/${reviewId}`)
}

export function toggleReviewLike(reviewId) {
  return api.post(`/api/reviews/${reviewId}/like`)
}
