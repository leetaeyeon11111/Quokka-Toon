import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn, user } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!id.trim() || !password) return
    login({ nickname: id.split('@')[0] || '닉네임' })
    setJustLoggedIn(true)
  }

  function handleSocial(provider) {
    login({ nickname: `${provider}유저` })
    setJustLoggedIn(true)
  }

  const showSuccess = justLoggedIn || isLoggedIn

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-14">
      {!showSuccess ? (
        <>
          <p className="mb-6 text-center text-lg font-extrabold text-ink-900">🐿 쿼카툰</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디 / 이메일"
              className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
            />
            <button
              type="submit"
              className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
            >
              로그인
            </button>
          </form>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleSocial('카카오')}
              className="flex-1 rounded-full bg-[#fee500] py-3 text-sm font-semibold text-ink-900"
            >
              카카오
            </button>
            <button
              type="button"
              onClick={() => handleSocial('네이버')}
              className="flex-1 rounded-full bg-[#03c75a] py-3 text-sm font-semibold text-white"
            >
              네이버
            </button>
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
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-2xl border border-ink-100 bg-brand-50 text-4xl">
            🐿👋
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
