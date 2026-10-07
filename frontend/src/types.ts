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
 * Laravel page shape used by the endpoints that paginate (courses, terms...).
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
 * A single node of the navigation tree served by GET /v1/menus. Nodes with
 * children render as collapsible groups (or top-level sections); nodes with a
 * route render as links. `label_key` is the i18n key of the label and `icon`
 * a key of the frontend lucide catalogue.
 */
export interface MenuNode {
  key: string
  label_key: string
  icon: string | null
  route: string | null
  children: MenuNode[]
}