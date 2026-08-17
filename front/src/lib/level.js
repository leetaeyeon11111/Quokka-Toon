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
