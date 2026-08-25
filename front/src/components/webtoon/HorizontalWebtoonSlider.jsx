import { useEffect, useRef, useState } from 'react'
import WebtoonCard from './WebtoonCard'

const CARD_STEP = 176 // 160px card + 16px gap

export default function HorizontalWebtoonSlider({
  items,
  ariaLabel = '웹툰 목록',
  ranked = false,
  previousLabel = '이전 작품 보기',
  nextLabel = '다음 작품 보기',
}) {
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

  function scrollItems(direction) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    trackRef.current?.scrollBy({
      left: direction * CARD_STEP * 2,
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
        aria-label={ariaLabel}
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
          <div key={webtoon.id} className="mr-4 shrink-0 last:mr-0">
            <WebtoonCard webtoon={webtoon} rank={ranked ? index + 1 : undefined} />
          </div>
        ))}
      </div>

      {scrollControls.left && (
        <button
          type="button"
          onClick={() => scrollItems(-1)}
          aria-label={previousLabel}
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
          onClick={() => scrollItems(1)}
          aria-label={nextLabel}
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
