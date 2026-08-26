import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { kakaoLogin, naverLogin } from '../api/social'
import { emitBanned, saveBanStatus } from '../lib/ban'

// provider: 'kakao' | 'naver'
export default function OAuthCallback({ provider }) {
  const navigate = useNavigate()
  const { loginWithAccessToken } = useAuth()
  const [error, setError] = useState('')
  const ran = useRef(false) // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function run() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const err = params.get('error')
      if (err || !code) {
        setError('로그인이 취소되었거나 인증 코드가 없어요.')
        return
      }

      try {
        let token
        if (provider === 'naver') {
          const state = params.get('state')
          const saved = sessionStorage.getItem('naver_oauth_state')
          if (saved && state && saved !== state) {
            setError('보안 확인(state)에 실패했어요. 다시 시도해주세요.')
            return
          }
          token = await naverLogin(code, state)
        } else {
          token = await kakaoLogin(code)
        }
        await loginWithAccessToken(token.accessToken)

        let ban = null
        try {
          ban = await authApi.getBanStatus()
        } catch {
          ban = null
        }
        if (ban?.banned) {
          saveBanStatus(ban)
          emitBanned(ban)
          navigate('/banned', { replace: true, state: { ban } })
          return
        }
        navigate('/', { replace: true })
      } catch (e) {
        if (e?.code === 'USER_BANNED') {
          emitBanned(e.data ?? { banned: true })
          navigate('/banned', { replace: true, state: { ban: e.data ?? { banned: true } } })
          return
        }
        setError(e.message ?? '소셜 로그인에 실패했어요.')
      }
    }

    run()
  }, [provider, loginWithAccessToken, navigate])

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {error ? (
        <>
          <span className="mb-3 text-4xl" aria-hidden>😢</span>
          <p className="mb-4 text-sm text-red-500">{error}</p>
          <Link
            to="/login"
            className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <>
          <img
            src="/icons/quokka-emoji.png"
            alt=""
            aria-hidden
            className="mb-3 h-14 w-14 animate-pulse object-contain"
          />
          <p className="text-sm text-ink-500">로그인 처리 중…</p>
        </>
      )}
    </div>
  )
}
