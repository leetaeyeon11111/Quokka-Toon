import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchWebtoons, getGenreOptions, getPlatformOptions } from '../api/webtoon'
import { toCardModel } from '../lib/webtoon'
import WebtoonCard from '../components/webtoon/WebtoonCard'
import { ResultGridSkeleton, ResultMessage } from '../components/common/ResultState'

const SORT_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'bookmark', label: '북마크순' },
  { key: 'views', label: '조회순' },
  { key: 'rating', label: '평점순' },
]

const PAGE_SIZE = 24

// 페이지네이션에서 한 번에 보여줄 최대 페이지 번호 개수
const PAGE_WINDOW_SIZE = 10

// 현재 페이지 주변으로 최대 size개의 페이지 번호(1-based)를 계산한다.
function getPageWindow(current, total, size) {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - Math.floor(size / 2))
  const end = Math.min(total, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function PageButton({ active, disabled, onClick, children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition disabled:opacity-40 ${
        active
          ? 'bg-brand-500 text-white'
          : 'border border-ink-100 text-ink-700 hover:bg-ink-50'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}

function FilterRow({ label, options, active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-12 shrink-0 text-sm font-semibold text-ink-500">{label}</span>
      <button
        type="button"
        aria-pressed={active === '전체'}
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
          aria-pressed={active === opt}
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

function WebtoonListContent({ initialFilters, setSearchParams }) {
  const [keyword, setKeyword] = useState(initialFilters.q)
  const submittedKeyword = initialFilters.q
  const platform = initialFilters.platform
  const genre = initialFilters.genre
  const sort = initialFilters.sort
  const page = initialFilters.page

  const [genreOptions, setGenreOptions] = useState([])
  const [platformOptions, setPlatformOptions] = useState([])

  const [items, setItems] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // 필터 옵션 1회 로드
  useEffect(() => {
    getGenreOptions().then((data) => setGenreOptions((data ?? []).slice(0, 20))).catch(() => {})
    getPlatformOptions().then((data) => setPlatformOptions((data ?? []).slice(0, 16))).catch(() => {})
  }, [])

  // 필터/정렬/검색/페이지 상태는 URL 검색 파라미터에 보관한다.
  // → 상세보기에 들어갔다 브라우저 뒤로가기로 돌아와도 검색 상황이 URL로 그대로 복원된다.
  function updateFilters(overrides) {
    const next = { q: submittedKeyword, platform, genre, sort, page, ...overrides }
    const params = new URLSearchParams()
    if (next.q) params.set('q', next.q)
    if (next.platform !== '전체') params.set('platform', next.platform)
    if (next.genre !== '전체') params.set('genre', next.genre)
    if (next.sort !== 'latest') params.set('sort', next.sort)
    if (next.page > 0) params.set('page', String(next.page + 1))
    setSearchParams(params)
  }

  const changePlatform = (value) => updateFilters({ platform: value, page: 0 })
  const changeGenre = (value) => updateFilters({ genre: value, page: 0 })
  const changeSort = (value) => updateFilters({ sort: value, page: 0 })

  function submitSearch(e) {
    e.preventDefault()
    const trimmedKeyword = keyword.trim()
    updateFilters({ q: trimmedKeyword, page: 0 })
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
  }, [page, sort, submittedKeyword, platform, genre, reloadKey])

  return (
    <div className="px-6 py-10">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">
          전체 웹툰{' '}
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
        <ResultGridSkeleton />
      ) : error ? (
        <ResultMessage
          icon="⚠️"
          title="웹툰 목록을 불러오지 못했어요"
          description={error}
          actionLabel="다시 시도"
          onAction={() => setReloadKey((key) => key + 1)}
        />
      ) : items.length === 0 ? (
        <ResultMessage
          title="조건에 맞는 웹툰이 없어요"
          description="검색어나 필터를 조금 바꿔서 다시 찾아보세요."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((webtoon) => (
              <WebtoonCard key={webtoon.id} webtoon={webtoon} className="w-full" />
            ))}
          </div>

          {totalPages > 1 &&
            (() => {
              const goToPage = (targetIndex) => {
                updateFilters({ page: targetIndex })
                window.scrollTo({ top: 0 })
              }
              // 1-based 페이지 번호 창 (현재 페이지 주변 최대 10개)
              const windowPages = getPageWindow(page + 1, totalPages, PAGE_WINDOW_SIZE)
              const showLeadingEllipsis = windowPages[0] > 1
              const showTrailingEllipsis = windowPages[windowPages.length - 1] < totalPages

              return (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
                  {/* 맨 왼쪽: 가장 처음 페이지로 이동 */}
                  <PageButton
                    disabled={page === 0}
                    onClick={() => goToPage(0)}
                    aria-label="첫 페이지"
                  >
                    «
                  </PageButton>

                  {showLeadingEllipsis && (
                    <span className="px-1 text-sm text-ink-400" aria-hidden>
                      …
                    </span>
                  )}

                  {windowPages.map((n) => (
                    <PageButton key={n} active={n === page + 1} onClick={() => goToPage(n - 1)}>
                      {n}
                    </PageButton>
                  ))}

                  {showTrailingEllipsis && (
                    <span className="px-1 text-sm text-ink-400" aria-hidden>
                      …
                    </span>
                  )}

                  {/* 맨 오른쪽: 가장 마지막 페이지로 이동 */}
                  <PageButton
                    disabled={page + 1 >= totalPages}
                    onClick={() => goToPage(totalPages - 1)}
                    aria-label="마지막 페이지"
                  >
                    »
                  </PageButton>
                </div>
              )
            })()}
        </>
      )}
    </div>
  )
}

export default function WebtoonListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page'))
  const sortParam = searchParams.get('sort') ?? 'latest'
  const initialFilters = {
    q: searchParams.get('q') ?? '',
    platform: searchParams.get('platform') ?? '전체',
    genre: searchParams.get('genre') ?? '전체',
    sort: SORT_OPTIONS.some((option) => option.key === sortParam) ? sortParam : 'latest',
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam - 1 : 0,
  }

  return (
    <WebtoonListContent
      key={searchParams.toString()}
      initialFilters={initialFilters}
      setSearchParams={setSearchParams}
    />
  )
}
