import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import LevelGuideModal from './LevelGuideModal'

export default function ProfileCard() {
  const { user } = useAuth()
  const [showGuide, setShowGuide] = useState(false)

  if (!user) return null

  return (
    <div className="w-full shrink-0 rounded-2xl border border-ink-100 bg-white p-5 sm:w-56">
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-ink-50 text-3xl">
        🐿
      </div>
      <p className="text-center text-base font-bold text-ink-900">{user.nickname}</p>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="mx-auto mt-1 block text-center text-sm font-semibold text-brand-500 hover:underline"
      >
        Lv.{user.level}
      </button>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${user.exp}%` }} />
      </div>
      <p className="mt-1 text-center text-xs text-ink-500">경험치 {user.exp}%</p>

      {showGuide && <LevelGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}
