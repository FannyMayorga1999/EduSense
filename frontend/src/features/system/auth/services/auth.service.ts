import { api, fetchCsrf } from '@/services/http'
import type { SessionUser } from '@/types'

/**
 * Authentication API calls (login, logout, current session).
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

/**
 * Restores the session restoring the Sanctum HttpOnly cookie.
 */
export async function fetchMe(): Promise<SessionUser> {
  const { data } = await api.get<{ data: SessionUser }>('/v1/me')

  return data.data
}

/**
 * Signs in with email/password. The CSRF cookie is fetched first so axios can
 * attach the X-XSRF-TOKEN header.
 */
export async function signIn(email: string, password: string): Promise<SessionUser> {
  await fetchCsrf()

  const { data } = await api.post<{ data: SessionUser }>('/v1/login', { email, password })

  return data.data
}

/**
 * Ends the current session.
 */
export async function signOut(): Promise<void> {
  await api.post('/v1/logout')
}