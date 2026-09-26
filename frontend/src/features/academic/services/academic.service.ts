import { api } from '@/services/http'
import type { AcademicResource, AcademicTerm, Paginator, TermForm } from '@/types'

/**
 * API calls of the academic module (courses catalog and terms administration).
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

/**
 * Courses catalog (for the grade filter and the import enrollment).
 */
export async function fetchCourses(): Promise<AcademicResource[]> {
  const { data } = await api.get<{ data: Paginator<AcademicResource> }>('/v1/academic/courses', {
    params: { per_page: 100 },
  })

  return data.data.data
}

/**
 * Academic terms catalog. By default only returns the current term; pass
 * `false` to list all (wizard selector).
 */
export async function fetchTerms(currentOnly = true): Promise<AcademicResource[]> {
  const { data } = await api.get<{ data: Paginator<AcademicResource> }>('/v1/academic/terms', {
    params: { current_only: currentOnly ? 1 : 0 },
  })

  return data.data.data
}

/**
 * Paginated academic terms for the administration catalog.
 */
export async function fetchTermsPaginated(page = 1, perPage = 15): Promise<Paginator<AcademicTerm>> {
  const { data } = await api.get<{ data: Paginator<AcademicTerm> }>('/v1/academic/terms', {
    params: { page, per_page: perPage },
  })

  return data.data
}

/**
 * Creates an academic term.
 */
export async function createTerm(payload: TermForm): Promise<AcademicTerm> {
  const { data } = await api.post<{ data: AcademicTerm }>('/v1/academic/terms', payload)

  return data.data
}

/**
 * Updates an academic term (partial payload, same as the PUT endpoint).
 */
export async function updateTerm(id: number, payload: Partial<TermForm>): Promise<AcademicTerm> {
  const { data } = await api.put<{ data: AcademicTerm }>(`/v1/academic/terms/${id}`, payload)

  return data.data
}

/**
 * Deletes an academic term. The backend returns 422 if it has enrollments or
 * grades associated.
 */
export async function deleteTerm(id: number): Promise<void> {
  await api.delete(`/v1/academic/terms/${id}`)
}