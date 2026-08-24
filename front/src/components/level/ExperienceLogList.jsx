const ACTION_LABELS = {
  POST: '게시글 작성',
  COMMENT: '댓글 작성',
  REVIEW: '리뷰 작성',
  VISIT: '오늘 첫 방문',
  VISIT_STREAK: '연속 방문',
  RECOMMEND: '추천 받음',
  NOT_RECOMMEND: '추천 활동',
  REPORTED: '신고 처리',
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (elapsedMinutes < 1) return '방금 전'
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}시간 전`
  return `${date.getMonth() + 1}.${date.getDate()}`
}

export default function ExperienceLogList({ logs, loading, error, compact = false }) {
  if (loading) return <p className="py-3 text-center text-xs text-ink-300">내역을 불러오는 중…</p>
  if (error) return <p className="py-3 text-center text-xs text-ink-400">{error}</p>
  if (!logs.length) return <p className="py-3 text-center text-xs text-ink-300">아직 적립 내역이 없어요.</p>

  return (
    <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {logs.map((log) => (
        <li
          key={log.id}
          className={`flex items-center justify-between gap-3 rounded-xl bg-ink-50 ${
            compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-700">
              {ACTION_LABELS[log.actionType] ?? '활동 보상'}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-300">{formatTime(log.createdAt)}</p>
          </div>
          <strong className="shrink-0 text-xs text-brand-600">+{log.expDelta} EXP</strong>
        </li>
      ))}
    </ul>
  )
}
