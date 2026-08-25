import { collectWatchLinks, MEDIA_TYPE_ICON, MEDIA_TYPE_LABEL } from '../../data/mediaMix'
import { namuWikiButtonStyle } from '../../lib/platformColors'

function groupByType(items) {
  const groups = {}
  for (const item of items) {
    const key = item.mediaType || 'etc'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  const order = ['movie', 'tv_drama', 'web_drama', 'animation']
  return [
    ...order.filter((t) => groups[t]),
    ...Object.keys(groups).filter((t) => !order.includes(t)),
  ].map((type) => ({ type, items: groups[type] }))
}

function resolveHeroNamuUrl(items) {
  const withUrl = (items || []).filter((i) => i.namuWikiUrl)
  if (!withUrl.length) return null
  const main = withUrl.find((i) => {
    try {
      const path = decodeURIComponent((i.namuWikiUrl.split('/w/')[1] || '').split('?')[0])
      return path && !path.includes('(')
    } catch {
      return false
    }
  })
  if (main) return main.namuWikiUrl
  const raw = (items[0]?.mediaTitle || '')
    .replace(/\s*\d+\s*기.*$/, '')
    .replace(/\(TVA\).*$/i, '')
    .trim()
  if (raw) return `https://namu.wiki/w/${encodeURIComponent(raw)}`
  return withUrl[0].namuWikiUrl
}

export function MediaMixHeroLinks({ items }) {
  if (!items?.length) return null
  const namuUrl = resolveHeroNamuUrl(items)
  // 영화·애니·시즌이 각각 같은 OTT 링크를 갖고 있어도 버튼은 서비스당 1개만
  const watches = collectWatchLinks(items)
  if (!namuUrl && !watches.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {namuUrl && (
        <a
          href={namuUrl}
          target="_blank"
          rel="noreferrer"
          style={namuWikiButtonStyle()}
          className="rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
        >
          나무위키에서 미디어믹스 보기
        </a>
      )}
      {watches.map((link) => (
        <a
          key={`${link.label}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          ▶ {link.label || '보러 가기'}
        </a>
      ))}
    </div>
  )
}

export default function MediaMixSection({ items }) {
  if (!items?.length) return null
  const groups = groupByType(items)

  return (
    <section id="media-mix" className="scroll-mt-24 rounded-2xl border border-ink-100 bg-white p-6">
      <h2 className="mb-1 text-lg font-bold text-ink-900">미디어 믹스</h2>
      <p className="mb-4 text-xs text-ink-500">이 웹툰을 원작으로 한 드라마·영화·애니·OTT 작품이에요.</p>
      {groups.map(({ type, items: rows }) => (
        <div key={type} className="mb-4 last:mb-0">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <span aria-hidden>{MEDIA_TYPE_ICON[type] || '🎭'}</span>
            {MEDIA_TYPE_LABEL[type] || type}
          </p>
          <ul className="flex flex-col gap-1.5">
            {rows.map((item, idx) => (
              <li
                key={`${item.mediaTitle}-${idx}`}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                  item.status === 'upcoming' ? 'bg-brand-50' : 'bg-ink-50'
                }`}
              >
                <span className="min-w-0 truncate text-sm font-medium text-ink-900">
                  {item.namuWikiUrl ? (
                    <a href={item.namuWikiUrl} target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline">
                      {item.mediaTitle}
                      {item.season ? ` 시즌${item.season}` : ''}
                    </a>
                  ) : (
                    <>
                      {item.mediaTitle}
                      {item.season ? ` 시즌${item.season}` : ''}
                    </>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-500">
                  <span>{item.year || '미정'}</span>
                  {item.platform ? <span>· {item.platform}</span> : null}
                  {(item.watchLinks ?? []).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-mint-500 hover:underline"
                    >
                      {link.label || '보기'}
                    </a>
                  ))}
                  {item.status === 'upcoming' && (
                    <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">예정</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
