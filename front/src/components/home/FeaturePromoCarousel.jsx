import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURE_PROMOS } from '../../data/featurePromos'
import { useAuth } from '../../hooks/useAuth'

const LAST_PROMO_SLIDE_KEY = 'quokkatoon:last-promo-slide'

function positionClass(position) {
  const shared =
    'absolute left-[calc(var(--slide-left)+var(--drag-offset,0px))] top-1/2 aspect-video w-[78%] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lg transition-[left,translate,scale,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:w-[72%] sm:rounded-3xl'

  if (position === 'current') {
    return `${shared} [--slide-left:50%] z-20 -translate-x-1/2 -translate-y-1/2 scale-100 opacity-100`
  }
  if (position === 'previous') {
    return `${shared} [--slide-left:14%] z-10 -translate-x-full -translate-y-1/2 scale-[0.94] opacity-70 ring-1 ring-inset ring-ink-300/60 sm:[--slide-left:16%]`
  }
  if (position === 'next') {
    return `${shared} [--slide-left:86%] z-10 -translate-y-1/2 scale-[0.94] opacity-70 ring-1 ring-inset ring-ink-300/60 sm:[--slide-left:84%]`
  }
  return `${shared} pointer-events-none [--slide-left:50%] z-0 -translate-x-1/2 -translate-y-1/2 scale-90 opacity-0`
}

