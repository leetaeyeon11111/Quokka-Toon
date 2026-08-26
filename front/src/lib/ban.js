// 정지(벤) 계정 안내 상태 — 세션 동안 유지해 /banned 페이지에 표시한다.

const BAN_KEY = 'quakatoon:ban'
export const BAN_EVENT = 'quokka:user-banned'

export function saveBanStatus(ban) {
  if (!ban) return
  try {
    sessionStorage.setItem(BAN_KEY, JSON.stringify(ban))
  } catch {
    /* ignore quota */
  }
}

export function loadBanStatus() {
  try {
    const raw = sessionStorage.getItem(BAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearBanStatus() {
  try {
    sessionStorage.removeItem(BAN_KEY)
  } catch {
    /* ignore */
  }
}

/** API/세션에서 벤이 확인되면 저장 + 이벤트로 BanGuard에 알린다. */
export function emitBanned(ban) {
  const payload = ban && typeof ban === 'object' ? ban : { banned: true }
  saveBanStatus(payload)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BAN_EVENT, { detail: payload }))
  }
}

export function formatBanExpiry(expiresAt) {
  if (!expiresAt) return '영구 정지'
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return String(expiresAt)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
