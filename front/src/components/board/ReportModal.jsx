import { useState } from 'react'
import Modal from '../common/Modal'
import { REPORT_TYPE_TO_ENUM } from '../../api/labels'

// 신고 유형 라벨 목록 (라벨↔enum 매핑에서 파생하여 항상 동기화)
const REPORT_TYPES = Object.keys(REPORT_TYPE_TO_ENUM)

export default function ReportModal({ target, onConfirm, onClose }) {
  const [typeLabel, setTypeLabel] = useState(null)
  const targetName =
    target?.targetType === 'COMMENT' ? '댓글' : target?.targetType === 'REVIEW' ? '리뷰' : '게시글'

  return (
    <Modal title="신고하기" icon="🚩" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-700">
        이 {targetName}을(를) 신고하는 사유를 선택해주세요.
      </p>

      <p className="mb-2 text-xs font-semibold text-ink-500">신고 유형</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {REPORT_TYPES.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setTypeLabel(label)}
            className={`rounded-full border py-2.5 text-sm font-semibold transition ${
              typeLabel === label
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-ink-100 text-ink-500 hover:bg-ink-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-ink-100 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!typeLabel}
          onClick={() => onConfirm(typeLabel)}
          className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-300"
        >
          신고 접수
        </button>
      </div>
    </Modal>
  )
}
