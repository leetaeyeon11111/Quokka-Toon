import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LevelGuideModal from './LevelGuideModal'
import { levelLabel, nicknameLevelClass } from '../../lib/level'
import { useExperienceLogs } from '../../hooks/useExperienceLogs'
import ExperienceLogList from '../level/ExperienceLogList'

export default function ProfileCard() {
  const { user } = useAuth()
  const location = useLocation()
  const [showGuide, setShowGuide] = useState(false)
  const experienceLogs = useExperienceLogs(10, user?.userId)

  useEffect(() => {
    if (location.hash !== '#experience-log') return
    window.requestAnimationFrame(() => {
      document.getElementById('experience-log')?.scrollIntoView({ block: 'center' })
    })
  }, [location.hash])

  if (!user) return null

  return (
    <div className="w-full shrink-0 rounded-2xl border border-ink-100 bg-white p-5 sm:w-56">
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-ink-50 text-3xl">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="프로필" className="h-full w-full object-cover" />
        ) : (
          '🐿'
        )}
      </div>
      <p className={`text-center text-base font-bold ${nicknameLevelClass(user.level)}`}>{user.nickname}</p>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="mx-auto mt-1 block text-center text-sm font-semibold text-brand-500 hover:underline"
      >
        {levelLabel(user)}
      </button>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-label={`${levelLabel(user)} 진행률`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={user.progressPercent ?? 0}
      >
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${user.progressPercent ?? 0}%` }} />
      </div>
      <p className="mt-1 text-center text-xs text-ink-500">
        {user.maxLevel
          ? `${user.exp} EXP · MAX`
          : user.expIntoLevel != null && user.expNeededForNextLevel != null
            ? `${user.expIntoLevel}/${user.expNeededForNextLevel} EXP`
            : '레벨 진행 정보를 불러오는 중…'}
      </p>
      <p className="mt-1 text-center text-xs font-semibold text-brand-600">
        오늘 EXP {user.todayExp ?? 0}/{user.dailyExpCap ?? 20}
      </p>

      <section id="experience-log" className="mt-4 scroll-mt-24 border-t border-ink-100 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-ink-900">경험치 적립 내역</h2>
          <span className="text-[10px] text-ink-300">최근 10개</span>
        </div>
        <div className="max-h-64 overflow-y-auto pr-1">
          <ExperienceLogList {...experienceLogs} compact />
        </div>
      </section>

      {showGuide && <LevelGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}
