export function nicknameLevelClass(level = 1) {
  if (level >= 100) return 'level-nickname-max'
  if (level >= 90) return 'text-rose-700'
  if (level >= 80) return 'text-fuchsia-700'
  if (level >= 70) return 'text-violet-700'
  if (level >= 60) return 'text-indigo-700'
  if (level >= 50) return 'text-blue-700'
  if (level >= 40) return 'text-cyan-700'
  if (level >= 30) return 'text-teal-700'
  if (level >= 20) return 'text-emerald-700'
  if (level >= 10) return 'text-amber-700'
  return 'text-ink-900'
}

export function levelLabel(user) {
  return user?.maxLevel || user?.level >= 100 ? 'Lv.100 MAX' : `Lv.${user?.level ?? 1}`
}

// 닉네임 왼쪽 레벨 뱃지 색상 (nicknameLevelClass 티어와 동일)
export function levelBadgeClass(level = 1) {
  if (level >= 100) return 'bg-amber-200 text-amber-900'
  if (level >= 90) return 'bg-rose-100 text-rose-700'
  if (level >= 80) return 'bg-fuchsia-100 text-fuchsia-700'
  if (level >= 70) return 'bg-violet-100 text-violet-700'
  if (level >= 60) return 'bg-indigo-100 text-indigo-700'
  if (level >= 50) return 'bg-blue-100 text-blue-700'
  if (level >= 40) return 'bg-cyan-100 text-cyan-700'
  if (level >= 30) return 'bg-teal-100 text-teal-700'
  if (level >= 20) return 'bg-emerald-100 text-emerald-700'
  if (level >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-ink-100 text-ink-600'
}
