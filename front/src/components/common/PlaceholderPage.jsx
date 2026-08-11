import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function PlaceholderPage({ title, description, showDemoLogin = false }) {
  const { isLoggedIn, login } = useAuth()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="text-4xl" aria-hidden>
        🐿
      </span>
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <p className="text-ink-500">{description ?? '이 화면은 다음 단계에서 구현될 예정이에요.'}</p>

      {showDemoLogin && !isLoggedIn && (
        <button
          type="button"
          onClick={() => login()}
          className="mt-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
        >
          데모 로그인 (임시)
        </button>
      )}
      {showDemoLogin && isLoggedIn && (
        <p className="text-sm text-mint-500">로그인 상태입니다. 헤더에서 프로필을 확인해보세요.</p>
      )}

      <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
        메인으로 돌아가기
      </Link>
    </div>
  )
}
