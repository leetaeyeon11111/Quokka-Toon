import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGenreOptions, getPopularTags } from '../../api/webtoon'
import { useAuth } from '../../hooks/useAuth'
import { buildAiPromptSuggestions } from '../../lib/aiSearchPrompts'
import {
  readAiSearchMode,
  writeAiSearchMode,
} from '../../lib/recentSearches'
import {
  clearRecentSearches,
  loadRecentSearches,
  rememberSearch,
  removeRecentSearch,
} from '../../lib/searchHistorySync'

function AiToggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'AI 검색 켜짐' : 'AI 검색 꺼짐'}
      title={on ? 'AI 검색 끄기' : 'AI 검색 켜기'}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        on
          ? 'bg-gradient-to-r from-brand-500 to-mint-500'
          : 'bg-ink-100'
      }`}
    >
      <span
        className={`absolute text-[10px] font-extrabold tracking-wide transition ${
          on ? 'left-1.5 text-white' : 'right-1.5 text-ink-300'
        }`}
      >
        AI
      </span>
      <span
        className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
          on ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ChipRow({ items, emptyText, onPick, onRemove }) {
  if (!items.length) {
    return (
      <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
        {emptyText}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="flex max-w-64 items-center gap-1 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-700"
        >
          <button type="button" className="truncate hover:text-brand-600" onClick={() => onPick(item)}>
            {item}
          </button>
          {onRemove && (
            <button
              type="button"
              aria-label={`${item} 삭제`}
              className="text-ink-300 hover:text-ink-700"
              onClick={() => onRemove(item)}
            >
              ✕
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

export default function SearchDropdown({ onClose }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const inputRef = useRef(null)
  const [aiMode, setAiMode] = useState(readAiSearchMode)
  const [value, setValue] = useState('')
  const [recentKeyword, setRecentKeyword] = useState([])
  const [recentAi, setRecentAi] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [genres, setGenres] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState('')
  const [promptSeed, setPromptSeed] = useState(0)

  useEffect(() => {
    writeAiSearchMode(aiMode)
  }, [aiMode])

  // 로그인 여부가 바뀌거나 패널이 열릴 때 모드별 최근 검색을 각각 불러온다.
  useEffect(() => {
    let cancelled = false
    async function loadRecents() {
      const [keywordList, aiList] = await Promise.all([
        loadRecentSearches('NORMAL'),
        loadRecentSearches('AI'),
      ])
      if (!cancelled) {
        setRecentKeyword(keywordList)
        setRecentAi(aiList)
        setPromptSeed((n) => n + 1)
      }
    }
    loadRecents()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  useEffect(() => {
    let cancelled = false
    async function loadMeta() {
      setLoadingMeta(true)
      try {
        const [tags, genreList] = await Promise.all([
          getPopularTags({ limit: 16 }),
          getGenreOptions(),
        ])
        if (!cancelled) {
          setPopularTags(Array.isArray(tags) ? tags.filter(Boolean) : [])
          setGenres(Array.isArray(genreList) ? genreList.filter(Boolean).slice(0, 12) : [])
          setPromptSeed((n) => n + 1)
        }
      } catch {
        if (!cancelled) {
          setPopularTags([])
          setGenres([])
        }
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    }
    loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  const aiPrompts = useMemo(
    () =>
      buildAiPromptSuggestions({
        tags: popularTags,
        genres,
        recentAi,
        limit: 6,
      }),
    // promptSeed 로 패널을 열거나 메타 갱신 시 조합을 다시 섞는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [popularTags, genres, recentAi, promptSeed],
  )

  function setMode(next) {
    setAiMode(next)
    setError('')
    setPromptSeed((n) => n + 1)
    inputRef.current?.focus()
  }

  async function submit(query = value) {
    const trimmedQuery = (query ?? '').trim()
    if (!trimmedQuery) {
      setError(aiMode ? '문장으로 검색어를 입력해주세요.' : '검색어를 입력해주세요.')
      inputRef.current?.focus()
      return
    }

    if (aiMode) {
      const nextRecent = await rememberSearch(trimmedQuery, 'AI')
      setRecentAi(nextRecent)
      navigate(`/recommend?q=${encodeURIComponent(trimmedQuery)}&mode=ai`)
    } else {
      const nextRecent = await rememberSearch(trimmedQuery, 'NORMAL')
      setRecentKeyword(nextRecent)
      navigate(`/webtoons?q=${encodeURIComponent(trimmedQuery)}`)
    }
    setError('')
    onClose()
  }

  async function submitTag(tag) {
    const nextRecent = await rememberSearch(tag, 'NORMAL')
    setRecentKeyword(nextRecent)
    navigate(`/webtoons?tag=${encodeURIComponent(tag)}`)
    onClose()
  }

  const recent = aiMode ? recentAi : recentKeyword
  const placeholder = aiMode
    ? '문장으로 검색해보세요'
    : '작품, 작가, 태그 검색'

  return (
    <div
      id="header-search-panel"
      role="dialog"
      aria-label="웹툰 검색"
      className="absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white shadow-lg"
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-2 py-1.5 shadow-sm focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100/70">
            <AiToggle on={aiMode} onChange={setMode} />
            <label htmlFor="header-webtoon-search" className="sr-only">
              {aiMode ? 'AI 문장 검색' : '웹툰 검색'}
            </label>
            <input
              id="header-webtoon-search"
              ref={inputRef}
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (event.target.value.trim()) setError('')
              }}
              placeholder={placeholder}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'header-search-error' : aiMode ? 'header-ai-hint' : undefined}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink-900 outline-none placeholder:text-ink-300"
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
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition hover:bg-ink-50 hover:text-ink-700"
              >
                <span aria-hidden>✕</span>
              </button>
            )}
            <button
              type="submit"
              aria-label={aiMode ? 'AI 검색' : '검색'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </button>
          </div>
          {error && (
            <p id="header-search-error" role="alert" className="mt-2 px-3 text-xs font-medium text-brand-600">
              {error}
            </p>
          )}
        </form>

        {aiMode ? (
          <>
            <p id="header-ai-hint" className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-500">
              <span aria-hidden className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-ink-300 text-[9px] font-bold">
                i
              </span>
              이 AI는 이미지 생성형이 아니며, 작가님의 소중한 그림은 학습되지 않습니다.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink-900">AI 추천 문장</h3>
                <button
                  type="button"
                  onClick={() => setPromptSeed((n) => n + 1)}
                  className="text-xs font-semibold text-mint-500 hover:underline"
                  disabled={loadingMeta && aiPrompts.length === 0}
                >
                  다른 문장
                </button>
              </div>
              {loadingMeta && aiPrompts.length === 0 ? (
                <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
                  추천 문장을 불러오는 중…
                </p>
              ) : aiPrompts.length === 0 ? (
                <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
                  아직 추천 문장을 만들 데이터가 부족해요. 문장으로 먼저 검색해보세요.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {aiPrompts.map((prompt) => (
                    <button
                      key={`${prompt.label}-${prompt.query}`}
                      type="button"
                      onClick={() => submit(prompt.query)}
                      className="rounded-full border border-mint-500/40 bg-gradient-to-r from-mint-100/80 to-brand-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-900">최근 검색 · AI</h3>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      setRecentAi(await clearRecentSearches('AI'))
                    }}
                    className="text-xs text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              <ChipRow
                items={recent}
                emptyText="아직 AI 검색 기록이 없어요."
                onPick={submit}
                onRemove={async (item) => {
                  setRecentAi(await removeRecentSearch(item, 'AI'))
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-900">최근 검색 · 일반</h3>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      setRecentKeyword(await clearRecentSearches('NORMAL'))
                    }}
                    className="text-xs text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              <ChipRow
                items={recent}
                emptyText="아직 일반 검색 기록이 없어요."
                onPick={submit}
                onRemove={async (item) => {
                  setRecentKeyword(await removeRecentSearch(item, 'NORMAL'))
                }}
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-900">인기 태그</h3>
                <Link
                  to="/webtoons"
                  onClick={onClose}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  전체 웹툰
                </Link>
              </div>
              {loadingMeta ? (
                <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
                  인기 태그를 불러오는 중…
                </p>
              ) : popularTags.length === 0 ? (
                <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
                  표시할 인기 태그가 없어요.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => submitTag(tag)}
                      className="rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
          <Link
            to={aiMode ? '/?focus=ai' : '/webtoons'}
            onClick={onClose}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {aiMode ? 'AI 추천 검색으로 →' : '전체 웹툰 둘러보기 →'}
          </Link>
          <button type="button" onClick={onClose} className="text-sm text-ink-500 hover:text-ink-900">
            닫기 ✕
          </button>
        </div>
      </div>
    </div>
  )
}
