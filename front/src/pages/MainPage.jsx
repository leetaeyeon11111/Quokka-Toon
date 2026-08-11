import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WEBTOONS } from '../data/webtoons'
import WebtoonCard from '../components/webtoon/WebtoonCard'

const PLACEHOLDER_QUERIES = [
  '비 오는 날 읽기 좋은 힐링 만화…',
  '소꿉친구랑 꽁냥꽁냥 대는 로맨스…',
  '빌런을 참교육하는 사이다 복수극…',
  '두뇌싸움이 짜릿한 다크 판타지…',
]

const NOTICES = [
  { id: 1, title: '쿼카툰 8월 업데이트 안내', tone: '#ffe4d1' },
  { id: 2, title: '신규 추천 알고리즘 베타 오픈', tone: '#e2f7f2' },
  { id: 3, title: '이용약관 개정 안내', tone: '#e5e4e7' },
]

function Top10Slider({ items }) {
  const visibleCount = 5
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const extended = [...items, ...items.slice(0, visibleCount)]
  const cardWidth = 176 // 160px card + 16px gap

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => i + 1), 3500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (index === items.length) {
      const timeout = setTimeout(() => {
        setAnimate(false)
        setIndex(0)
      }, 500)
      return () => clearTimeout(timeout)
    }
    if (!animate) {
      const raf = requestAnimationFrame(() => setAnimate(true))
      return () => cancelAnimationFrame(raf)
    }
  }, [index, items.length, animate])

  return (
    <div className="overflow-hidden" style={{ width: cardWidth * visibleCount }}>
      <div
        className={animate ? 'flex transition-transform duration-500 ease-out' : 'flex'}
        style={{ transform: `translateX(-${index * cardWidth}px)` }}
      >
        {extended.map((webtoon, i) => (
          <div key={`${webtoon.id}-${i}`} className="mr-4 shrink-0">
            <div className="relative">
              <span className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow">
                {(i % items.length) + 1}
              </span>
              <WebtoonCard webtoon={webtoon} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoticeCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % NOTICES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const notice = NOTICES[index]

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="이전 공지"
        onClick={() => setIndex((i) => (i - 1 + NOTICES.length) % NOTICES.length)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-500 hover:bg-white"
      >
        ‹
      </button>

      <div
        className="flex aspect-video flex-1 items-center justify-center rounded-xl text-sm font-semibold text-ink-700 transition-colors"
        style={{ background: notice.tone }}
      >
        📢 {notice.title}
      </div>

      <button
        type="button"
        aria-label="다음 공지"
        onClick={() => setIndex((i) => (i + 1) % NOTICES.length)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-500 hover:bg-white"
      >
        ›
      </button>

      <div className="absolute left-1/2 mt-24 flex -translate-x-1/2 gap-1.5">
        {NOTICES.map((n, i) => (
          <span
            key={n.id}
            className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-ink-700' : 'bg-ink-100'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function MainPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_QUERIES.length),
      3000,
    )
    return () => clearInterval(timer)
  }, [])

  const top10 = useMemo(
    () => [...WEBTOONS].sort((a, b) => b.stats.views - a.stats.views).slice(0, 10),
    [],
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/recommend?q=${encodeURIComponent(query)}&mode=ai`)
  }

  // Math.random()은 순수하지 않으므로 렌더 중이 아닌 클릭(이벤트 핸들러) 시점에 고른다.
  function goToFeatured() {
    const featured = WEBTOONS[Math.floor(Math.random() * WEBTOONS.length)]
    navigate(`/webtoons/${featured.id}`)
  }

  return (
    <div className="flex flex-col gap-14 px-6 py-14">
      <section className="mx-auto w-full max-w-2xl text-center">
        <h1 className="mb-6 text-3xl font-bold text-ink-900 sm:text-4xl">무엇을 보고 싶으세요?</h1>
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full border border-ink-100 bg-white p-2 shadow-sm"
        >
          <span className="pl-2 text-xl" aria-hidden>
            🎲
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`"${PLACEHOLDER_QUERIES[placeholderIndex]}"`}
            className="flex-1 bg-transparent px-1 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white transition hover:bg-ink-700"
            aria-label="검색"
          >
            🔍
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-ink-900">
            🔥 TOP 10
          </h2>
          <span className="text-xs text-ink-300">← 자동 슬라이드</span>
        </div>
        <Top10Slider items={top10} />
      </section>

      <section>
        <button
          type="button"
          onClick={goToFeatured}
          className="flex w-full items-center justify-between rounded-2xl border border-brand-300 bg-brand-50 px-6 py-4 text-left transition hover:bg-brand-100"
        >
          <span className="font-semibold text-brand-700">🎯 맞춤 추천 — 오늘의 팀 선정작 보러가기</span>
          <span className="text-brand-500">→</span>
        </button>
      </section>

      <section className="relative pb-10">
        <NoticeCarousel />
      </section>
    </div>
  )
}
