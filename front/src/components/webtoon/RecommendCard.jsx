import { useState } from 'react'
import { Link } from 'react-router-dom'
import RadarChart from './RadarChart'
import AiSummaryMark from '../common/AiSummaryMark'
import AdultCoverMark from '../common/AdultCoverMark'
import PlatformLogo from './PlatformLogo'
import { webtoonHref } from '../../lib/navigation'

const TABS = [
  { key: 'reason', label: '추천 이유' },
  { key: 'rate', label: '추천율' },
  { key: 'synopsis', label: '줄거리' },
]

function ScoreBar({ label, value, icon }) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
        <span>
          {icon} {label}
        </span>
        <span className="font-semibold text-ink-900">{value}점</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function RecommendCard({ result }) {
  const { webtoon, reasonText, queryScore, tasteScore, total, axisTags } = result
  const [tab, setTab] = useState('reason')
  const [imgOk, setImgOk] = useState(true)
  const href = webtoonHref(webtoon)
  const showImage = webtoon.thumbnailUrl && imgOk && !webtoon.isAdult
  const platformName = webtoon.platformName ?? webtoon.platforms?.[0]?.name
  const platformLogoUrl = webtoon.platformLogoUrl ?? webtoon.platforms?.[0]?.logoUrl

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <Link to={href} aria-label={`${webtoon.title} 보기`} className="shrink-0">
          <div
            className="relative h-24 w-20 overflow-hidden rounded-xl border border-ink-100"
            style={{ background: webtoon.coverGradient }}
          >
            {showImage && (
              <img
                src={webtoon.thumbnailUrl}
                alt={`${webtoon.title} 표지`}
                loading="lazy"
                onError={() => setImgOk(false)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {webtoon.isAdult && (
              <div className="absolute inset-0 bg-black text-white">
                <AdultCoverMark fill />
                <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-medium drop-shadow">
                  19금 가림
                </span>
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={href} className="min-w-0">
              <h3 className="truncate text-base font-bold text-ink-900 hover:underline">
                {webtoon.title}
              </h3>
              <p className="truncate text-xs text-ink-500">
                {webtoon.authors.writer}, {webtoon.authors.artist} | {webtoon.genre}
              </p>
            </Link>
            <PlatformLogo
              name={platformName}
              logoUrl={platformLogoUrl}
              size="md"
              className="mt-0.5"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {axisTags.slice(0, 2).map((tag) => (
              <span
                key={tag.name}
                className="rounded-full bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-700"
              >
                #{tag.name}
              </span>
            ))}
          </div>

          {webtoon.catchphrase && (
            <div className="mt-2 flex items-start gap-1.5">
              <AiSummaryMark className="mt-0.5" />
              <p className="line-clamp-2 min-w-0 text-xs italic text-ink-500">"{webtoon.catchphrase}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key ? 'bg-brand-500 text-white' : 'border border-ink-100 text-ink-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[120px] rounded-xl bg-ink-50 p-4">
        {tab === 'reason' && (
          <div>
            <p className="mb-3 text-sm font-bold text-ink-900">작품을 추천하는 이유</p>
            {reasonText && <p className="mb-3 text-sm leading-relaxed text-ink-700">{reasonText}</p>}
            <ScoreBar label="검색어 기반" value={queryScore} icon="🔍" />
            <ScoreBar label="취향기반" value={tasteScore} icon="❤" />
            <p className="mt-3 text-sm font-bold text-ink-900">
              총 적합도: <span className="text-brand-600">{total}점</span>
            </p>
          </div>
        )}

        {tab === 'rate' && (
          <div className="flex flex-col items-center">
            <RadarChart axes={axisTags} size={220} />
            <p className="mt-1 text-xs text-ink-500">😼 추천율 상세보기</p>
          </div>
        )}

        {tab === 'synopsis' && <p className="text-sm leading-relaxed text-ink-700">{webtoon.synopsis}</p>}
      </div>
    </div>
  )
}
