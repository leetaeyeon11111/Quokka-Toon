// 관리자 API 모듈 (/api/admin/*). ROLE_ADMIN 토큰 필요.

import { api } from './client'
import { formatDate } from '../lib/date'
import {
  INQUIRY_CATEGORY_TO_LABEL,
  INQUIRY_STATUS_TO_LABEL,
  REPORT_STATUS_TO_LABEL,
  REPORT_TYPE_TO_LABEL,
} from './labels'

// ---- 문의 관리 ----
function mapInquiry(inq) {
  return {
    ...inq,
    category: INQUIRY_CATEGORY_TO_LABEL[inq.category] ?? inq.category,
    status: INQUIRY_STATUS_TO_LABEL[inq.status] ?? inq.status,
    date: formatDate(inq.createdAt),
    answeredDate: inq.answeredAt ? formatDate(inq.answeredAt) : '',
  }
}

export async function listInquiries() {
  const list = await api.get('/api/admin/inquiries')
  return list.map(mapInquiry)
}

export function answerInquiry(id, answer) {
  return api.post(`/api/admin/inquiries/${id}/answer`, { answer })
}

export function deleteInquiry(id) {
  return api.delete(`/api/admin/inquiries/${id}`)
}

// ---- 신고 관리 ----
function mapReport(r) {
  return {
    ...r,
    type: REPORT_TYPE_TO_LABEL[r.type] ?? r.type,
    status: REPORT_STATUS_TO_LABEL[r.status] ?? r.status,
    when: formatDate(r.createdAt),
    handledWhen: formatDate(r.handledAt),
  }
}

/** status: 'PENDING'(기본) | 'HANDLED' | 'ALL' */
export async function listReports(status = 'PENDING') {
  const list = await api.get(`/api/admin/reports?status=${status}`)
  return list.map(mapReport)
}

export async function listHandledReports() {
  const list = await api.get('/api/admin/reports/handled')
  return list.map(mapReport)
}

export function resolveReport(id) {
  return api.post(`/api/admin/reports/${id}/resolve`)
}

/** 작성자 벤 (+선택적 게시글 삭제) */
export function banFromReport(reportId, { duration, reason, deletePost }) {
  return api.post(`/api/admin/reports/${reportId}/ban`, { duration, reason, deletePost })
}

// ---- 벤 관리 ----
function mapBannedUser(u) {
  return {
    ...u,
    bannedWhen: formatDate(u.bannedAt),
    expiresWhen: u.expiresAt ? formatDate(u.expiresAt) : '영구',
  }
}

export async function listBannedUsers() {
  const list = await api.get('/api/admin/bans')
  return list.map(mapBannedUser)
}

export function unbanUser(userId) {
  return api.post(`/api/admin/bans/${userId}/unban`)
}

// ---- 추천 검색어(메인페이지 버튼) 관리 ----
export function listQuickPrompts() {
  return api.get('/api/admin/quick-prompts')
}

export function createQuickPrompt({ label, query, sortOrder }) {
  return api.post('/api/admin/quick-prompts', { label, query, sortOrder })
}

export function updateQuickPrompt(id, { label, query, sortOrder }) {
  return api.put(`/api/admin/quick-prompts/${id}`, { label, query, sortOrder })
}

export function deleteQuickPrompt(id) {
  return api.delete(`/api/admin/quick-prompts/${id}`)
}
