import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '../api/auth'
import { goKakaoAuthorize, goNaverAuthorize } from '../api/social'
import ProfileIconPicker from '../components/common/ProfileIconPicker'
import { DEFAULT_PROFILE_ICON } from '../data/profileIcons'

const STEP_MESSAGES = [
  '이메일이랑 비밀번호 입력해줄래?',
  '나이랑 성별도 알려줄래?',
  '이제 닉네임만 정해줘!',
]

const GENDER_MAP = { 남: 'M', 여: 'F' }

// 이메일 형식 검증 (중복 확인 전 평문 입력 차단)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 생년월일 드롭다운용 연/월 목록
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i)
const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

function StepDots({ step }) {
  return (
    <div className="mb-2 flex gap-1.5">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-2 w-2 rounded-full ${n <= step ? 'bg-ink-900' : 'bg-ink-100'}`} />
      ))}
    </div>
  )
}

function SocialButtons() {
  return (
    <div className="mt-6">
      <div className="relative mb-4 text-center text-xs text-ink-300">
        <span className="relative z-10 bg-white px-3">간편 시작</span>
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink-100" />
      </div>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={goKakaoAuthorize}
          aria-label="카카오로 시작하기"
          className="h-12 w-12 overflow-hidden rounded-full transition hover:opacity-90"
        >
          <img src="/kakao_login.png" alt="카카오 로그인" className="h-full w-full object-cover" />
        </button>
        <button
          type="button"
          onClick={goNaverAuthorize}
          aria-label="네이버로 시작하기"
          className="h-12 w-12 overflow-hidden rounded-full transition hover:opacity-90"
        >
          <img src="/naver_login.png" alt="네이버 로그인" className="h-full w-full object-cover" />
        </button>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle') // idle | checking | available | taken
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const daysInBirthMonth =
    birthYear && birthMonth ? new Date(Number(birthYear), Number(birthMonth), 0).getDate() : 31
  const birthDays = Array.from({ length: daysInBirthMonth }, (_, i) => i + 1)
  const birth =
    birthYear && birthMonth && birthDay && Number(birthDay) <= daysInBirthMonth
      ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : ''
  const [gender, setGender] = useState('')

  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState('idle')
  const [profileIcon, setProfileIcon] = useState(DEFAULT_PROFILE_ICON)

  const passwordTooShort = password.length > 0 && password.length < 8

  async function handleCheckEmail() {
    const value = email.trim()
    if (!value) return
    if (!EMAIL_REGEX.test(value)) {
      setEmailStatus('invalid')
      return
    }
    setEmailStatus('checking')
    try {
      const { available } = await authApi.checkEmail(value)
      setEmailStatus(available ? 'available' : 'taken')
    } catch (err) {
      setEmailStatus('idle')
      setError(err.message ?? '중복 확인에 실패했어요.')
    }
  }

  async function handleCheckNickname() {
    if (!nickname.trim()) return
    setNicknameStatus('checking')
    try {
      const { available } = await authApi.checkNickname(nickname.trim())
      setNicknameStatus(available ? 'available' : 'taken')
    } catch (err) {
      setNicknameStatus('idle')
      setError(err.message ?? '중복 확인에 실패했어요.')
    }
  }

  function goNextFromStep1(e) {
    e.preventDefault()
    setError('')
    if (emailStatus !== 'available') {
      setError('이메일 중복 확인을 해주세요.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 해요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }
    setStep(2)
  }

  function goNextFromStep2(e) {
    e.preventDefault()
    setError('')
    if (!birth.trim()) {
      setError('생년월일을 모두 선택해주세요.')
      return
    }
    if (!gender) {
      setError('성별을 선택해주세요.')
      return
    }
    setStep(3)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (nicknameStatus !== 'available') {
      setError('닉네임 중복 확인을 해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await authApi.signup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        profileImageUrl: profileIcon,
        gender: GENDER_MAP[gender] ?? 'NONE',
        birthDate: birth, // date input 값은 이미 'YYYY-MM-DD'
      })
      setStep(4)
    } catch (err) {
      setError(err.message ?? '회원가입에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-14">
      {step < 4 ? (
        <div className="flex gap-5">
          <div className="hidden shrink-0 sm:block">
            <div className="flex h-28 w-28 items-center justify-center">
              <img
                src="/quokka_wave.png"
                alt="쿼카 마스코트"
                className="h-full w-full object-contain"
              />
            </div>
            {/* 마스코트가 건네는 말풍선 (위쪽 꼬리로 쿼카를 가리킴) */}
            <div className="relative mt-3 max-w-28 rounded-2xl border border-ink-100 bg-white px-3 py-2 text-center text-xs leading-relaxed text-ink-600 shadow-sm">
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-ink-100 bg-white" />
              {STEP_MESSAGES[step - 1]}
            </div>
          </div>

          <div className="flex-1">
            <StepDots step={step} />
            <p className="mb-4 text-xs font-semibold text-ink-300">STEP {step} / 4</p>

            {/* 스텝 콘텐츠 영역: 최소 높이를 고정해 STEP 전환 시 위치가 흔들리지 않게 함 */}
            <div className="min-h-[18rem]">
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
                        setEmailStatus('idle')
                      }}
                      placeholder="이메일"
                      className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                    />
                    <button
                      type="button"
                      onClick={handleCheckEmail}
                      disabled={emailStatus === 'checking'}
                      className="shrink-0 rounded-full border border-ink-100 px-4 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                    >
                      {emailStatus === 'checking' ? '확인 중' : '중복 확인'}
                    </button>
                  </div>
                  {emailStatus === 'available' && <p className="text-xs text-mint-500">사용 가능한 이메일이에요.</p>}
                  {emailStatus === 'taken' && <p className="text-xs text-red-500">이미 사용 중인 이메일이에요.</p>}
                  {emailStatus === 'invalid' && <p className="text-xs text-red-500">올바른 이메일 형식이 아니에요.</p>}

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (8자 이상)"
                    className="rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                  />
                  {passwordTooShort && <p className="text-xs text-red-500">비밀번호는 8자 이상이어야 해요.</p>}
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
                  {error && <p className="text-xs text-red-500">{error}</p>}

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
                  <div className="flex gap-2">
                    <select
                      required
                      aria-label="출생 연도"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="flex-1 min-w-0 rounded-full border border-ink-100 bg-ink-50 px-3 py-3 text-sm outline-none focus:border-brand-300"
                    >
                      <option value="">년</option>
                      {BIRTH_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}년
                        </option>
                      ))}
                    </select>
                    <select
                      required
                      aria-label="출생 월"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="flex-1 min-w-0 rounded-full border border-ink-100 bg-ink-50 px-3 py-3 text-sm outline-none focus:border-brand-300"
                    >
                      <option value="">월</option>
                      {BIRTH_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}월
                        </option>
                      ))}
                    </select>
                    <select
                      required
                      aria-label="출생 일"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="flex-1 min-w-0 rounded-full border border-ink-100 bg-ink-50 px-3 py-3 text-sm outline-none focus:border-brand-300"
                    >
                      <option value="">일</option>
                      {birthDays.map((d) => (
                        <option key={d} value={d}>
                          {d}일
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {['남', '여'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={gender === g}
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
                  {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
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
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      required
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value.slice(0, 6))
                        setNicknameStatus('idle')
                      }}
                      placeholder="닉네임 (최대 6글자)"
                      maxLength={6}
                      className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
                    />
                    <button
                      type="button"
                      onClick={handleCheckNickname}
                      disabled={nicknameStatus === 'checking'}
                      className="shrink-0 rounded-full border border-ink-100 px-4 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                    >
                      {nicknameStatus === 'checking' ? '확인 중' : '중복 확인'}
                    </button>
                  </div>
                  {nicknameStatus === 'available' && <p className="text-xs text-mint-500">사용 가능한 닉네임이에요.</p>}
                  {nicknameStatus === 'taken' && <p className="text-xs text-red-500">이미 사용 중인 닉네임이에요.</p>}

                  <div className="mt-1">
                    <p className="mb-2 text-xs font-semibold text-ink-500">프로필 아이콘</p>
                    <ProfileIconPicker value={profileIcon} onChange={setProfileIcon} />
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50"
                  >
                    {submitting ? '가입 중…' : '가입 완료'}
                  </button>
                </form>
              </>
            )}
            </div>

            <SocialButtons />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 h-28 w-28 overflow-hidden rounded-2xl border border-ink-100 bg-brand-50">
            <img src={profileIcon} alt="선택한 프로필 아이콘" className="h-full w-full object-cover" />
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
