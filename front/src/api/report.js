// 신고 API 모듈 (사용자용).

import { api } from './client'
import { REPORT_TYPE_TO_ENUM } from './labels'

/**
 * 게시글/댓글/리뷰 신고.
 * @param {{ targetType: 'POST'|'COMMENT'|'REVIEW', targetId: number, typeLabel?: string, reason?: string }} p
 */
export function createReport({ targetType, targetId, typeLabel = '스팸/광고', reason = '' }) {
  return api.post('/api/reports', {
    targetType,
    targetId,
    type: REPORT_TYPE_TO_ENUM[typeLabel] ?? 'SPAM',
    reason,
  })
}
