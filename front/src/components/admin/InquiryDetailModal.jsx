import Modal from '../common/Modal'

export default function InquiryDetailModal({ inquiry, onClose }) {
  const isDone = inquiry.status === '답변완료'

  return (
    <Modal title="문의 상세" icon="📩" onClose={onClose} maxWidth="max-w-lg">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
          {inquiry.category}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isDone ? 'bg-mint-100 text-mint-500' : 'bg-ink-100 text-ink-500'
          }`}
        >
          {inquiry.status}
        </span>
      </div>

      <h3 className="text-base font-bold text-ink-900">{inquiry.title}</h3>
      <p className="mt-1 text-xs text-ink-500">
        작성자 {inquiry.author} · {inquiry.date}
      </p>

      <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
        {inquiry.content}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-ink-500">답변 내역</p>
        {inquiry.answer ? (
          <div className="rounded-xl border border-mint-500/40 bg-mint-100/40 p-4">
            <p className="whitespace-pre-wrap break-words text-sm text-ink-800">{inquiry.answer}</p>
            <p className="mt-2 text-xs text-ink-500">
              담당자 <span className="font-semibold">{inquiry.answeredByName ?? '알 수 없음'}</span>
              {inquiry.answeredDate ? ` · ${inquiry.answeredDate}` : ''}
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-400">아직 답변이 등록되지 않았어요.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-full border border-ink-100 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
      >
        닫기
      </button>
    </Modal>
  )
}
