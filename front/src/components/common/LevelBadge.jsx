import { levelBadgeClass } from '../../lib/level'

// 닉네임 왼쪽에 붙는 레벨 뱃지 (Lv.N, 100은 MAX)
export function LevelBadge({ level = 1, className = '' }) {
  const isMax = level >= 100
  return (
    <span
      className={`inline-flex shrink-0 cursor-pointer items-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${levelBadgeClass(level)} ${className}`}
      aria-label={isMax ? '레벨 100 MAX' : `레벨 ${level ?? 1}`}
    >
      {isMax ? 'Lv.MAX' : `Lv.${level ?? 1}`}
    </span>
  )
}
