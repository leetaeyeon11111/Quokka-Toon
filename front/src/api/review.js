import { api } from './client'

export async function listReviews(webtoon) {
  const id = webtoon.backendId ?? webtoon.id
  return api.get(`/api/webtoons/${id}/reviews`)
}

export async function listMyReviews() {
  return api.get('/api/reviews/me')
}

export async function createReview(webtoon, payload) {
  const id = webtoon.backendId ?? webtoon.id
  return api.post(`/api/webtoons/${id}/reviews`, payload)
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
