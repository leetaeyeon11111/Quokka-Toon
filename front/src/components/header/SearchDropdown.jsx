import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const RECENT_SEARCH_KEY = 'quokkatoon:recent-keyword-searches'

function readRecentSearches() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string').slice(0, 8) : []
  } catch {
    return []
  }
}

export default function SearchDropdown({ onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [value, setValue] = useState('')
  const [recent, setRecent] = useState(readRecentSearches)
  const [error, setError] = useState('')

  useEffect(() => {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recent))
  }, [recent])

  function submit(query) {
    const trimmedQuery = (query ?? value).trim()
    if (!trimmedQuery) {
      setError('검색어를 입력해주세요.')
      inputRef.current?.focus()
      return
    }

    const nextRecent = [
      trimmedQuery,
      ...recent.filter((item) => item !== trimmedQuery),
    ].slice(0, 8)
    // 경로 이동으로 드롭다운이 즉시 언마운트되어도 검색 기록은 먼저 확정한다.
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextRecent))
    setRecent(nextRecent)
    setError('')
    navigate(`/webtoons?q=${encodeURIComponent(trimmedQuery)}`)
    onClose()
  }

  return (
    <div
      id="header-search-panel"
      role="dialog"
      aria-label="웹툰 검색"
      className="absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white shadow-lg"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-6">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label htmlFor="header-webtoon-search" className="mb-2 block text-sm font-bold text-ink-900">
            웹툰 검색
          </label>
          <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50 px-2 py-2 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100/70">
            <input
              id="header-webtoon-search"
              ref={inputRef}
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (event.target.value.trim()) setError('')
              }}
              placeholder="작품명을 입력하세요"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'header-search-error' : undefined}
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink-900 outline-none placeholder:text-ink-300"
            />
            {value && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  setValue('')
                  setError('')
                  inputRef.current?.focus()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 transition hover:bg-white hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <span aria-hidden>✕</span>
              </button>
            )}
            <button
              type="submit"
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink-900 px-4 text-xs font-bold text-white transition hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              <span aria-hidden>🔍</span>
              검색
            </button>
          </div>
          {error && (
            <p id="header-search-error" role="alert" className="mt-2 px-3 text-xs font-medium text-brand-600">
              {error}
            </p>
          )}
        </form>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">최근 검색</h3>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => setRecent([])}
                className="text-xs text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
              >
                전체 삭제
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
              아직 검색 기록이 없어요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recent.map((item) => (
                <span
                  key={item}
                  className="flex max-w-64 items-center gap-1 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-700"
                >
                  <button type="button" className="truncate hover:text-brand-600" onClick={() => submit(item)}>
                    {item}
                  </button>
                  <button
                    type="button"
                    aria-label={`${item} 검색 기록 삭제`}
                    className="text-ink-300 hover:text-ink-700"
                    onClick={() => setRecent((previous) => previous.filter((entry) => entry !== item))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
          <Link to="/webtoons" onClick={onClose} className="text-sm font-semibold text-brand-600 hover:underline">
            전체 웹툰 둘러보기 →
          </Link>
          <button type="button" onClick={onClose} className="text-sm text-ink-500 hover:text-ink-900">
            닫기 ✕
          </button>
        </div>
      </div>
    </div>
  )
}
