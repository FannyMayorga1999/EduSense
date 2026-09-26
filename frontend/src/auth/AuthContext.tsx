import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, fetchCsrf } from '../api'
import type { SessionUser } from '../types'

/**
 * Authentication context of EduSense: restores the session with the Sanctum
 * HttpOnly cookies and exposes login/logout.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true

    api
      .get<{ data: SessionUser }>('/v1/me')
      .then(({ data }) => {
        if (mounted) {
          setUser(data.data)
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await fetchCsrf()

    const { data } = await api.post<{ data: SessionUser }>('/v1/login', { email, password })

    setUser(data.data)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/v1/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within <AuthProvider>.')
  }

  return context
}