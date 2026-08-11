import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const STEP_MESSAGES = [
  '이메일이랑 비밀번호 입력해줄래?',
  '나이랑 성별도 알려줄래?',
  '이제 닉네임만 정해줘!',
]

function StepDots({ step }) {
  return (
    <div className="mb-2 flex gap-1.5">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-2 w-2 rounded-full ${n <= step ? 'bg-ink-900' : 'bg-ink-100'}`} />
      ))}
    </div>
  )
}

function SocialButtons({ onSocialLogin }) {
  return (
    <div className="mt-6">
      <div className="relative mb-4 text-center text-xs text-ink-300">
        <span className="relative z-10 bg-white px-3">간편 시작</span>
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink-100" />
      </div>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => onSocialLogin('카카오')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fee500] font-bold text-ink-900"
        >
          카
        </button>
        <button
          type="button"
          onClick={() => onSocialLogin('네이버')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03c75a] font-bold text-white"
        >
          N
        </button>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [birth, setBirth] = useState('')
  const [gender, setGender] = useState('')

  const [nickname, setNickname] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)

  function handleSocialLogin(provider) {
    login({ nickname: `${provider}유저` })
    navigate('/')
  }

  function goNextFromStep1(e) {
    e.preventDefault()
    if (!email.trim() || !password || password !== passwordConfirm) return
    setStep(2)
  }

  function goNextFromStep2(e) {
    e.preventDefault()
    if (!birth.trim() || !gender) return
    setStep(3)
  }

  function goNextFromStep3(e) {
    e.preventDefault()
    if (!nickname.trim()) return
    const age = birth.length >= 4 ? new Date().getFullYear() - Number(birth.slice(0, 4)) : undefined
    login({ nickname, email, gender, age })
    setStep(4)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-14">
      {step < 4 ? (
        <div className="flex gap-5">
          <div className="hidden shrink-0 sm:block">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-ink-100 bg-brand-50 text-4xl">
              🐿
            </div>
            <p className="mt-2 max-w-28 text-center text-xs text-ink-500">"{STEP_MESSAGES[step - 1]}"</p>
          </div>

          <div className="flex-1">
            <StepDots step={step} />
            <p className="mb-4 text-xs font-semibold text-ink-300">STEP {step} / 4</p>

            {step === 1 && (
              <>
                <h1 className="mb-4 text-lg font-bold text-ink-900">계정 정보</h1>
                <form onSubmit={goNextFromStep1} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailChecked(false)
                      }}
                      placeholder="이메일"
                      className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                    />
                    <button
                      type="button"
                      onClick={() => email.trim() && setEmailChecked(true)}
                      className="shrink-0 rounded-full border border-ink-100 px-4 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      중복 확인
                    </button>
                  </div>
                  {emailChecked && <p className="text-xs text-mint-500">사용 가능한 이메일이에요.</p>}

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                  />
                  <input
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 확인"
                    className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                  />
                  {password && passwordConfirm && password !== passwordConfirm && (
                    <p className="text-xs text-red-500">비밀번호가 일치하지 않아요.</p>
                  )}

                  <button
                    type="submit"
                    className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
                  >
                    다음 →
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="mb-4 text-lg font-bold text-ink-900">나이 · 성별</h1>
                <form onSubmit={goNextFromStep2} className="flex flex-col gap-3">
                  <input
                    type="date"
                    required
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                  />
                  <div className="flex gap-2">
                    {['남', '여'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 rounded-full border py-3 text-sm font-semibold transition ${
                          gender === g
                            ? 'border-ink-900 bg-ink-900 text-white'
                            : 'border-ink-100 text-ink-500 hover:bg-ink-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
                  >
                    다음 →
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="mb-4 text-lg font-bold text-ink-900">닉네임</h1>
                <form onSubmit={goNextFromStep3} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      required
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value)
                        setNicknameChecked(false)
                      }}
                      placeholder="닉네임"
                      className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                    />
                    <button
                      type="button"
                      onClick={() => nickname.trim() && setNicknameChecked(true)}
                      className="shrink-0 rounded-full border border-ink-100 px-4 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      중복 확인
                    </button>
                  </div>
                  {nicknameChecked && <p className="text-xs text-mint-500">사용 가능한 닉네임이에요.</p>}

                  <button
                    type="submit"
                    className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
                  >
                    다음 →
                  </button>
                </form>
              </>
            )}

            <SocialButtons onSocialLogin={handleSocialLogin} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-2xl border border-ink-100 bg-brand-50 text-4xl">
            🐿🎉
          </div>
          <h1 className="mb-2 text-2xl font-bold text-ink-900">{nickname}님, 환영해요 🎉</h1>
          <p className="mb-6 text-sm text-ink-500">
            가입이 완료됐어요! 이제 취향에 맞는 웹툰을 추천받아 보세요.
          </p>
          <Link
            to="/login"
            className="rounded-full bg-ink-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            로그인 하러가기 →
          </Link>
        </div>
      )}
    </div>
  )
}
