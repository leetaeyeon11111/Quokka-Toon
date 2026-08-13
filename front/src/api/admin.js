// 관리자 API 모듈 (/api/admin/*). ROLE_ADMIN 토큰 필요.

import { api } from './client'
import { formatDate } from '../lib/date'
import {
  INQUIRY_CATEGORY_TO_LABEL,
  INQUIRY_STATUS_TO_LABEL,
  REPORT_TYPE_TO_LABEL,
} from './labels'

// ---- 문의 관리 ----
function mapInquiry(inq) {
  return {
    ...inq,
    category: INQUIRY_CATEGORY_TO_LABEL[inq.category] ?? inq.category,
    status: INQUIRY_STATUS_TO_LABEL[inq.status] ?? inq.status,
    date: formatDate(inq.createdAt),
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
    when: formatDate(r.createdAt),
  }
}

export async function listReports() {
  const list = await api.get('/api/admin/reports')
  return list.map(mapReport)
}

export function resolveReport(id) {
  return api.post(`/api/admin/reports/${id}/resolve`)
}

/** 작성자 벤 (+선택적 게시글 삭제) */
export function banFromReport(reportId, { duration, reason, deletePost }) {
  return api.post(`/api/admin/reports/${reportId}/ban`, { duration, reason, deletePost })
}
