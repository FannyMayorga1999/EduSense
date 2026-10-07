/**
 * Types of the Students submodule (academic feature).
 *
 * They describe the payloads and responses of /v1/students, so they live with
 * the feature instead of the global `src/types.ts`. Shared Laravel/API shapes
 * (`Paginator`, `AcademicResource`) stay in `@/types` because other academic
 * features consume them too.
 */

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
  tutor?: { id: number; name: string; email: string } | null
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
 * Filters of the students list and download. `is_active`, `grade` and `parallel` support
 * multiple values: each selected value is sent as a repeated query parameter
 * (`grade[]=...`, `parallel[]=...`) and combined with OR in the backend.
 * `parallel_undefined` filters students without a parallel assignment.
 */
export interface StudentFilters {
  search?: string
  is_active?: string[]
  grade?: string[]
  parallel?: string[]
  parallel_undefined?: string
  ids?: number[]
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
