import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SearchDropdown from './SearchDropdown'
import HamburgerMenu from './HamburgerMenu'
import { levelLabel, nicknameLevelClass } from '../../lib/level'
import ProfileAvatar from '../common/ProfileAvatar'
import { useExperienceLogs } from '../../hooks/useExperienceLogs'
import ExperienceLogList from '../level/ExperienceLogList'

export default function Header() {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const [open, setOpen] = useState(null) // 'search' | 'menu' | null
  const location = useLocation()
  const rootRef = useRef(null)
  const searchButtonRef = useRef(null)
  const menuButtonRef = useRef(null)
  const recentExperience = useExperienceLogs(3, isLoggedIn ? user?.userId : null)

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
      <div className="relative mx-auto flex h-[var(--site-header-height)] w-full max-w-300 items-center justify-between px-3 sm:px-6">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          className="flex items-center"
          aria-label="쿼카툰 홈"
        >
          <img src="/quokkatoon_logo.png" alt="쿼카툰" className="h-14 w-auto object-contain" />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-semibold text-ink-700 md:flex">
          <Link to="/webtoons" className="transition hover:text-brand-500">
            웹툰
          </Link>
          <Link to="/?focus=ai" className="transition hover:text-brand-500">
            AI 추천 검색
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isLoggedIn && (
            <div className="group relative min-w-0">
              <Link
                to="/mypage/favorites#experience-log"
                title={`${levelLabel(user)} · ${user.nickname}`}
                aria-describedby="header-experience-preview"
                className="flex max-w-30 min-w-0 cursor-pointer items-center gap-1 rounded-full border border-ink-100 px-2 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:border-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 sm:max-w-44 sm:px-3 sm:text-xs"
              >
                <ProfileAvatar
                  src={user.profileImageUrl}
                  alt=""
                  sizeClass="h-5 w-5"
                  emojiClass="text-[10px]"
                />
                <span className="shrink-0">{levelLabel(user)} ·</span>
                <span className={`min-w-0 truncate ${nicknameLevelClass(user.level)}`}>
                  {user.nickname}
                </span>
              </Link>

              <div
                id="header-experience-preview"
                role="tooltip"
                className="pointer-events-none invisible absolute right-0 top-full z-50 mt-2 w-64 translate-y-1 rounded-2xl border border-ink-100 bg-white p-3 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-ink-900">최근 EXP</p>
                  <span className="text-[10px] text-ink-300">클릭하면 전체 보기</span>
                </div>
                <ExperienceLogList {...recentExperience} compact />
              </div>
            </div>
          )}

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
