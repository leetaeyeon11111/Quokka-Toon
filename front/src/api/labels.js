// 프론트 한글 라벨 ↔ 백엔드 enum 매핑 모음.

export const INQUIRY_CATEGORY_TO_ENUM = {
  결제: 'PAYMENT',
  오류신고: 'BUG',
  건의: 'SUGGEST',
  계정: 'ACCOUNT',
  기타: 'ETC',
}
export const INQUIRY_CATEGORY_TO_LABEL = Object.fromEntries(
  Object.entries(INQUIRY_CATEGORY_TO_ENUM).map(([k, v]) => [v, k]),
)

export const INQUIRY_STATUS_TO_LABEL = {
  WAITING: '답변대기',
  DONE: '완료',
}

export function isInquiryDone(status) {
  return status === '완료' || status === '답변완료' || status === 'DONE'
}

export const REPORT_TYPE_TO_ENUM = {
  '스팸/광고': 'SPAM',
  '욕설/비방': 'ABUSE',
  음란물: 'OBSCENE',
  도배: 'FLOOD',
}
export const REPORT_TYPE_TO_LABEL = Object.fromEntries(
  Object.entries(REPORT_TYPE_TO_ENUM).map(([k, v]) => [v, k]),
)

export const REPORT_STATUS_TO_LABEL = {
  PENDING: '미처리',
  RESOLVED: '완료',
  REJECTED: '반려',
}
