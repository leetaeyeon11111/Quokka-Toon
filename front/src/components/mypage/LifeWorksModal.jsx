import { useEffect, useState } from 'react'
import { searchWebtoons } from '../../api/webtoon'
import { fetchWebtoonModelsByIds, toCardModel } from '../../lib/webtoon'
import Modal from '../common/Modal'

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
    <div className="flex flex-col items-center gap-2 py-6" aria-busy="true" aria-label="검색 중">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-ink-100 border-t-brand-500 motion-reduce:animate-none"
        aria-hidden
      />
      <p className="text-xs text-ink-400">검색 중…</p>
    </div>
  )
}

export default function LifeWorksModal({ lifeWorks, onToggle, onClose }) {
  const [picking, setPicking] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [works, setWorks] = useState([])
  const [candidates, setCandidates] = useState([])
  const [searching, setSearching] = useState(false)

  // 담은 인생작 실제 웹툰 로드
  useEffect(() => {
    let cancelled = false
    async function load() {
      const models = await fetchWebtoonModelsByIds(lifeWorks)
      if (!cancelled) setWorks(models)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lifeWorks])

  // 인생작 고르기: 제목 검색 (실 DB)
  useEffect(() => {
    let cancelled = false
    async function search() {
      if (!picking || !keyword.trim()) {
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
  }, [picking, keyword])

  return (
    <Modal title={`내 인생작 (${works.length})`} icon="🗂" onClose={onClose} maxWidth="max-w-lg">
      {!picking ? (
        <>
          {works.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">아직 담은 인생작이 없어요.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {works.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onToggle(w.id)}
                  title="탭하면 제거돼요"
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-ink-100"
                >
                  <MiniThumb webtoon={w} className="absolute inset-0 h-full w-full" />
                  <span className="absolute inset-0 z-10 hidden items-center justify-center bg-ink-900/60 text-xs font-semibold text-white group-hover:flex">
                    제거
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPicking(true)}
            className="mt-4 w-full rounded-full border border-dashed border-ink-100 py-3 text-sm font-semibold text-ink-500 hover:bg-ink-50"
          >
            + 내 인생작 고르기
          </button>
        </>
      ) : (
        <>
          <input
            autoFocus
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setSearching(Boolean(e.target.value.trim()))
            }}
            placeholder="작품명 검색"
            className="mb-3 w-full rounded-full border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none"
          />
          <div className="max-h-72 overflow-y-auto">
            {keyword.trim() && searching && <SearchLoading />}
            {keyword.trim() && !searching && candidates.length === 0 && (
              <p className="py-4 text-center text-xs text-ink-400">검색 결과가 없어요.</p>
            )}
            {!searching &&
              candidates.map((w) => {
                const active = lifeWorks.includes(w.id) || lifeWorks.includes(String(w.id))
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onToggle(w.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
                  >
                    <MiniThumb webtoon={w} className="h-10 w-8 shrink-0 rounded" />
                    <span className="flex-1 truncate text-sm text-ink-900">{w.title}</span>
                    <span className={active ? 'text-brand-500' : 'text-ink-200'}>
                      {active ? '★' : '☆'}
                    </span>
                  </button>
                )
              })}
          </div>
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="mt-3 w-full rounded-full bg-ink-900 py-3 text-sm font-semibold text-white hover:bg-ink-700"
          >
            완료
          </button>
        </>
      )}
    </Modal>
  )
}
