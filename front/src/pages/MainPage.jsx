import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { searchWebtoons } from '../api/webtoon'
import { getQuickPrompts } from '../api/quickPrompt'
import { TEAM_PICK_IDS } from '../data/teamPicks'
import { toCardModel } from '../lib/webtoon'
import FeaturePromoCarousel from '../components/home/ContinuousFeaturePromoCarousel'
import FloatingQuokkas from '../components/home/FloatingQuokkas'
import {
  advanceSheetWheelGesture,
  getSheetSnapDestination,
  getSheetWheelIntent,
  SHEET_WHEEL_GESTURE_IDLE_MS,
} from '../lib/homeSheet'
import { webtoonHref } from '../lib/navigation'
import HorizontalWebtoonSlider from '../components/webtoon/HorizontalWebtoonSlider'

const PLACEHOLDER_QUERIES = [
  '비 오는 날 읽기 좋은 힐링 만화…',
  '소꿉친구랑 꽁냥꽁냥 대는 로맨스…',
  '빌런을 참교육하는 사이다 복수극…',
  '두뇌싸움이 짜릿한 다크 판타지…',
]

// 백엔드(/api/quick-prompts)에서 못 불러올 때 쓰는 기본값. 관리자가 편집하면 API 값으로 대체된다.
const DEFAULT_QUICK_PROMPTS = [
  { label: '비 오는 날 힐링', query: '비 오는 날 편안하게 읽기 좋은 힐링 웹툰' },
  { label: '설레는 로맨스', query: '서로 천천히 가까워지는 설레는 로맨스 웹툰' },
  { label: '빌런 참교육', query: '빌런을 시원하게 참교육하는 사이다 복수극' },
  { label: '밤새 볼 두뇌싸움', query: '반전과 두뇌싸움이 짜릿한 몰입도 높은 웹툰' },
]

const RANDOM_SEARCH_QUERIES = [
  '비 오는 날 편안하게 읽기 좋은 힐링 웹툰',
  '주인공이 압도적으로 강한 사이다 판타지',
  '친구에서 연인이 되는 설레는 로맨스',
  '반전이 많고 두뇌싸움이 치열한 작품',
  '완결되어서 밤새 정주행하기 좋은 웹툰',
  '빌런을 시원하게 참교육하는 복수극',
  '잔잔하지만 여운이 오래 남는 성장물',
  '웃기면서도 캐릭터 관계성이 좋은 웹툰',
  '세계관이 탄탄하고 모험이 흥미진진한 판타지',
  '소꿉친구와 천천히 사랑에 빠지는 이야기',
]

function getSiteHeaderHeight() {
  return document.querySelector('[data-site-header]')?.getBoundingClientRect().height ?? 0
}

