import { useState } from 'react'
import { Link } from 'react-router-dom'
import { coverGradientFor } from '../../lib/webtoon'
import { webtoonHref } from '../../lib/navigation'
import AdultCoverMark from '../common/AdultCoverMark'

function formatCount(n) {
  const value = Number(n) || 0
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`
  return value.toLocaleString()
}

function SortMeta({ sort, webtoon }) {
  const rating = webtoon.ratingAvg ?? webtoon.stats?.ratingAvg
  const views = webtoon.viewCount ?? webtoon.stats?.views ?? 0
  const bookmarks = webtoon.bookmarkCount ?? webtoon.stats?.bookmarkCount ?? 0
  const ratingCount = webtoon.ratingCount ?? webtoon.stats?.ratingCount ?? 0

  if (sort === 'bookmark') {
    return <p className="truncate text-xs text-ink-500">북마크 {formatCount(bookmarks)}</p>
  }
  if (sort === 'views') {
    return <p className="truncate text-xs text-ink-500">조회 {formatCount(views)}</p>
  }
  if (sort === 'rating') {
    const avg = rating != null ? Number(rating).toFixed(1) : '—'
    return (
      <p className="truncate text-xs text-ink-500">
        ★ {avg} · 리뷰 {formatCount(ratingCount)}
      </p>
    )
  }
  if (rating != null) {
    return <p className="truncate text-xs text-ink-500">★ {Number(rating).toFixed(1)}</p>
  }
  return null
}

export default function WebtoonCard({ webtoon, showPlatform = true, rank, sort, className = '' }) {
  const { id, title } = webtoon
  const [imgOk, setImgOk] = useState(true)

  // 실데이터/mock 양쪽 지원
  const thumbnailUrl = webtoon.thumbnailUrl
  const gradient = webtoon.coverGradient ?? coverGradientFor(id)
  const platformName = webtoon.platformName ?? webtoon.platforms?.[0]?.name
  const isAdult = webtoon.isAdult ?? webtoon.ageRating === '19'
  const showImage = thumbnailUrl && imgOk && !isAdult

  return (
    <Link to={webtoonHref(webtoon)} className={`group block w-40 shrink-0 text-left ${className}`}>
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-ink-100 shadow-sm transition group-hover:shadow-md"
        style={{ background: gradient }}
      >
        {showImage && (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {isAdult && (
          <div className="absolute inset-0 bg-black text-white">
            <AdultCoverMark fill />
            <span className="absolute inset-x-0 bottom-2 text-center text-xs font-medium drop-shadow">
              19금 가림
            </span>
          </div>
        )}
        {showPlatform && platformName && !isAdult && (
          <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-ink-700">
            {platformName}
          </span>
        )}
        {rank != null && (
          <span
            aria-label={`${rank}위`}
            className="absolute bottom-0 left-0 z-10 flex h-8 min-w-8 items-center justify-center rounded-tr-xl border-r border-t border-white/40 bg-gradient-to-br from-brand-500 to-brand-700 px-2 text-sm font-extrabold tabular-nums text-white shadow-[2px_-2px_10px_rgba(28,26,31,0.16)]"
          >
            {rank}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-ink-900">{title}</p>
      <SortMeta sort={sort} webtoon={webtoon} />
    </Link>
  )
}
