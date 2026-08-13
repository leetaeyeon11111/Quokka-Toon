// 백엔드의 ISO LocalDateTime 문자열을 목록/상세에서 쓰는 짧은 표시로 변환한다.
// 오늘 → 'HH:mm', 어제 → '어제', 그 외 → 'YY.MM.DD'
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86400000)

  const pad = (n) => String(n).padStart(2, '0')
  if (dayDiff === 0) return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (dayDiff === 1) return '어제'
  if (dayDiff < 7) return `${dayDiff}일 전`
  return `${String(d.getFullYear()).slice(2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}
