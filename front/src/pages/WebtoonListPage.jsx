import { useEffect, useState } from 'react'
import { searchWebtoons, getGenreOptions, getPlatformOptions } from '../api/webtoon'
import { toCardModel } from '../lib/webtoon'
import WebtoonCard from '../components/webtoon/WebtoonCard'

const SORT_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'bookmark', label: '북마크순' },
  { key: 'views', label: '조회순' },
  { key: 'rating', label: '평점순' },
]

const PAGE_SIZE = 24

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
  const [page, setPage] = useState(0)

  const [genreOptions, setGenreOptions] = useState([])
  const [platformOptions, setPlatformOptions] = useState([])

  const [items, setItems] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 필터 옵션 1회 로드
  useEffect(() => {
    getGenreOptions().then((data) => setGenreOptions((data ?? []).slice(0, 20))).catch(() => {})
    getPlatformOptions().then((data) => setPlatformOptions((data ?? []).slice(0, 16))).catch(() => {})
  }, [])

  // 필터/정렬/검색은 항상 첫 페이지부터 다시 조회
  function changePlatform(v) {
    setPlatform(v)
    setPage(0)
  }
  function changeGenre(v) {
    setGenre(v)
    setPage(0)
  }
  function changeSort(v) {
    setSort(v)
    setPage(0)
  }
  function submitSearch(e) {
    e.preventDefault()
    setSubmittedKeyword(keyword)
    setPage(0)
  }

  // 목록 로드
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await searchWebtoons({
          page,
          size: PAGE_SIZE,
          sort,
          q: submittedKeyword.trim(),
          platform: platform === '전체' ? '' : platform,
          genre: genre === '전체' ? '' : genre,
        })
        if (cancelled) return
        setItems((data?.content ?? []).map(toCardModel))
        setTotalElements(data?.totalElements ?? 0)
        setTotalPages(data?.totalPages ?? 0)
      } catch (err) {
        if (!cancelled) setError(err.message ?? '웹툰을 불러오지 못했어요.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [page, sort, submittedKeyword, platform, genre])

  return (
    <div className="px-6 py-10">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">
          일반웹툰{' '}
          <span className="text-sm font-normal text-ink-500">
            {SORT_OPTIONS.find((s) => s.key === sort)?.label} · 총 {totalElements.toLocaleString()}개
          </span>
        </h1>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="작품명을 검색"
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
        <FilterRow label="플랫폼" options={platformOptions} active={platform} onChange={changePlatform} />
        <FilterRow label="장르" options={genreOptions} active={genre} onChange={changeGenre} />
      </div>

      <div className="mb-4 flex justify-end">
        <select
          value={sort}
          onChange={(e) => changeSort(e.target.value)}
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-semibold text-ink-700 outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              정렬: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : error ? (
        <p className="py-20 text-center text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-500">조건에 맞는 웹툰이 없어요.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((webtoon) => (
              <WebtoonCard key={webtoon.id} webtoon={webtoon} className="w-full" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => {
                  setPage((p) => Math.max(0, p - 1))
                  window.scrollTo({ top: 0 })
                }}
                className="rounded-full border border-ink-100 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-40"
              >
                ← 이전
              </button>
              <span className="text-sm text-ink-500">
                {page + 1} / {totalPages.toLocaleString()}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => {
                  setPage((p) => p + 1)
                  window.scrollTo({ top: 0 })
                }}
                className="rounded-full border border-ink-100 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-40"
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
