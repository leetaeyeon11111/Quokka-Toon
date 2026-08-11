import { Link, useLocation } from 'react-router-dom'
import ProfileCard from './ProfileCard'

const TABS = [
  { to: '/mypage/favorites', label: '즐겨찾기' },
  { to: '/mypage/taste', label: '취향 리포트' },
  { to: '/mypage/posts', label: '내가 쓴 글' },
]

export default function MyPageShell({ children }) {
  const location = useLocation()

  return (
    <div className="flex flex-col gap-6 px-6 py-10 sm:flex-row">
      <ProfileCard />

      <div className="min-w-0 flex-1">
        <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-full border border-ink-100 bg-white text-sm font-semibold">
          {TABS.map((tab) => {
            const active = location.pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-2 py-3 text-center transition ${
                  active ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {children}
      </div>
    </div>
  )
}
