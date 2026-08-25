const ROBOT_SRC = '/icons/quokka-robot-ai.png'

/** AI가 만든 요약임을 표시하는 로봇 쿼카 마크. */
export default function AiSummaryMark({ className = '', size = 18, label = 'AI 요약' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-500 ${className}`}
      title="AI가 요약한 내용이에요"
    >
      <img
        src={ROBOT_SRC}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
