import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as authApi from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { goKakaoAuthorize, goNaverAuthorize } from '../api/social'
import { useDialog } from '../hooks/useDialog'
import { emitBanned, saveBanStatus } from '../lib/ban'

const BAN_OK_RETURN = ['/inquiry', '/banned']

function isBanOkReturn(path) {
  return BAN_OK_RETURN.some((p) => path === p || path.startsWith(`${p}/`))
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggedIn, user, loading: authLoading } = useAuth()
  const { alert: showAlert } = useDialog()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const [bannedSession, setBannedSession] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const returnTo = searchParams.get('returnTo')
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : ''

  async function routeAfterAuth() {
    let ban = null
    try {
      ban = await authApi.getBanStatus()
    } catch {
      ban = null
    }
    if (ban?.banned) {
      saveBanStatus(ban)
      emitBanned(ban)
      setBannedSession(true)
      if (safeReturnTo && isBanOkReturn(safeReturnTo)) {
        navigate(safeReturnTo, { replace: true })
      } else {
        navigate('/banned', { replace: true, state: { ban } })
      }
      return true
    }
    return false
  }

  // 이미 로그인된 정지 계정이 /login 에 들어오면 문의·정지 안내로 보낸다.
  useEffect(() => {
    if (authLoading || !isLoggedIn || justLoggedIn) return undefined
    let cancelled = false
    routeAfterAuth().then((wasBanned) => {
      if (cancelled || wasBanned) return
      if (safeReturnTo) navigate(safeReturnTo, { replace: true })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/session only
  }, [authLoading, isLoggedIn])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      const wasBanned = await routeAfterAuth()
      if (wasBanned) return
      if (safeReturnTo) {
        navigate(safeReturnTo, { replace: true })
      } else {
        setJustLoggedIn(true)
      }
    } catch (err) {
      if (err?.code === 'USER_BANNED') {
        emitBanned(err.data ?? { banned: true })
        navigate('/banned', { replace: true, state: { ban: err.data ?? { banned: true } } })
        return
      }
      setError(err.message ?? '로그인에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSocialLogin(authorize) {
    try {
      authorize()
    } catch (err) {
      showAlert({
        title: '로그인 설정이 필요해요',
        message: err.message ?? '소셜 로그인을 시작하지 못했어요.',
      })
    }
  }

  const showSuccess = !bannedSession && (justLoggedIn || isLoggedIn)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-14">
      {!showSuccess ? (
        <>
          <img
            src="/quokkatoon_logo.png"
            alt="쿼카툰"
            className="mx-auto mb-6 h-auto w-56 object-contain"
          />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              aria-invalid={Boolean(error && !email.trim())}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                aria-invalid={Boolean(error && !password)}
                className="w-full rounded-full border border-ink-100 bg-ink-50 px-4 py-3 pr-16 text-sm outline-none focus:border-brand-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-500 hover:text-ink-900"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50"
            >
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3 text-xs text-ink-300">
              <span className="h-px flex-1 bg-ink-100" aria-hidden />
              <span>간편 로그인</span>
              <span className="h-px flex-1 bg-ink-100" aria-hidden />
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin(goKakaoAuthorize)}
                aria-label="카카오로 로그인"
                className="h-12 w-12 overflow-hidden rounded-full transition hover:opacity-90"
              >
                <img src="/kakao_login.png" alt="카카오 로그인" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin(goNaverAuthorize)}
                aria-label="네이버로 로그인"
                className="h-12 w-12 overflow-hidden rounded-full transition hover:opacity-90"
              >
                <img src="/naver_login.png" alt="네이버 로그인" className="h-full w-full object-cover" />
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            아직 회원이 아니세요?{' '}
            <Link to="/signup" className="font-semibold text-brand-500 hover:underline">
              회원가입
            </Link>
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-28 w-28 items-center justify-center">
            <img
              src="/quokka_hand.png"
              alt="쿼카 마스코트"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-ink-900">로그인 완료!</h1>
          <p className="mb-6 text-sm text-ink-500">
            {user?.nickname}님, 다시 오신 걸 환영해요.
            <br />
            오늘의 맞춤 추천이 기다리고 있어요.
          </p>
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
            >
              웹툰 추천 받으러 가기 →
            </button>
            <button
              type="button"
              onClick={() => navigate('/mypage/taste')}
              className="rounded-full border border-ink-100 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
            >
              내 인생작 고르기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
