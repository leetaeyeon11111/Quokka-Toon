import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURE_PROMOS } from '../../data/featurePromos'
import { useAuth } from '../../hooks/useAuth'

const LAST_PROMO_SLIDE_KEY = 'quokkatoon:last-promo-slide'
const CAROUSEL_COPY_COUNT = 3

export default function ContinuousFeaturePromoCarousel({ onStartAi, onOpenTeamPick }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const slides = useMemo(() => FEATURE_PROMOS.filter((slide) => slide.enabled), [])
  const [index, setIndex] = useState(() => {
    const savedSlideId = window.sessionStorage.getItem(LAST_PROMO_SLIDE_KEY)
    const savedIndex = slides.findIndex((slide) => slide.id === savedSlideId)
    return savedIndex >= 0 ? savedIndex : 0
  })
  const [activeRenderIndex, setActiveRenderIndex] = useState(() => slides.length + index)
  const [paused, setPaused] = useState(false)
  const [userControlled, setUserControlled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef(null)
  const activeRenderIndexRef = useRef(activeRenderIndex)
  const scrollEndTimer = useRef(null)
  const dragState = useRef({ pointerId: null, startX: 0, startScrollLeft: 0, moved: false })

  const renderedSlides = useMemo(
    () =>
      Array.from({ length: CAROUSEL_COPY_COUNT }, (_, copyIndex) =>
        slides.map((slide, slideIndex) => ({
          key: `${copyIndex}-${slide.id}`,
          slide,
          slideIndex,
          renderIndex: copyIndex * slides.length + slideIndex,
        })),
      ).flat(),
    [slides],
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setReducedMotion(media.matches)
    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const track = trackRef.current
      const card = track?.querySelector(`[data-render-index="${activeRenderIndexRef.current}"]`)
      if (!track || !card) return
      track.scrollTo({
        left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2,
        behavior: 'auto',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [renderedSlides.length])

  useEffect(() => {
    if (paused || userControlled || reducedMotion || slides.length < 2) return undefined
    const timer = window.setTimeout(() => {
      const track = trackRef.current
      const targetIndex = activeRenderIndexRef.current + 1
      const card = track?.querySelector(`[data-render-index="${targetIndex}"]`)
      if (!track || !card) return
      track.scrollTo({
        left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2,
        behavior: 'smooth',
      })
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [index, paused, userControlled, reducedMotion, slides.length])

  useEffect(() => {
    window.sessionStorage.setItem(LAST_PROMO_SLIDE_KEY, slides[index].id)
  }, [index, slides])

  useEffect(
    () => () => {
      if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current)
    },
    [],
  )

  function normalizeIndex(renderIndex) {
    return ((renderIndex % slides.length) + slides.length) % slides.length
  }

  function setActiveSlide(renderIndex) {
    activeRenderIndexRef.current = renderIndex
    setActiveRenderIndex(renderIndex)
    setIndex(normalizeIndex(renderIndex))
  }

  function findNearestRenderIndex() {
    const track = trackRef.current
    if (!track) return activeRenderIndexRef.current

    const trackCenter = track.scrollLeft + track.clientWidth / 2
    let nearestIndex = activeRenderIndexRef.current
    let nearestDistance = Number.POSITIVE_INFINITY

    track.querySelectorAll('[data-render-index]').forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(cardCenter - trackCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = Number(card.dataset.renderIndex)
      }
    })

    return nearestIndex
  }

  function scrollToRenderIndex(renderIndex, behavior = 'smooth') {
    const track = trackRef.current
    const card = track?.querySelector(`[data-render-index="${renderIndex}"]`)
    if (!track || !card) return

    track.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2,
      behavior,
    })
  }

  function recenterRepeatedSlides(renderIndex) {
    const track = trackRef.current
    if (!track || slides.length < 2) return

    let targetIndex = renderIndex
    if (renderIndex < slides.length) targetIndex = renderIndex + slides.length
    if (renderIndex >= slides.length * 2) targetIndex = renderIndex - slides.length
    if (targetIndex === renderIndex) return

    const currentCard = track.querySelector(`[data-render-index="${renderIndex}"]`)
    const targetCard = track.querySelector(`[data-render-index="${targetIndex}"]`)
    if (!currentCard || !targetCard) return

    track.scrollLeft += targetCard.offsetLeft - currentCard.offsetLeft
    setActiveSlide(targetIndex)
  }

  function handleTrackScroll() {
    const nearestIndex = findNearestRenderIndex()
    if (nearestIndex !== activeRenderIndexRef.current) setActiveSlide(nearestIndex)

    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = window.setTimeout(() => {
      recenterRepeatedSlides(findNearestRenderIndex())
    }, 140)
  }

  function move(direction) {
    setUserControlled(true)
    scrollToRenderIndex(activeRenderIndexRef.current + direction)
  }

  function openSlide(slide) {
    if (slide.action === 'focus-search') {
      onStartAi?.()
      return
    }
    if (slide.action === 'random-team-pick') {
      onOpenTeamPick?.()
      return
    }
    if (slide.requiresAuth && !isLoggedIn) {
      navigate('/login')
      return
    }
    if (slide.href) navigate(slide.href)
  }

  function handleSlideClick(slide, renderIndex) {
    // 가운데가 아닌 사진을 눌러도 먼저 가운데로 옮긴 뒤,
    // 어떤 사진이든 클릭하면 해당 기능 경로로 바로 이동한다.
    if (renderIndex !== activeRenderIndexRef.current) {
      setUserControlled(true)
      scrollToRenderIndex(renderIndex)
    }
    openSlide(slide)
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: trackRef.current?.scrollLeft ?? 0,
      moved: false,
    }
    setPaused(true)
    setUserControlled(true)
    // 포인터 캡처는 실제 드래그가 시작될 때만 잡는다.
    // pointerdown에서 캡처하면 단순 클릭의 click 이벤트가 트랙으로 리타겟팅되어
    // 카드의 onClick(이동)이 호출되지 않는다.
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    if (!track || dragState.current.pointerId !== event.pointerId) return

    const distance = event.clientX - dragState.current.startX
    if (Math.abs(distance) > 8 && !dragState.current.moved) {
      dragState.current.moved = true
      setIsDragging(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* 캡처 불가 환경 무시 */
      }
    }
    track.scrollLeft = dragState.current.startScrollLeft - distance
  }

  function finishDragging(event) {
    if (dragState.current.pointerId !== event.pointerId) return
    const wasDrag = dragState.current.moved
    dragState.current.pointerId = null
    setIsDragging(false)
    setPaused(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (wasDrag) {
      // 실제로 끌었으면 끝난 위치에서 가장 가까운 카드를 중앙에 스냅한다.
      const nearestIndex = findNearestRenderIndex()
      setActiveSlide(nearestIndex)
      scrollToRenderIndex(nearestIndex, reducedMotion ? 'auto' : 'smooth')
    } else if (event.type === 'pointerup') {
      // 단순 탭이면 손을 뗀 지점의 카드를 찾아 해당 기능으로 이동한다.
      // click 이벤트는 포인터 캡처 등으로 카드에 도달하지 않을 수 있어
      // 항상 발생하는 pointerup 에서 직접 처리한다. (pointercancel 은 제외)
      const tapped = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest('[data-render-index]')
      if (tapped) {
        const renderIndex = Number(tapped.dataset.renderIndex)
        handleSlideClick(slides[normalizeIndex(renderIndex)], renderIndex)
      }
    }

    window.setTimeout(() => {
      dragState.current.moved = false
    }, 250)
  }

  if (slides.length === 0) return null

  return (
    <div
      className="w-full"
      aria-roledescription="carousel"
      aria-label="쿼카툰 기능 소개"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative w-full overflow-hidden">
        <div
          ref={trackRef}
          className={`flex w-full overflow-x-auto py-4 [scrollbar-width:none] [touch-action:pan-y] [&::-webkit-scrollbar]:hidden ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          onScroll={handleTrackScroll}
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
          {renderedSlides.map(({ key, slide, slideIndex, renderIndex }) => {
            const isCurrent = renderIndex === activeRenderIndex

            return (
              <article
                key={key}
                data-render-index={renderIndex}
                role={isCurrent ? 'button' : undefined}
                tabIndex={isCurrent ? 0 : -1}
                aria-hidden={!isCurrent}
                aria-label={`${slideIndex + 1} / ${slides.length}: ${slide.eyebrow}`}
                onKeyDown={(event) => {
                  if (!isCurrent || (event.key !== 'Enter' && event.key !== ' ')) return
                  event.preventDefault()
                  openSlide(slide)
                }}
                className="relative mr-4 aspect-video w-[78%] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lg sm:w-[72%] sm:rounded-3xl"
              >
                <img
                  src={slide.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable="false"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/5" />

                <div className="relative z-10 flex h-full w-[68%] flex-col items-start justify-center px-4 py-3 text-left sm:w-[60%] sm:px-8 lg:px-12">
                  <p className="mb-1 text-[10px] font-bold tracking-wide text-brand-600 sm:mb-2 sm:text-xs">
                    {slide.eyebrow}
                  </p>
                  <h3 className="whitespace-pre-line text-base font-extrabold leading-tight text-ink-900 sm:text-2xl lg:text-3xl">
                    {slide.title}
                  </h3>
                  <p className="mt-2 hidden text-sm text-ink-500 sm:block">{slide.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-ink-700 sm:mt-5 sm:text-xs">
                    {slide.cta} <span aria-hidden>→</span>
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="이전 소개 보기"
          onClick={() => move(-1)}
          className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/70 text-ink-700 shadow-sm backdrop-blur-md transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:left-4 sm:h-11 sm:w-11"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="다음 소개 보기"
          onClick={() => move(1)}
          className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/70 text-ink-700 shadow-sm backdrop-blur-md transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:right-4 sm:h-11 sm:w-11"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        className="mx-auto mt-1 flex w-fit items-center justify-center gap-0.5 rounded-full bg-white/80 px-1.5 py-1 shadow-sm ring-1 ring-ink-100"
        aria-label="기능 슬라이드 선택"
      >
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`${slideIndex + 1}번째 기능 보기`}
            aria-current={slideIndex === index ? 'true' : undefined}
            onClick={() => {
              setUserControlled(true)
              scrollToRenderIndex(slides.length + slideIndex)
            }}
            className="group flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span
              aria-hidden="true"
              className={`h-2 rounded-full transition-all duration-300 ${
                slideIndex === index
                  ? 'w-5 bg-ink-700'
                  : 'w-2 bg-ink-300 group-hover:bg-ink-500'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {slides[index].eyebrow}: {slides[index].title.replace('\n', ' ')}
      </p>
    </div>
  )
}
