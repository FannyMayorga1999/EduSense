import { useCallback, useEffect, useState } from 'react'
import type { Paginator } from '@/types'

/**
 * Reusable state and logic for paginated listings against the EduSense API.
 * Centralizes the data, loading, error, current page, per-page limit and
 * reload so any page can use it without duplicating the implementation.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface UsePaginationOptions<T> {
  fetch: (page: number, limit: number) => Promise<Paginator<T>>
  deps?: unknown[]
  errorMessage?: string
  initialLimit?: number
}

export interface PaginationState<T> {
  data: Paginator<T> | null
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  total: number
  from: number | null
  to: number | null
  limit: number
  goToPage: (page: number) => void
  changeLimit: (limit: number) => void
  reload: () => void
}

export default function usePagination<T>({
  fetch,
  deps = [],
  errorMessage = '',
  initialLimit = 10,
}: UsePaginationOptions<T>): PaginationState<T> {
  const [data, setData] = useState<Paginator<T> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError(null)

    fetch(page, limit)
      .then((result) => {
        if (mounted) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setError(errorMessage)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey, ...deps])

  const goToPage = useCallback((next: number): void => {
    setPage(next)
  }, [])

  const changeLimit = useCallback((next: number): void => {
    setLimit(next)
    setPage(1)
  }, [])

  const reload = useCallback((): void => {
    setReloadKey((value) => value + 1)
  }, [])

  return {
    data,
    loading,
    error,
    page,
    totalPages: data?.last_page ?? 1,
    total: data?.total ?? 0,
    from: data?.from ?? null,
    to: data?.to ?? null,
    limit,
    goToPage,
    changeLimit,
    reload,
  }
}