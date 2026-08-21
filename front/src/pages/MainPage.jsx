import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useNavigationType } from 'react-router-dom'
import { WEBTOONS } from '../data/webtoons'
import { TEAM_PICK_IDS } from '../data/teamPicks'
import { getSheetSnapDestination } from '../lib/homeSheet'
import WebtoonCard from '../components/webtoon/WebtoonCard'
import FeaturePromoCarousel from '../components/home/ContinuousFeaturePromoCarousel'

const PLACEHOLDER_QUERIES = [
  '비 오는 날 읽기 좋은 힐링 만화…',
  '소꿉친구랑 꽁냥꽁냥 대는 로맨스…',
  '빌런을 참교육하는 사이다 복수극…',
  '두뇌싸움이 짜릿한 다크 판타지…',
]

const TEAM_PICKS = TEAM_PICK_IDS.map((id) => WEBTOONS.find((webtoon) => webtoon.id === id)).filter(
  Boolean,
)

const QUICK_PROMPTS = [
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

const HOME_SCROLL_POSITION_KEY = 'quokkatoon:home-scroll-position'
const AI_SEARCH_FOCUS_EVENT = 'quokkatoon:focus-ai-search'

function getSiteHeaderHeight() {
  return document.querySelector('[data-site-header]')?.getBoundingClientRect().height ?? 0
}

function Top10Slider({ items }) {
  const cardWidth = 176 // 160px card + 16px gap
  const trackRef = useRef(null)
  const dragState = useRef({ pointerId: null, startX: 0, startScrollLeft: 0, moved: false })
  const [isDragging, setIsDragging] = useState(false)
  const [scrollControls, setScrollControls] = useState({ left: false, right: true })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const updateScrollControls = () => {
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
      const edgeThreshold = 8
      setScrollControls({
        left: track.scrollLeft > edgeThreshold,
        right: track.scrollLeft < maxScrollLeft - edgeThreshold,
      })
    }

    const frame = window.requestAnimationFrame(updateScrollControls)
    track.addEventListener('scroll', updateScrollControls, { passive: true })
    window.addEventListener('resize', updateScrollControls)

    return () => {
      window.cancelAnimationFrame(frame)
      track.removeEventListener('scroll', updateScrollControls)
      window.removeEventListener('resize', updateScrollControls)
    }
  }, [items.length])

  function scrollRankings(direction) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    trackRef.current?.scrollBy({
      left: direction * cardWidth * 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: trackRef.current?.scrollLeft ?? 0,
      moved: false,
    }
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    if (!track || dragState.current.pointerId !== event.pointerId) return

    const distance = event.clientX - dragState.current.startX
    if (Math.abs(distance) > 8) dragState.current.moved = true
    track.scrollLeft = dragState.current.startScrollLeft - distance
  }

  function finishDragging(event) {
    if (dragState.current.pointerId !== event.pointerId) return
    dragState.current.pointerId = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    window.setTimeout(() => {
      dragState.current.moved = false
    }, 0)
  }

  return (
    <div className="group relative w-full">
      <div
        ref={trackRef}
        aria-label="TOP 10 웹툰 목록"
        className={`flex w-full overflow-x-auto px-1 pb-2 [scrollbar-width:none] [touch-action:pan-y] [&::-webkit-scrollbar]:hidden ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!dragState.current.moved) return
          event.preventDefault()
          event.stopPropagation()
          dragState.current.moved = false
        }}
      >
        {items.map((webtoon, index) => (
          <div key={webtoon.id} className="mr-4 shrink-0">
            <WebtoonCard webtoon={webtoon} rank={index + 1} />
          </div>
        ))}
      </div>

      {scrollControls.left && (
        <button
          type="button"
          onClick={() => scrollRankings(-1)}
          aria-label="이전 순위 보기"
          className="absolute -left-4 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100/80 bg-white/90 text-ink-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:-left-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      {scrollControls.right && (
        <button
          type="button"
          onClick={() => scrollRankings(1)}
          aria-label="다음 순위 보기"
          className="absolute -right-4 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100/80 bg-white/90 text-ink-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:-right-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function MainPage() {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [query, setQuery] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [diceRolling, setDiceRolling] = useState(false)
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const searchInputRef = useRef(null)
  const top10Ref = useRef(null)
  const sectionTransitionApiRef = useRef(null)
  const searchFocusTimerRef = useRef(null)
  const sheetDragActiveRef = useRef(false)
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

  useLayoutEffect(() => {
    const storedPosition = window.sessionStorage.getItem(HOME_SCROLL_POSITION_KEY)
    const savedPosition = Number(storedPosition)
    const shouldRestore =
      navigationType === 'POP' && storedPosition !== null && Number.isFinite(savedPosition)
    window.scrollTo({ top: shouldRestore ? savedPosition : 0, behavior: 'auto' })
  }, [navigationType])

  useEffect(() => {
    const timer = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_QUERIES.length),
      3000,
    )
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const page = pageRef.current
    const hero = heroRef.current
    if (!page || !hero) return undefined

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame = null

    const updateScrollMotion = () => {
      animationFrame = null

      const pageTop = page.getBoundingClientRect().top + window.scrollY
      const heroHeight = Math.max(1, window.innerHeight - getSiteHeaderHeight())
      const rawProgress = (window.scrollY - pageTop) / (heroHeight * 0.72)
      const progress = Math.min(1, Math.max(0, rawProgress))
      const reduceMotion = reduceMotionQuery.matches

      window.sessionStorage.setItem(HOME_SCROLL_POSITION_KEY, String(window.scrollY))

      page.style.setProperty('--hero-scale', reduceMotion ? '1' : String(1 - progress * 0.045))
      page.style.setProperty('--hero-shift', reduceMotion ? '0px' : `${progress * -22}px`)
      page.style.setProperty('--hero-opacity', reduceMotion ? '1' : String(1 - progress * 0.58))
      page.style.setProperty('--ambient-shift', reduceMotion ? '0px' : `${progress * -34}px`)
      page.style.setProperty('--ambient-reverse-shift', reduceMotion ? '0px' : `${progress * 19}px`)
      page.style.setProperty('--content-opacity', reduceMotion ? '1' : String(0.45 + progress * 0.55))
      page.style.setProperty('--content-shift', reduceMotion ? '0px' : `${(1 - progress) * 18}px`)

      const heroCovered = progress >= 0.98
      if (hero.inert !== heroCovered) {
        hero.inert = heroCovered
        hero.toggleAttribute('aria-hidden', heroCovered)
        hero.style.pointerEvents = heroCovered ? 'none' : ''
      }
    }

    const requestMotionUpdate = () => {
      if (animationFrame !== null) return
      animationFrame = window.requestAnimationFrame(updateScrollMotion)
    }

    updateScrollMotion()
    window.addEventListener('scroll', requestMotionUpdate, { passive: true })
    window.addEventListener('resize', requestMotionUpdate)
    reduceMotionQuery.addEventListener('change', requestMotionUpdate)

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', requestMotionUpdate)
      window.removeEventListener('resize', requestMotionUpdate)
      reduceMotionQuery.removeEventListener('change', requestMotionUpdate)
    }
  }, [])

  useEffect(() => {
    const page = pageRef.current
    const hero = heroRef.current
    const content = top10Ref.current
    if (!page || !hero || !content) return undefined

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const transition = { active: false, direction: 0, frame: null, targetSection: null }
    const scrollState = { lastY: window.scrollY, direction: 0, settleTimer: null }

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

    const clearSettleTimer = () => {
      if (scrollState.settleTimer) window.clearTimeout(scrollState.settleTimer)
      scrollState.settleTimer = null
    }

    const cancelTransition = () => {
      if (transition.frame !== null) window.cancelAnimationFrame(transition.frame)
      transition.active = false
      transition.direction = 0
      transition.frame = null
      transition.targetSection = null
    }

    const animateToSection = (section) => {
      if (transition.active) {
        if (transition.targetSection === section) return
        cancelTransition()
      }

      const target = getSectionTops()[section]
      const start = window.scrollY
      const distance = target - start
      const reduceMotion = reduceMotionQuery.matches

      clearSettleTimer()
      if (reduceMotion || Math.abs(distance) < 2) {
        window.scrollTo({ top: target, behavior: 'auto' })
        return
      }

      transition.active = true
      transition.direction = Math.sign(distance)
      transition.targetSection = section
      const startedAt = performance.now()
      const duration = 390

      const step = (now) => {
        const elapsed = Math.min(1, (now - startedAt) / duration)
        const eased = 1 - Math.pow(1 - elapsed, 4)

        window.scrollTo({ top: start + distance * eased, behavior: 'auto' })

        if (elapsed < 1) {
          transition.frame = window.requestAnimationFrame(step)
          return
        }

        window.scrollTo({ top: target, behavior: 'auto' })
        cancelTransition()
        scrollState.lastY = target
      }

      transition.frame = window.requestAnimationFrame(step)
    }

    const settleBetweenSections = () => {
      scrollState.settleTimer = null
      if (transition.active) return

      const tops = getSectionTops()
      const range = tops.content - tops.hero
      if (range <= 0) return

      const progress = (window.scrollY - tops.hero) / range
      if (progress <= 0 || progress >= 1) return

      let destination
      if (scrollState.direction > 0) destination = progress >= 0.22 ? 'content' : 'hero'
      else if (scrollState.direction < 0) destination = progress <= 0.78 ? 'hero' : 'content'
      else destination = progress >= 0.5 ? 'content' : 'hero'

      animateToSection(destination)
    }

    const scheduleBoundarySettle = () => {
      if (sheetDragActiveRef.current) {
        clearSettleTimer()
        return
      }

      const tops = getSectionTops()
      const current = window.scrollY
      const isBetweenSections = current > tops.hero + 1 && current < tops.content - 1

      if (!isBetweenSections || transition.active) {
        clearSettleTimer()
        return
      }

      clearSettleTimer()
      scrollState.settleTimer = window.setTimeout(settleBetweenSections, 120)
    }

    const handleScroll = () => {
      const current = window.scrollY
      if (!transition.active && Math.abs(current - scrollState.lastY) > 0.5) {
        scrollState.direction = Math.sign(current - scrollState.lastY)
      }
      scrollState.lastY = current
      scheduleBoundarySettle()
    }

    const handleWheel = (event) => {
      if (!transition.active || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const inputDirection = Math.sign(event.deltaY)
      if (inputDirection !== 0 && inputDirection !== transition.direction) {
        cancelTransition()
        scrollState.direction = inputDirection
        return
      }

      event.preventDefault()
    }

    const handleFocusAiRequest = () => {
      const waitForHero = hero.inert
      animateToSection('hero')
      if (searchFocusTimerRef.current) window.clearTimeout(searchFocusTimerRef.current)
      searchFocusTimerRef.current = window.setTimeout(
        () => {
          searchInputRef.current?.focus({ preventScroll: true })
          searchFocusTimerRef.current = null
        },
        waitForHero && !reduceMotionQuery.matches ? 420 : 0,
      )
    }

    sectionTransitionApiRef.current = {
      animateTo: animateToSection,
      cancel: cancelTransition,
      getTops: getSectionTops,
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener(AI_SEARCH_FOCUS_EVENT, handleFocusAiRequest)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener(AI_SEARCH_FOCUS_EVENT, handleFocusAiRequest)
      clearSettleTimer()
      cancelTransition()
      sectionTransitionApiRef.current = null
      if (searchFocusTimerRef.current) window.clearTimeout(searchFocusTimerRef.current)
    }
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
  function goToTeamPick() {
    if (TEAM_PICKS.length === 0) return
    const featured = TEAM_PICKS[Math.floor(Math.random() * TEAM_PICKS.length)]
    navigate(`/webtoons/${featured.id}`)
  }

  function focusAiSearch() {
    window.dispatchEvent(new Event(AI_SEARCH_FOCUS_EVENT))
  }

  function chooseQuickPrompt(prompt) {
    setQuery(prompt)
    searchInputRef.current?.focus()
  }

  function fillRandomQuery() {
    const candidates = RANDOM_SEARCH_QUERIES.filter((candidate) => candidate !== query)
    const nextQuery = candidates[Math.floor(Math.random() * candidates.length)]
    setQuery(nextQuery)
    setDiceRolling(true)
    window.setTimeout(() => setDiceRolling(false), 350)
    searchInputRef.current?.focus()
  }

  function handleSheetPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    sectionTransitionApiRef.current?.cancel()
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
    sheetDragActiveRef.current = true
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
    sheetDragActiveRef.current = false
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
    <div
      ref={pageRef}
      className="relative [--ambient-reverse-shift:0px] [--ambient-shift:0px] [--content-opacity:0.45] [--content-shift:18px] [--hero-opacity:1] [--hero-scale:1] [--hero-shift:0px]"
    >
      <section
        ref={heroRef}
        className="sticky top-[var(--site-header-height)] isolate flex h-[calc(100svh-var(--site-header-height))] flex-col justify-center overflow-hidden px-6 py-10 [@media(max-height:720px)]:py-4 sm:px-8 lg:px-12"
      >
        <div
          className="absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl"
          style={{ transform: 'translate3d(0, var(--ambient-shift), 0)' }}
        />
        <div
          className="absolute -right-20 bottom-6 -z-10 h-80 w-80 rounded-full bg-[#dff4e8]/80 blur-3xl"
          style={{ transform: 'translate3d(0, var(--ambient-reverse-shift), 0)' }}
        />

        <div
          className="mx-auto w-full max-w-3xl text-center"
          style={{
            opacity: 'var(--hero-opacity)',
            transform: 'translate3d(0, var(--hero-shift), 0) scale(var(--hero-scale))',
          }}
        >
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-300/60 bg-white/75 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur [@media(max-height:720px)]:mb-2 [@media(max-height:720px)]:py-1">
              <span aria-hidden>✨</span> AI 자연어 추천
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`"${PLACEHOLDER_QUERIES[placeholderIndex]}"`}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 sm:text-base"
              />
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

            <div
              className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:720px)]:mt-2 [@media(max-height:600px)]:hidden"
              aria-label="추천 검색어 예시"
            >
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => chooseQuickPrompt(prompt.query)}
                  className="rounded-full border border-ink-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-ink-400 [@media(max-height:720px)]:mt-2 [@media(max-height:600px)]:hidden">
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
          aria-label="인기 작품 둘러보기. 위로 드래그하거나 클릭하세요."
          title="위로 드래그하거나 클릭해서 인기 작품 둘러보기"
          className="group absolute bottom-3 left-1/2 flex -translate-x-1/2 touch-none cursor-grab select-none flex-col items-center gap-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-2 whitespace-nowrap text-xs font-semibold text-ink-500 shadow-sm backdrop-blur-md transition hover:bg-white/90 hover:text-brand-600 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:bottom-4"
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
        className="relative z-20 min-h-[calc(100svh-var(--site-header-height))] scroll-mt-[var(--site-header-height)] rounded-t-[2rem] border-t border-white/80 bg-ink-50 shadow-[0_-18px_55px_rgba(28,26,31,0.12)] sm:rounded-t-[2.5rem]"
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
            aria-label="검색 화면으로 내리기. 아래로 드래그하거나 클릭하세요."
            title="아래로 드래그하거나 클릭해서 검색으로 돌아가기"
            className="group flex touch-none cursor-grab select-none flex-col items-center gap-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold text-ink-500 shadow-sm backdrop-blur-md transition hover:bg-white/90 hover:text-brand-600 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
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
          className="px-6 pb-8 pt-5 sm:px-8 lg:px-12"
          style={{
            opacity: 'var(--content-opacity)',
            transform: 'translate3d(0, var(--content-shift), 0)',
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-ink-900">
              🔥 TOP 10
            </h2>
            <span className="rounded-full border border-ink-100 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
              조회수 기준
            </span>
          </div>
          <Top10Slider items={top10} />
        </section>

        <section className="px-6 pb-16 pt-8 sm:px-8 lg:px-12">
          <h2 className="mb-2 text-lg font-bold text-ink-900">쿼카툰 이렇게 즐겨보세요</h2>
          <FeaturePromoCarousel onStartAi={focusAiSearch} onOpenTeamPick={goToTeamPick} />
        </section>
      </div>
    </div>
  )
}
