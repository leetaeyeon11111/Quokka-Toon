// 관리자 승격 요청 API 모듈.

import { api } from './client'

// ---- 일반 유저 ----
/** 관리자 승격 요청 */
export function requestAdmin() {
  return api.post('/api/admin-requests')
}

/** 내 승격 요청 상태 (없으면 null) */
export function getMyAdminRequest() {
  return api.get('/api/admin-requests/mine')
}

// ---- 관리자 ----
/** 대기 중인 승격 요청 목록 */
export function listAdminRequests() {
  return api.get('/api/admin/admin-requests')
}

/** 승인 (해당 유저 관리자 승격) */
export function approveAdminRequest(id) {
  return api.post(`/api/admin/admin-requests/${id}/approve`)
}

/** 거절 */
export function rejectAdminRequest(id) {
  return api.post(`/api/admin/admin-requests/${id}/reject`)
}

// ---- 관리자 목록/해제 ----
/** 현재 관리자 목록 */
export function listAdmins() {
  return api.get('/api/admin/admins')
}

/** 관리자 해제(강등) */
export function revokeAdmin(userId) {
  return api.post(`/api/admin/admins/${userId}/revoke`)
}
