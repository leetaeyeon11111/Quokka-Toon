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
