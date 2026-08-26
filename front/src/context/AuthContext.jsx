import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import * as authApi from '../api/auth'
import { getToken, setToken, clearToken } from '../api/client'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 앱 최초 마운트 시 저장된 토큰으로 세션을 복원하는 동안 true
  const [loading, setLoading] = useState(Boolean(getToken()))

  // 새로고침 후에도 로그인 유지: 토큰이 있으면 /me 로 유저 정보를 복원한다.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        // 만료·위조 토큰 → 조용히 로그아웃
        clearToken()
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 실제 로그인: 토큰 저장 후 /me 로 전체 프로필을 받아온다.
  const login = useCallback(async (email, password) => {
    const token = await authApi.login({ email, password })
    setToken(token.accessToken)
    try {
      const me = await authApi.getMe()
      setUser(me)
      return me
    } catch {
      // /me 실패해도 로그인 응답만으로 최소 정보는 채운다
      const fallback = {
        userId: token.userId,
        nickname: token.nickname,
        level: token.level,
        role: token.role,
      }
      setUser(fallback)
      return fallback
    }
  }, [])

  // 소셜 로그인 등 이미 발급받은 accessToken 으로 세션 시작
  const loginWithAccessToken = useCallback(async (accessToken) => {
    setToken(accessToken)
    const me = await authApi.getMe()
    setUser(me)
    return me
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) return null
    const me = await authApi.getMe()
    setUser(me)
    return me
  }, [])

  const value = {
    user,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    loading,
    login,
    loginWithAccessToken,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
