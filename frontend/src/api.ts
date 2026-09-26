import axios from 'axios'
import type {
  AcademicResource,
  AcademicTerm,
  DashboardData,
  EvaluatePayload,
  EvaluationResult,
  ImportResult,
  Paginator,
  Student,
  StudentDetail,
  StudentForm,
  StudentFilters,
  StudentListItem,
  TermForm,
} from './types'

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

/**
 * Fetches the dashboard summary (KPIs + latest evaluation per student).
 *
 * @returns Promise with the dashboard data.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function fetchDashboardSummary(): Promise<DashboardData> {
  const { data } = await api.get<{ data: DashboardData }>('/v1/dashboard/summary')

  return data.data
}

/**
 * Processes a psychopedagogic evaluation and returns its score.
 *
 * @param payload Validated evaluation data (student + survey + answers).
 * @returns Promise with the structured evaluation result.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function submitEvaluation(payload: EvaluatePayload): Promise<EvaluationResult> {
  const { data } = await api.post<{ data: EvaluationResult }>('/v1/psychopedagogic/evaluations', payload)

  return data.data
}

/**
 * Paginated students list with filters (search, status, grade).
 */
export async function fetchStudents(filters: StudentFilters): Promise<Paginator<StudentListItem>> {
  const { data } = await api.get<{ data: Paginator<StudentListItem> }>('/v1/students', { params: filters })

  return data.data
}

/**
 * Creates a student.
 */
export async function createStudent(payload: StudentForm): Promise<Student> {
  const { data } = await api.post<{ data: Student }>('/v1/students', payload)

  return data.data
}

/**
 * Updates a student (partial payload, same as the PUT endpoint).
 */
export async function updateStudent(id: number, payload: Partial<StudentForm>): Promise<Student> {
  const { data } = await api.put<{ data: Student }>(`/v1/students/${id}`, payload)

  return data.data
}

/**
 * Fetches the full detail of a student (with enrollments and health/contact
 * data) to prefill the edit wizard.
 */
export async function fetchStudent(id: number): Promise<StudentDetail> {
  const { data } = await api.get<{ data: StudentDetail }>(`/v1/students/${id}`)

  return data.data
}

/**
 * Deactivates a student (soft delete).
 */
export async function deactivateStudent(id: number): Promise<void> {
  await api.delete(`/v1/students/${id}`)
}

/**
 * Uploads a bulk CSV of students (optionally enrolls them).
 */
export async function importStudents(
  file: File,
  separator: string,
  enrollment?: { course_id: number; term_id: number },
): Promise<ImportResult> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('separator', separator)

  if (enrollment !== undefined) {
    formData.append('course_id', String(enrollment.course_id))
    formData.append('term_id', String(enrollment.term_id))
  }

  const { data } = await api.post<{ data: ImportResult }>('/v1/students/import', formData)

  return data.data
}

/**
 * Downloads the filtered students list as CSV or XLSX.
 */
export async function exportStudents(filters: StudentFilters, format: 'csv' | 'xlsx'): Promise<void> {
  const { data } = await api.get('/v1/students/export', {
    params: { ...filters, format },
    responseType: 'blob',
  })

  const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const link = document.createElement('a')

  link.href = url
  link.download = `estudiantes_${stamp}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

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

/**
 * Survey of an area with its questions.
 */
interface Survey {
  id: number
  evaluation_area: string
  is_active: boolean
  questions: { id: number }[]
}

/**
 * Builds a demonstration payload from the seeded data: evaluates a real
 * student in the attention area with high scores to trigger an alert.
 *
 * @returns Promise with the payload for the evaluation endpoint.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function buildDemoPayload(): Promise<EvaluatePayload> {
  const [summary, list] = await Promise.all([
    api.get<{ data: DashboardData }>('/v1/dashboard/summary'),
    api.get<{ data: { data: Survey[] } }>('/v1/psychopedagogic/surveys', {
      params: { evaluation_area: 'attention', is_active: true },
    }),
  ])

  const student = summary.data.data.students[0]
  const survey = list.data.data.data[0]

  if (student === undefined || survey === undefined) {
    throw new Error('No demo data available: create students and surveys first.')
  }

  const detail = await api.get<{ data: Survey }>(`/v1/psychopedagogic/surveys/${survey.id}`)

  const answers: Record<number, number> = Object.fromEntries(
    detail.data.data.questions.map((question) => [question.id, 5]),
  )

  return {
    student_id: student.id,
    survey_id: detail.data.data.id,
    answers,
  }
}