export default function FeaturePromoCarousel({ onStartAi, onOpenTeamPick }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const slides = useMemo(() => FEATURE_PROMOS.filter((slide) => slide.enabled), [])
  const [index, setIndex] = useState(() => {
    const savedSlideId = window.sessionStorage.getItem(LAST_PROMO_SLIDE_KEY)
    const savedIndex = slides.findIndex((slide) => slide.id === savedSlideId)
    return savedIndex >= 0 ? savedIndex : 0
  })
  const [paused, setPaused] = useState(false)
  const [userControlled, setUserControlled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const pointerStartX = useRef(null)
  const dragStartIndex = useRef(index)
  const dragOffsetRef = useRef(0)
  const wasDragged = useRef(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setReducedMotion(media.matches)
    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (paused || userControlled || reducedMotion || slides.length < 2) return undefined
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [paused, userControlled, reducedMotion, slides.length])

  useEffect(() => {
    window.sessionStorage.setItem(LAST_PROMO_SLIDE_KEY, slides[index].id)
  }, [index, slides])

  function move(direction) {
    setUserControlled(true)
    setIndex((current) => (current + direction + slides.length) % slides.length)
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

  function slidePosition(slideIndex) {
    if (slideIndex === index) return 'current'
    if (slideIndex === (index - 1 + slides.length) % slides.length) return 'previous'
    if (slideIndex === (index + 1) % slides.length) return 'next'
    return 'hidden'
  }

  function handlePointerDown(event) {
    if (event.target.closest('button')) return
    pointerStartX.current = event.clientX
    dragStartIndex.current = index
    dragOffsetRef.current = 0
    wasDragged.current = false
    setIsDragging(true)
    setPaused(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    if (pointerStartX.current === null) return

    const totalDistance = event.clientX - pointerStartX.current
    const slideStep = event.currentTarget.clientWidth * (window.innerWidth >= 640 ? 0.34 : 0.36)
    const movedSlides =
      totalDistance < 0
        ? Math.floor(-totalDistance / slideStep)
        : -Math.floor(totalDistance / slideStep)
    const nextOffset = totalDistance + movedSlides * slideStep
    const nextIndex =
      ((dragStartIndex.current + movedSlides) % slides.length + slides.length) % slides.length

    setIndex(nextIndex)
    dragOffsetRef.current = nextOffset

    if (Math.abs(totalDistance) > 12) {
      wasDragged.current = true
      setUserControlled(true)
    }
    setDragOffset(nextOffset)
  }

  function handlePointerEnd(event) {
    if (pointerStartX.current === null) return
    const slideStep = event.currentTarget.clientWidth * (window.innerWidth >= 640 ? 0.34 : 0.36)
    const settleThreshold = Math.min(slideStep / 2, 80)
    const remainingOffset = dragOffsetRef.current
    pointerStartX.current = null
    dragOffsetRef.current = 0
    setIsDragging(false)
    setDragOffset(0)
    setPaused(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (Math.abs(remainingOffset) >= settleThreshold) {
      move(remainingOffset < 0 ? 1 : -1)
    }
  }

  function handleSlideClick(slide, position) {
    if (wasDragged.current) {
      wasDragged.current = false
      return
    }
    if (position === 'previous') {
      move(-1)
      return
    }
    if (position === 'next') {
      move(1)
      return
    }
    if (position === 'current') openSlide(slide)
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
      <div
        className="relative aspect-[2/1] w-full cursor-grab select-none overflow-hidden [touch-action:pan-y] active:cursor-grabbing sm:aspect-[20/9]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={(event) => {
          pointerStartX.current = null
          dragOffsetRef.current = 0
          wasDragged.current = false
          setIsDragging(false)
          setDragOffset(0)
          setPaused(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
      >
        {slides.map((slide, slideIndex) => {
          const position = slidePosition(slideIndex)
          const isCurrent = position === 'current'

          return (
            <article
              key={slide.id}
              role={isCurrent ? 'button' : undefined}
              tabIndex={isCurrent ? 0 : -1}
              className={`${positionClass(position)} ${position !== 'hidden' ? 'cursor-pointer' : ''} ${isDragging && position !== 'hidden' ? '!transition-none' : ''}`}
              style={{ '--drag-offset': position === 'hidden' ? '0px' : `${dragOffset}px` }}
              aria-hidden={!isCurrent}
              aria-label={`${slideIndex + 1} / ${slides.length}: ${slide.eyebrow}`}
              onClick={() => handleSlideClick(slide, position)}
              onKeyDown={(event) => {
                if (!isCurrent || (event.key !== 'Enter' && event.key !== ' ')) return
                event.preventDefault()
                openSlide(slide)
              }}
            >
              <img
                src={slide.image}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isDragging ? '!transition-none' : ''} ${
                  position === 'previous'
                    ? 'origin-left scale-[1.7]'
                    : position === 'next'
                      ? 'origin-right scale-[1.7]'
                      : 'scale-100'
                }`}
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/5" />
              {!isCurrent && <div className="absolute inset-0 bg-white/10" />}

              {isCurrent && (
                <div className="relative z-10 flex h-full w-[68%] flex-col items-start justify-center px-4 py-3 text-left sm:w-[60%] sm:px-8 lg:px-12">
                  <p className="mb-1 text-[10px] font-bold tracking-wide text-brand-600 sm:mb-2 sm:text-xs">
                    {slide.eyebrow}
                  </p>
                  <h2 className="whitespace-pre-line text-base font-extrabold leading-tight text-ink-900 sm:text-2xl lg:text-3xl">
                    {slide.title}
                  </h2>
                  <p className="mt-2 hidden text-sm text-ink-500 sm:block">{slide.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-ink-700 sm:mt-5 sm:text-xs">
                    {slide.cta} <span aria-hidden>→</span>
                  </p>
                </div>
              )}
            </article>
          )
        })}

        <button
          type="button"
          aria-label="이전 기능"
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
          aria-label="다음 기능"
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
        className="mx-auto mt-4 flex w-fit items-center justify-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm ring-1 ring-ink-100"
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
              setIndex(slideIndex)
            }}
            className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              slideIndex === index ? 'w-7 bg-ink-700' : 'w-2.5 bg-ink-300 hover:bg-ink-500'
            }`}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {slides[index].eyebrow}: {slides[index].title.replace('\n', ' ')}
      </p>
    </div>
  )
}
