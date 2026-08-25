export function webtoonHref(webtoon) {
  const id = String(webtoon?.id ?? '')
  if (id && !id.startsWith('wt-')) return `/webtoons/${encodeURIComponent(id)}`

  const title = webtoon?.title?.trim()
  return title ? `/webtoons?q=${encodeURIComponent(title)}` : '/webtoons'
}

export function loginHref(returnTo) {
  const destination = returnTo?.trim()
  return destination ? `/login?returnTo=${encodeURIComponent(destination)}` : '/login'
}

const AUTH_REQUIRED_PATHS = ['/mypage', '/admin', '/board/write', '/inquiry']

export function requiresAuthentication(pathname) {
  const path = (pathname || '/').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/'
  return AUTH_REQUIRED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
