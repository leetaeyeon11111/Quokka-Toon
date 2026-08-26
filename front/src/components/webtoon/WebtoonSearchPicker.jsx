import { useEffect, useState } from 'react'
import { searchWebtoons } from '../../api/webtoon'
import { toCardModel } from '../../lib/webtoon'

function MiniThumb({ webtoon, className = '' }) {
  const [imgOk, setImgOk] = useState(true)
  const showImage = webtoon.thumbnailUrl && imgOk && !webtoon.isAdult
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: webtoon.coverGradient }}
    >
      {showImage && (
        <img
          src={webtoon.thumbnailUrl}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

function SearchLoading() {
  return (
    <div className="flex flex-col items-center gap-2 py-5" aria-busy="true" aria-label="검색 중">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-ink-100 border-t-brand-500 motion-reduce:animate-none"
        aria-hidden
      />
      <p className="text-xs text-ink-400">검색 중…</p>
    </div>
  )
}

/** 인생작과 같은 작품명 검색으로 웹툰 1건을 고르는 픽커 */
export default function WebtoonSearchPicker({ value, onChange }) {
  const [keyword, setKeyword] = useState('')
  const [candidates, setCandidates] = useState([])
  const [picking, setPicking] = useState(false)
  const [searching, setSearching] = useState(false)
  const isPicking = picking || !value

  useEffect(() => {
    let cancelled = false
    async function search() {
      if (!isPicking || !keyword.trim()) {
        if (!cancelled) {
          setCandidates([])
          setSearching(false)
        }
        return
      }
      if (!cancelled) setSearching(true)
      try {
        const data = await searchWebtoons({ q: keyword.trim(), size: 20 })
        if (!cancelled) setCandidates((data?.content ?? []).map(toCardModel))
      } catch {
        if (!cancelled) setCandidates([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }
    const timer = setTimeout(search, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isPicking, keyword])

  if (!isPicking && value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-3 py-2">
        <MiniThumb webtoon={value} className="h-12 w-9 shrink-0 rounded" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{value.title}</span>
        <button
          type="button"
          onClick={() => {
            setPicking(true)
            setKeyword('')
            setCandidates([])
            setSearching(false)
          }}
          className="shrink-0 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          변경
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <input
        autoFocus
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value)
          setSearching(Boolean(e.target.value.trim()))
        }}
        placeholder="작품명 검색"
        className="mb-2 w-full rounded-full border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none"
      />
      <div className="max-h-56 overflow-y-auto">
        {!keyword.trim() && (
          <p className="py-3 text-center text-xs text-ink-400">작품명을 검색해 선택해주세요.</p>
        )}
        {keyword.trim() && searching && <SearchLoading />}
        {keyword.trim() && !searching && candidates.length === 0 && (
          <p className="py-3 text-center text-xs text-ink-400">검색 결과가 없어요.</p>
        )}
        {!searching &&
          candidates.map((w) => {
            const active = value?.id === w.id
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onChange(w)
                  setPicking(false)
                  setKeyword('')
                  setCandidates([])
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
              >
                <MiniThumb webtoon={w} className="h-10 w-8 shrink-0 rounded" />
                <span className="flex-1 truncate text-sm text-ink-900">{w.title}</span>
                <span className={active ? 'text-brand-500' : 'text-ink-200'}>{active ? '★' : '☆'}</span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
