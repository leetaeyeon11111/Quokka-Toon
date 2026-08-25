import Modal from '../common/Modal'

const TARGET_LABEL = { POST: '게시글', COMMENT: '댓글', REVIEW: '리뷰' }

function Row({ label, children }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="w-20 shrink-0 text-xs font-semibold text-ink-500">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-ink-900">{children}</span>
    </div>
  )
}

export default function ReportDetailModal({ report, onClose }) {
  const isHandled = report.status !== '미처리'

  return (
    <Modal title="신고 상세" icon="🚨" onClose={onClose}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-500">
          {report.type}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isHandled ? 'bg-mint-100 text-mint-500' : 'bg-ink-100 text-ink-500'
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="divide-y divide-ink-50">
        <Row label="대상 유형">
          {TARGET_LABEL[report.targetType] ?? report.targetType} · {report.board}
        </Row>
        <Row label="대상 작성자">{report.author}</Row>
        <Row label="내용">
          <span className="whitespace-pre-wrap break-words">{report.title}</span>
        </Row>
        <Row label="접수 시각">{report.when}</Row>
      </div>

      <div className="mt-4 rounded-xl bg-ink-50 p-3">
        <p className="mb-1 text-xs font-semibold text-ink-500">처리 내역</p>
        {isHandled ? (
          <p className="text-sm text-ink-700">
            {report.status} · 담당자 <span className="font-semibold">{report.handledByName ?? '알 수 없음'}</span>
            {report.handledDate ? ` · ${report.handledDate}` : ''}
          </p>
        ) : (
          <p className="text-sm text-ink-400">아직 처리되지 않은 신고예요.</p>
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
