/**
 * Shared types of the EduSense client (API + WebSocket).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */

export type EvaluationArea = 'reading_writing' | 'math' | 'attention' | 'motor'

/**
 * Authenticated user returned by /api/v1/login and /api/v1/me.
 */
export interface SessionUser {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

/**
 * Latest evaluation of a student, exposed by /api/v1/dashboard/summary.
 */
export interface StudentSummary {
  id: number
  full_name: string
  document_number: string | null
  grade: string | null
  last_area: EvaluationArea | null
  area_label: string | null
  score: number
  threshold: number | null
  alerted: boolean
  pending_sessions: number
}

/**
 * Dashboard summary exposed by /api/v1/dashboard/summary.
 */
export interface DashboardData {
  total_students: number
  evaluated_students: number
  pending_sessions_today: number
  active_plans: number
  active_alerts: number
  students: StudentSummary[]
}

/**
 * Result returned by POST /api/v1/psychopedagogic/evaluations.
 */
export interface EvaluationResult {
  score: number
  threshold: number
  alerted: boolean
}

/**
 * Payload validated by the evaluation endpoint (EvaluateStudentRequest).
 */
export interface EvaluatePayload {
  student_id: number
  survey_id: number
  answers: Record<number, number>
}

/**
 * Event received from the "evaluaciones" WebSocket channel.
 */
export interface EvaluationProcessedEvent {
  student: string
  student_id: number
  area: EvaluationArea
  score: number
  threshold: number
  alerted: boolean
  socket?: string
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'alerta' | 'info'
}

/**
 * Simple academic resource (course or period).
 */
export interface AcademicResource {
  id: number
  name: string
}

/**
 * Academic term for the catalog (GET /v1/academic/terms).
 */
export interface AcademicTerm {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  enrollments_count: number
}

/**
 * Create/edit form of an academic term.
 */
export interface TermForm {
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

/**
 * Student of the master catalog (GET/POST/PUT /v1/students).
 */
export interface Student {
  id: number
  first_name: string
  last_name: string
  birth_date: string | null
  document_type: string
  document_number: string | null
  gender: string | null
  representative_name: string | null
  representative_relation: string | null
  contact_phone: string | null
  contact_email: string | null
  home_address: string | null
  laterality: string | null
  medical_conditions: string | null
  tutor_id: number | null
  is_active: boolean
  academic_status: string
  full_name: string
}

/**
 * Enrollment exposed in the students list.
 */
export interface EnrollmentSummary {
  id: number
  status: string
  parallel: string | null
  course: { id: number; name: string } | null
  term: { id: number; name: string } | null
}

/**
 * Student with its academic context (GET /v1/students/{id}).
 */
export interface StudentDetail extends Student {
  enrollments: EnrollmentSummary[]
}

/**
 * Student of the paginated list (students index).
 */
export interface StudentListItem extends Student {
  enrollments: EnrollmentSummary[]
  psychopedagogic_records_count: number
  diagnostics_count: number
  intervention_schedules_count: number
}

/**
 * Laravel page shape used by the endpoints that paginate (students, courses...).
 */
export interface Paginator<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  next_page_url: string | null
  prev_page_url: string | null
  path: string
  per_page: number
  to: number | null
  total: number
}

/**
 * Filters of the students list and download.
 */
export interface StudentFilters {
  search?: string
  is_active?: string
  grade?: string
  page?: number
  per_page?: number
}

/**
 * Create/edit wizard form of a student.
 */
export interface StudentForm {
  first_name: string
  last_name: string
  birth_date: string
  document_type: string
  document_number: string
  gender: string
  representative_name: string
  representative_relation: string
  contact_phone: string
  contact_email: string
  home_address: string
  laterality: string
  medical_conditions: string
  course_id: string
  term_id: string
  parallel: string
  academic_status: string
  is_active: boolean
}

/**
 * Result returned by POST /v1/students/import.
 */
export interface ImportResult {
  created: number
  updated: number
  failed: number
  errors: string[]
}