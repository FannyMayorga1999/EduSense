import { api } from '@/services/http'
import type {
  ImportResult,
  Paginator,
  Student,
  StudentDetail,
  StudentFilters,
  StudentForm,
  StudentListItem,
} from '@/types'

/**
 * API calls of the students module (catalog, CRUD, CSV import/export).
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

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