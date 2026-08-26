import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { getToken } from '../../api/client'
import { BAN_EVENT, emitBanned, loadBanStatus, saveBanStatus } from '../../lib/ban'

/** 정지 중에도 이용 가능한 경로 (문의하기·재로그인 포함) */
const BAN_ALLOWED_PATHS = ['/banned', '/inquiry', '/login', '/signup', '/oauth']

function isBanAllowedPath(pathname) {
  return BAN_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * 벤 + 로그인 세션이면 /banned 로 안내한다.
 * 토큰은 유지해 문의 조회·등록이 가능하고, /inquiry·/login 은 막지 않는다.
 * (로그아웃 상태의 벤 캐시만으로 /login 을 막으면 문의용 재로그인이 불가능해진다.)
 */
export default function BanGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const handlingRef = useRef(false)

  useEffect(() => {
    function goBanned(ban) {
      if (handlingRef.current) return
      // 세션 없으면 정지 페이지만 보여주고, 로그인 플로우는 열어 둔다.
      if (!getToken()) {
        if (ban) saveBanStatus(ban)
        return
      }
      if (isBanAllowedPath(location.pathname)) {
        if (ban) saveBanStatus(ban)
        return
      }
      handlingRef.current = true
      const payload = ban ?? { banned: true }
      saveBanStatus(payload)
      navigate('/banned', { replace: true, state: { ban: payload } })
      window.setTimeout(() => {
        handlingRef.current = false
      }, 0)
    }

    function onBanned(event) {
      goBanned(event?.detail)
    }

    window.addEventListener(BAN_EVENT, onBanned)

    const cached = loadBanStatus()
    if (cached?.banned && getToken() && !isBanAllowedPath(location.pathname)) {
      goBanned(cached)
    }

    return () => window.removeEventListener(BAN_EVENT, onBanned)
  }, [location.pathname, navigate])

  useEffect(() => {
    if (isBanAllowedPath(location.pathname)) return undefined
    if (!getToken()) return undefined

    let cancelled = false
    authApi
      .getBanStatus()
      .then((status) => {
        if (cancelled || !status?.banned) return
        emitBanned(status)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return null
}
