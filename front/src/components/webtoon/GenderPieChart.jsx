export default function GenderPieChart({ male, female }) {
  const gradient = `conic-gradient(#4f7cff 0% ${male}%, #e88bb0 ${male}% 100%)`

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0 rounded-full" style={{ background: gradient }} />
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#4f7cff]" /> 남 {male}%
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#e88bb0]" /> 여 {female}%
        </p>
      </div>
    </div>
  )
}
