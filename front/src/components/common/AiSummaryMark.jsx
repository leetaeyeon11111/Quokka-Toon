// 로봇 쿼카 — AI 요약 전용 마크 (가운데 정렬·페이스플레이트)
const ROBOT_SRC = '/icons/quokka-robot-ai-mark.png'

/** AI가 만든 요약임을 표시하는 로봇 쿼카 마크. */
export default function AiSummaryMark({ className = '', size = 28, label = 'AI 요약' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mint-100 px-2 py-1 text-[11px] font-bold leading-none text-mint-500 ${className}`}
      title="AI가 요약한 내용이에요"
    >
      <img
        src={ROBOT_SRC}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover object-center"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
