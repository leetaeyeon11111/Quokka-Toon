import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return <p className="py-24 text-center text-sm text-ink-500">로그인 상태를 확인하는 중…</p>
  }

  if (!isLoggedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  return children
}
