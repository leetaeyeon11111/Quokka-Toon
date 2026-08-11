import { useMemo, useState } from 'react'
import { WEBTOONS, GENRES, PLATFORM_NAMES } from '../data/webtoons'
import WebtoonCard from '../components/webtoon/WebtoonCard'

const SORT_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'bookmark', label: '북마크순' },
  { key: 'views', label: '조회순' },
  { key: 'rating', label: '평점순' },
]

function FilterRow({ label, options, active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-12 shrink-0 text-sm font-semibold text-ink-500">{label}</span>
      <button
        type="button"
        onClick={() => onChange('전체')}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          active === '전체' ? 'bg-brand-500 text-white' : 'border border-ink-100 text-ink-500'
        }`}
      >
        전체
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            active === opt ? 'bg-brand-500 text-white' : 'border border-ink-100 text-ink-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function WebtoonListPage() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [platform, setPlatform] = useState('전체')
  const [genre, setGenre] = useState('전체')
  const [sort, setSort] = useState('latest')

  const filtered = useMemo(() => {
    let list = WEBTOONS.filter((w) => {
      if (platform !== '전체' && w.platforms[0]?.name !== platform) return false
      if (genre !== '전체' && w.genre !== genre) return false
      if (submittedKeyword.trim()) {
        const kw = submittedKeyword.trim().toLowerCase()
        const haystack = `${w.title} ${w.authors.writer} ${w.authors.artist}`.toLowerCase()
        if (!haystack.includes(kw)) return false
      }
      return true
    })

    list = [...list]
    if (sort === 'views') list.sort((a, b) => b.stats.views - a.stats.views)
    else if (sort === 'rating') list.sort((a, b) => b.stats.ratingAvg - a.stats.ratingAvg)
    else if (sort === 'bookmark') list.sort((a, b) => b.stats.commentCount - a.stats.commentCount)
    // 'latest'는 데이터 등록 순서를 그대로 사용

    return list
  }, [platform, genre, sort, submittedKeyword])

  return (
    <div className="px-6 py-10">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">
          일반웹툰{' '}
          <span className="text-sm font-normal text-ink-500">
            {SORT_OPTIONS.find((s) => s.key === sort)?.label} · 총 {filtered.length}개
          </span>
        </h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmittedKeyword(keyword)
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="작품, 작가 등을 검색"
          className="flex-1 rounded-full border border-ink-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          검색
        </button>
      </form>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4">
        <FilterRow label="플랫폼" options={PLATFORM_NAMES} active={platform} onChange={setPlatform} />
        <FilterRow label="장르" options={GENRES} active={genre} onChange={setGenre} />
      </div>

      <div className="mb-4 flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-semibold text-ink-700 outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              정렬: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-500">조건에 맞는 웹툰이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((webtoon) => (
            <WebtoonCard key={webtoon.id} webtoon={webtoon} className="w-full" />
          ))}
        </div>
      )}
    </div>
  )
}
