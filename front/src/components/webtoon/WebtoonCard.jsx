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

/** 정렬별 메타. 최신순은 0이어도 조회·평점·리뷰 수를 보여 준다. */
function SortMeta({ sort, webtoon }) {
  const ratingRaw = webtoon.ratingAvg ?? webtoon.stats?.ratingAvg
  const rating = ratingRaw != null && Number(ratingRaw) > 0 ? Number(ratingRaw) : null
  const views = Number(webtoon.viewCount ?? webtoon.stats?.views ?? 0) || 0
  const bookmarks = Number(webtoon.bookmarkCount ?? webtoon.stats?.bookmarkCount ?? 0) || 0
  const ratingCount = Number(webtoon.ratingCount ?? webtoon.stats?.ratingCount ?? 0) || 0

  if (sort === 'bookmark') {
    return <p className="mt-2 truncate text-xs text-ink-500">북마크 {formatCount(bookmarks)}</p>
  }
  if (sort === 'views') {
    return <p className="mt-2 truncate text-xs text-ink-500">조회 {formatCount(views)}</p>
  }
  if (sort === 'rating' || sort === 'reviews') {
    return (
      <p className="mt-2 truncate text-xs text-ink-500">
        ★ {rating != null ? rating.toFixed(1) : '—'}
        {` · 리뷰 ${formatCount(ratingCount)}`}
      </p>
    )
  }

  // latest 등: 0이어도 조회·평점·리뷰 표시
  return (
    <p className="mt-2 truncate text-xs text-ink-500">
      {[
        `★ ${rating != null ? rating.toFixed(1) : '—'}`,
        `리뷰 ${formatCount(ratingCount)}`,
        `조회 ${formatCount(views)}`,
        bookmarks > 0 ? `북마크 ${formatCount(bookmarks)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')}
    </p>
  )
}

export default function WebtoonCard({ webtoon, showPlatform = true, rank, sort, className = '' }) {
  const { id, title } = webtoon
  const [imgOk, setImgOk] = useState(true)

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
        {showPlatform && platformName && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-ink-700">
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
      <SortMeta sort={sort} webtoon={webtoon} />
      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{title}</p>
    </Link>
  )
}