export default function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [diceRolling, setDiceRolling] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [top10, setTop10] = useState([])
  const [top10Loading, setTop10Loading] = useState(true)
  const [top10Error, setTop10Error] = useState('')
  const [quickPrompts, setQuickPrompts] = useState(DEFAULT_QUICK_PROMPTS)
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const searchInputRef = useRef(null)
  const top10Ref = useRef(null)
  const sectionTransitionApiRef = useRef(null)
  const sheetDragStateRef = useRef({
    pointerId: null,
    startY: 0,
    startScrollY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    suppressClick: false,
  })
  const focusAiSearchRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setReduceMotion(media.matches)
    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  // 추천 검색어 버튼: 관리자가 편집한 값을 백엔드에서 가져온다. 실패/빈 값이면 기본값 유지.
  useEffect(() => {
    getQuickPrompts()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setQuickPrompts(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchFocused || reduceMotion) return undefined
    const timer = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_QUERIES.length),
      3000,
    )
    return () => clearInterval(timer)
  }, [reduceMotion, searchFocused])

  useEffect(() => {
    let cancelled = false

    searchWebtoons({ page: 0, size: 10, sort: 'views' })
      .then((page) => {
        if (cancelled) return
        setTop10((page?.content ?? []).map(toCardModel))
        setTop10Error('')
      })
      .catch(() => {
        if (cancelled) return
        setTop10([])
        setTop10Error('TOP 10을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setTop10Loading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const page = pageRef.current
    const hero = heroRef.current
    const content = top10Ref.current
    if (!page || !hero || !content) return undefined

    const root = document.documentElement
    const previousOverflowY = root.style.overflowY
    const transition = { active: false, frame: null, targetSection: null }
    let wheelGesture = { direction: 0, distance: 0, lastTime: 0 }
    let returnGestureArmed = false
    let lastWheelDirection = 0
    let lastWheelAt = 0
    let wheelGestureResetTimer = null

    const resetWheelGesture = () => {
      wheelGesture = { direction: 0, distance: 0, lastTime: 0 }
      returnGestureArmed = false
      lastWheelDirection = 0
      lastWheelAt = 0
      if (wheelGestureResetTimer !== null) {
        window.clearTimeout(wheelGestureResetTimer)
        wheelGestureResetTimer = null
      }
    }

    const recordWheelGesture = (deltaY, armReturn = false) => {
      const now = performance.now()
      lastWheelDirection = Math.sign(deltaY)
      lastWheelAt = now
      wheelGesture = advanceSheetWheelGesture(wheelGesture, deltaY, now)
      if (armReturn && wheelGesture.triggered) returnGestureArmed = true

      if (wheelGestureResetTimer !== null) window.clearTimeout(wheelGestureResetTimer)
      wheelGestureResetTimer = window.setTimeout(
        resetWheelGesture,
        SHEET_WHEEL_GESTURE_IDLE_MS,
      )
      return wheelGesture.triggered
    }

    const setScrollLocked = (locked) => {
      root.style.overflowY = locked ? 'hidden' : 'auto'
    }

    const getSectionTops = () => ({
      hero: Math.max(
        0,
        window.scrollY + page.getBoundingClientRect().top - getSiteHeaderHeight(),
      ),
      content: Math.max(
        0,
        window.scrollY + content.getBoundingClientRect().top - getSiteHeaderHeight(),
      ),
    })

    const cancelTransition = () => {
      if (transition.frame !== null) window.cancelAnimationFrame(transition.frame)
      transition.active = false
      transition.frame = null
      transition.targetSection = null
    }

    const finishAt = (section) => {
      const target = getSectionTops()[section]
      window.scrollTo({ top: target, behavior: 'auto' })
      setScrollLocked(section === 'hero')
      cancelTransition()
    }

    const animateToSection = (section) => {
      if (transition.active) {
        if (transition.targetSection === section) return
        cancelTransition()
      }

      setScrollLocked(false)
      const target = getSectionTops()[section]
      const start = window.scrollY
      const distance = target - start

      if (reduceMotion || Math.abs(distance) < 2) {
        finishAt(section)
        return
      }

      transition.active = true
      transition.targetSection = section
      const startedAt = performance.now()
      const duration = 420

      const step = (now) => {
        const elapsed = Math.min(1, (now - startedAt) / duration)
        const eased = 1 - Math.pow(1 - elapsed, 4)
        window.scrollTo({ top: start + distance * eased, behavior: 'auto' })

        if (elapsed < 1) {
          transition.frame = window.requestAnimationFrame(step)
          return
        }
        finishAt(section)
      }

      transition.frame = window.requestAnimationFrame(step)
    }

    const handleWheel = (event) => {
      const { hero: heroTop, content: contentTop } = getSectionTops()
      const current = window.scrollY
      const deltaMultiplier =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      const normalizedDeltaY = event.deltaY * deltaMultiplier

      if (transition.active) {
        event.preventDefault()
        return
      }

      const intent = getSheetWheelIntent({
        current,
        heroTop,
        contentTop,
        deltaY: normalizedDeltaY,
      })

      if (intent.type === 'native') {
        if (current > contentTop + 2 && normalizedDeltaY < 0) {
          recordWheelGesture(normalizedDeltaY, true)
        } else {
          resetWheelGesture()
        }
        return
      }

      event.preventDefault()

      if (intent.type === 'blocked') {
        resetWheelGesture()
        return
      }

      if (intent.type === 'repair') {
        resetWheelGesture()
        animateToSection(intent.destination)
        return
      }

      if (intent.type === 'crossing') {
        window.scrollTo({ top: intent.snapTop, behavior: 'auto' })
        if (returnGestureArmed) {
          resetWheelGesture()
          animateToSection('hero')
          return
        }
        if (intent.deltaY === 0) {
          return
        }
      }

      if (intent.deltaY < 0 && returnGestureArmed) {
        resetWheelGesture()
        animateToSection('hero')
        return
      }

      const triggered = recordWheelGesture(intent.deltaY)
      if (!triggered) return

      resetWheelGesture()
      animateToSection(intent.deltaY > 0 ? 'content' : 'hero')
    }

    const handleScroll = () => {
      if (transition.active || sheetDragStateRef.current.pointerId !== null) return

      const { hero: heroTop, content: contentTop } = getSectionTops()
      const current = window.scrollY
      const now = performance.now()
      const hasRecentWheel = now - lastWheelAt <= SHEET_WHEEL_GESTURE_IDLE_MS
      const inSheetTransitionZone = current > heroTop + 2 && current < contentTop - 2
      const reachedContentTop = current >= contentTop - 2 && current <= contentTop + 2

      if (reachedContentTop && returnGestureArmed && hasRecentWheel && lastWheelDirection < 0) {
        resetWheelGesture()
        animateToSection('hero')
        return
      }

      if (!inSheetTransitionZone) return

      const midpoint = heroTop + (contentTop - heroTop) / 2
      const destination = hasRecentWheel
        ? lastWheelDirection < 0
          ? 'hero'
          : 'content'
        : current < midpoint
          ? 'hero'
          : 'content'
      resetWheelGesture()
      animateToSection(destination)
    }

    window.scrollTo({ top: getSectionTops().hero, behavior: 'auto' })
    setScrollLocked(true)
    sectionTransitionApiRef.current = {
      animateTo: animateToSection,
      cancel: cancelTransition,
      getTops: getSectionTops,
      beginDrag: () => setScrollLocked(false),
      lockAtHero: () => setScrollLocked(true),
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
      resetWheelGesture()
      cancelTransition()
      sectionTransitionApiRef.current = null
      root.style.overflowY = previousOverflowY
    }
  }, [reduceMotion])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setSearchError('보고 싶은 분위기나 이야기를 한 문장으로 입력해주세요.')
      searchInputRef.current?.focus()
      return
    }
    setSearchError('')
    navigate(`/recommend?q=${encodeURIComponent(trimmedQuery)}&mode=ai`)
  }

  // Math.random()은 순수하지 않으므로 렌더 중이 아닌 클릭(이벤트 핸들러) 시점에 고른다.
  function goToTeamPick() {
    if (TEAM_PICK_IDS.length === 0) return
    const id = TEAM_PICK_IDS[Math.floor(Math.random() * TEAM_PICK_IDS.length)]
    navigate(webtoonHref({ id }))
  }

  function focusAiSearch() {
    sectionTransitionApiRef.current?.animateTo('hero')
    window.setTimeout(
      () => searchInputRef.current?.focus({ preventScroll: true }),
      reduceMotion ? 0 : 440,
    )
  }
  focusAiSearchRef.current = focusAiSearch

  // 헤더/햄버거 "AI 추천 검색" → 메인 히어로 검색창으로 포커스
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('focus') !== 'ai') return undefined
    const timer = window.setTimeout(() => {
      focusAiSearchRef.current?.()
      navigate('/', { replace: true })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [location.search, navigate])

  function chooseQuickPrompt(prompt) {
    setQuery(prompt)
    setSearchError('')
    searchInputRef.current?.focus()
  }

  function fillRandomQuery() {
    const candidates = RANDOM_SEARCH_QUERIES.filter((candidate) => candidate !== query)
    const nextQuery = candidates[Math.floor(Math.random() * candidates.length)]
    setQuery(nextQuery)
    setSearchError('')
    setDiceRolling(true)
    window.setTimeout(() => setDiceRolling(false), 350)
    searchInputRef.current?.focus()
  }

  function handleSheetPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    sectionTransitionApiRef.current?.cancel()
    sectionTransitionApiRef.current?.beginDrag()
    const now = performance.now()
    sheetDragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollY: window.scrollY,
      lastY: event.clientY,
      lastTime: now,
      velocity: 0,
      moved: false,
      suppressClick: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleSheetPointerMove(event) {
    const state = sheetDragStateRef.current
    if (state.pointerId !== event.pointerId) return

    const positions = sectionTransitionApiRef.current?.getTops()
    if (!positions) return

    const now = performance.now()
    const elapsed = Math.max(1, now - state.lastTime)
    const pointerDistance = state.startY - event.clientY
    const target = Math.min(
      positions.content,
      Math.max(positions.hero, state.startScrollY + pointerDistance),
    )

    if (Math.abs(pointerDistance) > 5) state.moved = true
    state.velocity = (state.lastY - event.clientY) / elapsed
    state.lastY = event.clientY
    state.lastTime = now
    window.scrollTo({ top: target, behavior: 'auto' })
  }

  function finishSheetDragging(event) {
    const state = sheetDragStateRef.current
    if (state.pointerId !== event.pointerId) return

    state.pointerId = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!state.moved) return

    const positions = sectionTransitionApiRef.current?.getTops()
    if (!positions) return

    const range = Math.max(1, positions.content - positions.hero)
    const progress = Math.min(1, Math.max(0, (window.scrollY - positions.hero) / range))
    const startedExpanded = state.startScrollY > positions.hero + range / 2
    const destination = getSheetSnapDestination({
      startedExpanded,
      progress,
      velocity: state.velocity,
      velocityAge: performance.now() - state.lastTime,
    })

    state.suppressClick = true
    sectionTransitionApiRef.current?.animateTo(destination)
    window.setTimeout(() => {
      sheetDragStateRef.current.suppressClick = false
    }, 0)
  }

  function handleSheetLostPointerCapture(event) {
    if (sheetDragStateRef.current.pointerId !== event.pointerId) return
    finishSheetDragging(event)
  }

  function handleSheetClick(event, destination) {
    if (sheetDragStateRef.current.suppressClick) {
      event.preventDefault()
      return
    }
    sectionTransitionApiRef.current?.animateTo(destination)
  }

  return (
    <div ref={pageRef} className="relative isolate overflow-hidden">
      {/* 화면 전체 너비를 덮는 배경 앰비언트 레이어 (가장자리까지 배경색이 이어지도록 fixed) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-[#dff4e8]/80 blur-3xl sm:h-96 sm:w-96" />
      </div>
      <FloatingQuokkas />
      <section
        ref={heroRef}
        className="relative z-10 flex min-h-[calc(100svh-var(--site-header-height))] scroll-mt-[var(--site-header-height)] flex-col justify-center overflow-hidden px-6 py-10 [@media(max-height:720px)]:py-4 sm:px-8 lg:px-12"
      >

        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/70 px-6 py-8 text-center shadow-[0_22px_70px_rgba(28,26,31,0.08)] backdrop-blur-md sm:px-10 sm:py-10">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-300/60 bg-white/75 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur [@media(max-height:720px)]:mb-2 [@media(max-height:720px)]:py-1">
              <img
                src="/icons/quokka-emoji-sm.png"
                alt=""
                aria-hidden
                className="h-4 w-4 object-contain"
              />{' '}
              AI 자연어 추천
            </p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink-900 [@media(max-height:720px)]:text-2xl sm:text-4xl lg:text-5xl">
              오늘 보고 싶은 느낌을
              <br />
              말해보세요
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 [@media(max-height:720px)]:mt-2 sm:text-base">
              기분·관계·전개를 문장으로 적으면
              <br className="sm:hidden" /> 취향에 어울리는 작품을 찾아드려요.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-lg shadow-ink-900/5 transition [@media(max-height:720px)]:mt-4 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100/70"
            >
              <button
                type="button"
                onClick={fillRandomQuery}
                aria-label="랜덤 검색어 넣기"
                title="랜덤 검색어 넣기"
                className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 ${diceRolling ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>
              <label htmlFor="home-ai-search" className="sr-only">
                보고 싶은 웹툰을 문장으로 입력
              </label>
              <input
                id="home-ai-search"
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (e.target.value.trim()) setSearchError('')
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={`"${PLACEHOLDER_QUERIES[placeholderIndex]}"`}
                aria-invalid={searchError ? 'true' : undefined}
                aria-describedby={searchError ? 'home-ai-search-error' : 'home-ai-search-hint'}
                maxLength={200}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 sm:text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSearchError('')
                    searchInputRef.current?.focus()
                  }}
                  aria-label="검색어 지우기"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-300 transition hover:bg-ink-50 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  <span aria-hidden>✕</span>
                </button>
              )}
              <button
                type="submit"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white shadow-sm transition hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                aria-label="AI 추천 검색"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
              </button>
            </form>

            {searchError && (
              <p id="home-ai-search-error" role="alert" className="mt-2 text-left text-xs font-medium text-brand-600">
                {searchError}
              </p>
            )}

            <div
              className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:720px)]:mt-2 [@media(max-height:600px)]:hidden"
              aria-label="추천 검색어 예시"
            >
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.id ?? prompt.label}
                  type="button"
                  onClick={() => chooseQuickPrompt(prompt.query)}
                  aria-pressed={query === prompt.query}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    query === prompt.query
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-ink-100 bg-white/80 text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <p id="home-ai-search-hint" className="mt-4 text-xs text-ink-400 [@media(max-height:720px)]:mt-2 [@media(max-height:600px)]:hidden">
              무엇을 검색할지 모르겠다면 검색창의 주사위를 눌러보세요.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => handleSheetClick(event, 'content')}
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={finishSheetDragging}
          onPointerCancel={finishSheetDragging}
          onLostPointerCapture={handleSheetLostPointerCapture}
          onDragStart={(event) => event.preventDefault()}
          aria-controls="home-top10"
          aria-label="인기 작품 둘러보기. 아래로 스크롤하거나 위로 드래그하거나 클릭하세요."
          title="아래로 스크롤하거나 위로 드래그하거나 클릭해서 인기 작품 둘러보기"
          className="group absolute bottom-3 left-1/2 flex -translate-x-1/2 touch-none cursor-grab select-none flex-col items-center gap-1 rounded-2xl border border-white/70 bg-white/85 px-4 py-2 whitespace-nowrap text-xs font-semibold text-ink-500 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-brand-600 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:bottom-4"
        >
          <span
            aria-hidden="true"
            className="h-1 w-10 rounded-full bg-ink-300/75 transition group-hover:bg-brand-300"
          />
          <span className="flex items-center gap-1">
            인기 작품 둘러보기
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 15 6-6 6 6" />
            </svg>
          </span>
        </button>
      </section>

      <div
        id="home-top10"
        ref={top10Ref}
        className="relative z-10 min-h-[calc(100svh-var(--site-header-height))] scroll-mt-[var(--site-header-height)] rounded-t-[2rem] border-t border-white/80 bg-ink-50 shadow-[0_-18px_55px_rgba(28,26,31,0.12)] sm:rounded-t-[2.5rem]"
      >
        <div className="flex justify-center px-4 pb-1 pt-3">
          <button
            type="button"
            onClick={(event) => handleSheetClick(event, 'hero')}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={finishSheetDragging}
            onPointerCancel={finishSheetDragging}
            onLostPointerCapture={handleSheetLostPointerCapture}
            onDragStart={(event) => event.preventDefault()}
            aria-label="검색 화면으로 내리기. 위로 스크롤하거나 아래로 드래그하거나 클릭하세요."
            title="위로 스크롤하거나 아래로 드래그하거나 클릭해서 검색으로 돌아가기"
            className="group flex touch-none cursor-grab select-none flex-col items-center gap-1 rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-ink-500 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-brand-600 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span aria-hidden="true" className="h-1 w-10 rounded-full bg-ink-300/75 transition group-hover:bg-brand-300" />
            <span className="flex items-center gap-1">
              검색 화면으로 돌아가기
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>
        </div>

        <section
          className="mx-auto w-full max-w-6xl px-6 pb-8 pt-5 sm:px-8 lg:px-12"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-ink-900">
              🔥 TOP 10
            </h2>
            <span className="rounded-full border border-ink-100 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
              리뷰·조회 기준
            </span>
          </div>
          {top10Loading && (
            <div
              className="flex gap-4 overflow-hidden px-1 pb-2"
              aria-label="TOP 10을 불러오는 중"
              aria-busy="true"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="w-40 shrink-0 animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-ink-100" />
                  <div className="mt-2 h-4 w-28 rounded bg-ink-100" />
                  <div className="mt-1 h-3 w-12 rounded bg-ink-100" />
                </div>
              ))}
            </div>
          )}
          {!top10Loading && top10Error && (
            <p className="rounded-xl border border-ink-100 bg-white px-4 py-8 text-center text-sm text-ink-500">
              {top10Error}
            </p>
          )}
          {!top10Loading && !top10Error && (
            <HorizontalWebtoonSlider
              items={top10}
              ariaLabel="TOP 10 웹툰 목록"
              ranked
              previousLabel="이전 순위 보기"
              nextLabel="다음 순위 보기"
            />
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8 sm:px-8 lg:px-12">
          <h2 className="mb-2 text-lg font-bold text-ink-900">쿼카툰 이렇게 즐겨보세요</h2>
          <FeaturePromoCarousel onStartAi={focusAiSearch} onOpenTeamPick={goToTeamPick} />
        </section>
      </div>
    </div>
  )
}
