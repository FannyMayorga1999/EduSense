/**
 * Tipos compartidos del cliente de EduSense (API + WebSocket).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */

export type AreaEvaluacion = 'reading_writing' | 'math' | 'attention' | 'motor'

/**
 * Usuario autenticado devuelto por /api/v1/login y /api/v1/me.
 */
export interface UsuarioSession {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

/**
 * Última evaluación de un estudiante, expuesta por /api/v1/dashboard/summary.
 */
export interface EstudianteResumen {
  id: number
  full_name: string
  document_number: string | null
  grade: string | null
  last_area: AreaEvaluacion | null
  area_label: string | null
  score: number
  threshold: number | null
  alerted: boolean
  pending_sessions: number
}

/**
 * Resumen del dashboard expuesto por /api/v1/dashboard/summary.
 */
export interface DashboardData {
  total_students: number
  evaluated_students: number
  pending_sessions_today: number
  active_plans: number
  active_alerts: number
  students: EstudianteResumen[]
}

/**
 * Resultado devuelto por POST /api/v1/psychopedagogic/evaluations.
 */
export interface EvaluacionResultado {
  score: number
  threshold: number
  alerted: boolean
}

/**
 * Payload validado por el endpoint de evaluación (EvaluateStudentRequest).
 */
export interface EvaluarPayload {
  student_id: number
  survey_id: number
  answers: Record<number, number>
}

/**
 * Evento recibido desde el canal WebSocket "evaluaciones".
 */
export interface EventoEvaluacionProcesada {
  student: string
  student_id: number
  area: AreaEvaluacion
  score: number
  threshold: number
  alerted: boolean
  socket?: string
}

export interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  tipo: 'alerta' | 'info'
}

/**
 * Recurso académico simple (curso o período).
 */
export interface RecursoAcademico {
  id: number
  name: string
}

/**
 * Estudiante del registro maestro (GET/POST/PUT /v1/students).
 */
export interface Estudiante {
  id: number
  first_name: string
  last_name: string
  birth_date: string | null
  document_number: string | null
  tutor_id: number | null
  is_active: boolean
  full_name: string
}

/**
 * Matrícula expuesta en la lista de estudiantes.
 */
export interface MatriculaResumen {
  id: number
  status: string
  course: { id: number; name: string } | null
}

/**
 * Estudiante del listado paginado (índice de estudiantes).
 */
export interface EstudianteLista extends Estudiante {
  enrollments: MatriculaResumen[]
  psychopedagogic_records_count: number
  diagnostics_count: number
  intervention_schedules_count: number
}

/**
 * Página de Laravel usada en los endpoints que paginan (students, courses...).
 */
export interface Paginador<T> {
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
 * Filtros de la lista y de la descarga de estudiantes.
 */
export interface FiltrosEstudiantes {
  search?: string
  is_active?: string
  grade?: string
  page?: number
  per_page?: number
}

/**
 * Formulario de creación/edición de un estudiante.
 */
export interface EstudianteForm {
  first_name: string
  last_name: string
  document_number: string
  birth_date: string
  is_active: boolean
}

/**
 * Resultado devuelto por POST /v1/students/import.
 */
export interface ResultadoImport {
  created: number
  updated: number
  failed: number
  errors: string[]
}