import { useEffect, useState } from 'react'
import { fetchMenus } from '@/features/system/menus/services/menu.service'
import { useAuth } from '@/features/system/auth/hooks/useAuth'
import type { MenuNode } from '@/types'

/**
 * Loads the navigation tree once the session is available. The labels and the
 * permission filtering are decided by the backend, so the sidebar just renders
 * whatever the endpoint returns.
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */

export function useMenus() {
  const { user, loading: authLoading } = useAuth()
  const [menus, setMenus] = useState<MenuNode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (authLoading || user === null) {
      return
    }

    let mounted = true

    fetchMenus()
      .then((tree) => {
        if (mounted) {
          setMenus(tree)
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true)
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
  }, [authLoading, user])

  return { menus, loading, error }
}