import { useState } from 'react'
import { WEBTOONS, getWebtoonById } from '../../data/webtoons'
import Modal from '../common/Modal'

export default function LifeWorksModal({ lifeWorks, onToggle, onClose }) {
  const [picking, setPicking] = useState(false)
  const [keyword, setKeyword] = useState('')

  const works = lifeWorks.map(getWebtoonById).filter(Boolean)
  const candidates = WEBTOONS.filter(
    (w) => w.title.includes(keyword) || w.authors.writer.includes(keyword),
  )

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
                  style={{ background: w.coverGradient }}
                >
                  <span className="absolute inset-0 hidden items-center justify-center bg-ink-900/60 text-xs font-semibold text-white group-hover:flex">
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
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="작품명, 작가 검색"
            className="mb-3 w-full rounded-full border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none"
          />
          <div className="max-h-72 overflow-y-auto">
            {candidates.map((w) => {
              const active = lifeWorks.includes(w.id)
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onToggle(w.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
                >
                  <div
                    className="h-10 w-8 shrink-0 rounded"
                    style={{ background: w.coverGradient }}
                  />
                  <span className="flex-1 truncate text-sm text-ink-900">{w.title}</span>
                  <span className={active ? 'text-brand-500' : 'text-ink-200'}>{active ? '★' : '☆'}</span>
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
