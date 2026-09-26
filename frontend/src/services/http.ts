import axios from 'axios'

/**
 * HTTP client of the EduSense API (Sanctum SPA with cookies).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

/**
 * Requests the Sanctum CSRF cookie. It must run before the first form
 * submission (login) so axios attaches the X-XSRF-TOKEN header.
 */
export async function fetchCsrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie', { baseURL: '/' })
}