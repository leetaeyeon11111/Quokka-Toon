const VISITOR_ID_KEY = 'quokkatoon:visitor-id'

function createVisitorId() {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID().replaceAll('-', '_')
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function getVisitorId() {
  if (typeof window === 'undefined') return 'anonymous'

  try {
    const saved = window.localStorage.getItem(VISITOR_ID_KEY)
    if (saved) return saved

    const created = createVisitorId()
    window.localStorage.setItem(VISITOR_ID_KEY, created)
    return created
  } catch {
    return 'anonymous'
  }
}
