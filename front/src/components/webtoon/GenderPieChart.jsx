function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
}

export default function GenderPieChart({ male, female }) {
  // male/female 는 0~100 (%). 합이 100이 아니면 남 비율 기준으로 원을 그린다.
  const malePct = Math.min(100, Math.max(0, Number(male) || 0))
  const gradient = `conic-gradient(#4f7cff 0% ${malePct}%, #e88bb0 ${malePct}% 100%)`

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0 rounded-full" style={{ background: gradient }} aria-hidden />
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#4f7cff]" /> 남 {formatPercent(male)}%
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#e88bb0]" /> 여 {formatPercent(female)}%
        </p>
      </div>
    </div>
  )
}
