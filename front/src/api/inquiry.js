// 문의 API 모듈. 백엔드 enum ↔ 화면 한글 라벨 매핑을 포함한다.

import { api } from './client'
import { formatDate } from '../lib/date'
import {
  INQUIRY_CATEGORY_TO_ENUM,
  INQUIRY_CATEGORY_TO_LABEL,
  INQUIRY_STATUS_TO_LABEL,
} from './labels'

function mapInquiry(inq) {
  return {
    ...inq,
    category: INQUIRY_CATEGORY_TO_LABEL[inq.category] ?? inq.category,
    status: INQUIRY_STATUS_TO_LABEL[inq.status] ?? inq.status,
    date: formatDate(inq.createdAt),
  }
}

/** 문의 등록. categoryLabel 은 한글 라벨('결제' 등) */
export function createInquiry({ categoryLabel, title, content }) {
  return api.post('/api/inquiries', {
    category: INQUIRY_CATEGORY_TO_ENUM[categoryLabel] ?? 'ETC',
    title,
    content,
  })
}

/** 내 문의 내역 */
export async function listMyInquiries() {
  const list = await api.get('/api/inquiries/mine')
  return list.map(mapInquiry)
}
