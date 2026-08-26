import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { clearBanStatus, formatBanExpiry, loadBanStatus } from '../lib/ban'
import { loginHref } from '../lib/navigation'

export default function BannedPage() {
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const ban = location.state?.ban ?? loadBanStatus() ?? {}
  const reason = ban.reason?.trim() || '운영 정책 위반'
  const duration = ban.durationLabel || null
  const expiryLabel = formatBanExpiry(ban.expiresAt)
  const inquiryTo = isLoggedIn ? '/inquiry' : loginHref('/inquiry')

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <img
        src="/icons/quokka-ban.png"
        alt=""
        className="mb-6 h-44 w-44 object-contain sm:h-52 sm:w-52"
      />
      <p className="mb-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">계정 이용 정지</p>
      <h1 className="text-2xl font-extrabold text-ink-900">지금은 서비스를 이용할 수 없어요</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        운영 정책 위반으로 계정이 정지되었어요.
        <br />
        정지 기간에는 게시·댓글·추천 등 일반 이용이 제한됩니다.
        <br />
        다만 <span className="font-semibold text-ink-700">로그인 후 문의하기</span>는 이용할 수 있어요.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-sm">
        <p className="mb-1 text-xs font-semibold text-ink-400">정지 사유</p>
        <p className="whitespace-pre-wrap break-words text-sm font-semibold text-ink-900">{reason}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-ink-400">정지 기간</p>
            <p className="text-sm font-semibold text-ink-800">{duration ?? (ban.expiresAt ? '기간제' : '영구')}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-ink-400">이용 재개 예정</p>
            <p className="text-sm font-semibold text-ink-800">{expiryLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          to={inquiryTo}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          {isLoggedIn ? '문의하기' : '로그인 후 문의하기'}
        </Link>
        <Link
          to="/"
          onClick={() => clearBanStatus()}
          className="rounded-full border border-ink-100 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  )
}
