import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SearchDropdown from './SearchDropdown'
import HamburgerMenu from './HamburgerMenu'
import { levelLabel, nicknameLevelClass } from '../../lib/level'

export default function Header() {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const [open, setOpen] = useState(null) // 'search' | 'menu' | null
  const location = useLocation()
  const rootRef = useRef(null)
  const searchButtonRef = useRef(null)
  const menuButtonRef = useRef(null)

  function closePanel(panel = open, restoreFocus = true) {
    setOpen(null)
    if (!restoreFocus) return
    window.requestAnimationFrame(() => {
      if (panel === 'search') searchButtonRef.current?.focus()
      if (panel === 'menu') menuButtonRef.current?.focus()
    })
  }

  // 경로가 바뀌면 열려있던 드롭다운을 닫는다 (렌더 중 상태 조정 패턴).
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setOpen(null)
  }

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      const panel = open
      setOpen(null)
      window.requestAnimationFrame(() => {
        if (panel === 'search') searchButtonRef.current?.focus()
        if (panel === 'menu') menuButtonRef.current?.focus()
      })
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <header
      ref={rootRef}
      data-site-header
      className="sticky top-0 z-30 border-b border-ink-100 bg-white"
    >
      <div className="relative mx-auto flex h-[var(--site-header-height)] w-full max-w-300 items-center justify-between px-6">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          className="flex items-center"
          aria-label="쿼카툰 홈"
        >
          <img src="/quokka_logo.png" alt="쿼카툰" className="h-9 w-auto object-contain" />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-semibold text-ink-700 md:flex">
          <Link to="/webtoons" className="transition hover:text-brand-500">
            웹툰
          </Link>
          <Link to="/board" className="transition hover:text-brand-500">
            게시판
          </Link>
          {isAdmin && (
            <Link to="/admin" className="transition hover:text-brand-500">
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            ref={searchButtonRef}
            type="button"
            aria-label="검색"
            aria-expanded={open === 'search'}
            aria-controls="header-search-panel"
            onClick={() => setOpen((o) => (o === 'search' ? null : 'search'))}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 text-ink-700 transition hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
              open === 'search' ? 'bg-ink-50' : ''
            }`}
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

          {isLoggedIn && (
            <Link
              to="/mypage/favorites"
              title={`${levelLabel(user)} · ${user.nickname}`}
              className="hidden max-w-52 min-w-0 items-center gap-1 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 lg:flex"
            >
              <span className="shrink-0">{levelLabel(user)} ·</span>
              <span className={`min-w-0 truncate ${nicknameLevelClass(user.level)}`}>
                {user.nickname}
              </span>
            </Link>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="메뉴"
            aria-expanded={open === 'menu'}
            aria-controls="header-menu-panel"
            onClick={() => setOpen((o) => (o === 'menu' ? null : 'menu'))}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 text-ink-700 transition hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
              open === 'menu' ? 'bg-ink-50' : ''
            }`}
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
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>

          {open === 'menu' && <HamburgerMenu onClose={() => closePanel('menu')} />}
        </div>

        {open === 'search' && <SearchDropdown onClose={() => closePanel('search')} />}
      </div>
    </header>
  )
}
