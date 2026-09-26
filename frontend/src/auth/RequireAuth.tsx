import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import Spinner from '../components/ui/Spinner'

/**
 * Route guard: shows a spinner while the session is restored and redirects
 * to the login page when the user is not authenticated.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}