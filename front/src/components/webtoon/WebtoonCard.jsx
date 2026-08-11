import { Link } from 'react-router-dom'

export default function WebtoonCard({ webtoon, showPlatform = true, className = '' }) {
  const { id, title, coverGradient, isAdult, platforms, stats } = webtoon

  return (
    <Link
      to={`/webtoons/${id}`}
      className={`group block w-40 shrink-0 text-left ${className}`}
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-ink-100 shadow-sm transition group-hover:shadow-md"
        style={{ background: coverGradient }}
      >
        {isAdult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-900/80 text-white backdrop-blur-sm">
            <span className="text-2xl" aria-hidden>
              🐿
            </span>
            <span className="text-xs font-medium">19금 가림</span>
          </div>
        )}
        {showPlatform && platforms?.[0] && !isAdult && (
          <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-ink-700">
            {platforms[0].name}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-ink-900">{title}</p>
      {stats && (
        <p className="truncate text-xs text-ink-500">★ {stats.ratingAvg.toFixed(1)}</p>
      )}
    </Link>
  )
}
