import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'quakatoon:auth'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = useCallback((overrides = {}) => {
    setUser({ nickname: '닉네임', level: 12, exp: 60, ...overrides })
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = { user, isLoggedIn: Boolean(user), login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
