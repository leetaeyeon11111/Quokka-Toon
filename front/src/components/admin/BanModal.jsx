import { useState } from 'react'
import Modal from '../common/Modal'

const DURATIONS = ['3일', '7일', '30일', '영구']

export default function BanModal({ report, onConfirm, onClose }) {
  const [days, setDays] = useState('7일')
  const [reason, setReason] = useState('')
  const [deletePost, setDeletePost] = useState(true)

  return (
    <Modal title="사용자 벤 처리" icon="🚫" onClose={onClose}>
      <p className="mb-1 text-sm text-ink-700">
        <span className="font-bold text-ink-900">{report.author}</span> 님을 이용 정지하시겠어요?
      </p>
      <p className="mb-4 text-xs text-ink-500">신고 사유: {report.type}</p>

      <p className="mb-2 text-xs font-semibold text-ink-500">정지 기간</p>
      <div className="mb-4 flex gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`flex-1 rounded-full border py-2 text-xs font-semibold transition ${
              days === d ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-100 text-ink-500'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold text-ink-500">사유 메모 (사용자에게 표시)</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="예) 반복적인 광고성 게시글 작성"
        rows={3}
        className="mb-3 w-full rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm outline-none"
      />

      <label className="mb-4 flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={deletePost} onChange={(e) => setDeletePost(e.target.checked)} />
        해당 게시글도 함께 삭제
      </label>

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
          onClick={() => onConfirm({ days, reason, deletePost })}
          className="flex-1 rounded-full bg-red-800 py-3 text-sm font-semibold text-white hover:bg-red-900"
        >
          벤 처리
        </button>
      </div>
    </Modal>
  )
}
