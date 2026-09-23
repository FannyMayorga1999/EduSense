import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import Spinner from '../components/ui/Spinner'

/**
 * Guard de rutas: muestra un indicador mientras se restaura la sesión y
 * redirige al login cuando el usuario no está autenticado.
 *
 * @author Fanny Mayorga
 */

function PantallaCarga() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return <PantallaCarga />
  }

  if (usuario === null) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  return <>{children}</>
}