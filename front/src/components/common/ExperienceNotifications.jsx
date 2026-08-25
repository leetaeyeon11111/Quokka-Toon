import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ExperienceNotificationContext } from '../../context/experience-notification-context'

function kstDateKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export default function ExperienceNotificationProvider({ children }) {
  const { user, refresh } = useAuth()
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const addToast = useCallback((message, kind = 'exp') => {
    const id = ++nextId.current
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500)
  }, [])

  const notifyExperience = useCallback((change) => {
    if (!change) return
    if (change.awardedExp > 0) addToast(`+${change.awardedExp} EXP`)
    if (change.levelUp) addToast(`레벨 업! Lv.${change.currentLevel}`, 'level')
    if (change.dailyCapReached && user?.userId) {
      const key = `quakatoon:exp-cap:${user.userId}:${kstDateKey()}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'shown')
        addToast('오늘의 EXP 한도 20을 달성했어요.', 'cap')
      }
    }
    refresh().catch(() => {})
  }, [addToast, refresh, user])

  const value = useMemo(() => ({ notifyExperience }), [notifyExperience])

  return (
    <ExperienceNotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-5 top-20 z-50 flex flex-col items-end gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-lg ${
              toast.kind === 'level'
                ? 'bg-gradient-to-r from-brand-500 to-amber-500 text-base'
                : toast.kind === 'cap' ? 'bg-ink-900' : 'bg-mint-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ExperienceNotificationContext.Provider>
  )
}
