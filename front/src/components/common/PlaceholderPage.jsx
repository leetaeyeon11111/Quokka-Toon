import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function PlaceholderPage({ title, description, showDemoLogin = false, showBack = false }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <img
        src="/error_quokka.png"
        alt=""
        aria-hidden
        className="mb-2 h-40 w-40 object-contain sm:h-48 sm:w-48"
      />
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <p className="text-ink-500">{description ?? '요청한 내용을 표시할 수 없어요.'}</p>

      {showDemoLogin && !isLoggedIn && (
        <Link
          to="/login"
          className="mt-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
        >
          로그인 하러 가기 →
        </Link>
      )}
      {showDemoLogin && isLoggedIn && (
        <p className="text-sm text-mint-500">로그인 상태입니다. 헤더에서 프로필을 확인해보세요.</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            ← 이전 페이지
          </button>
        )}
        <Link to="/" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
