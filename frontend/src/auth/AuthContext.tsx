import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, obtenerCsrf } from '../api'
import type { UsuarioSession } from '../types'

/**
 * Contexto de autenticación de EduSense: restaura la sesión con las cookies
 * HttpOnly de Sanctum y expone login/logout.
 *
 * @author Fanny Mayorga
 */

interface AuthContextValue {
  usuario: UsuarioSession | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSession | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)

  useEffect(() => {
    let activo = true

    api
      .get<{ data: UsuarioSession }>('/v1/me')
      .then(({ data }) => {
        if (activo) {
          setUsuario(data.data)
        }
      })
      .catch(() => {
        if (activo) {
          setUsuario(null)
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await obtenerCsrf()

    const { data } = await api.post<{ data: UsuarioSession }>('/v1/login', { email, password })

    setUsuario(data.data)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/v1/logout')
    } finally {
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)

  if (contexto === undefined) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  }

  return contexto
}