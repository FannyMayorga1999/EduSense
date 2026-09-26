import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchMe, signIn, signOut } from '@/features/system/auth/services/auth.service'
import type { SessionUser } from '@/types'

/**
 * Authentication context of EduSense: restores the session with the Sanctum
 * HttpOnly cookies and exposes login/logout.
 *
 * @author Fanny Mayorga | @date 26-09-2026
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

    fetchMe()
      .then((session) => {
        if (mounted) {
          setUser(session)
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
    const session = await signIn(email, password)

    setUser(session)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut()
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