import axios from 'axios'
import type {
  DashboardData,
  Estudiante,
  EstudianteForm,
  EstudianteLista,
  EvaluacionResultado,
  EvaluarPayload,
  FiltrosEstudiantes,
  Paginador,
  RecursoAcademico,
  ResultadoImport,
} from './types'

/**
 * Cliente HTTP de la API de EduSense (Sanctum SPA con cookies).
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
 * Solicita la cookie CSRF de Sanctum. Debe ejecutarse antes del primer
 * envío de formulario (login) para que axios adjunte X-XSRF-TOKEN.
 */
export async function obtenerCsrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie', { baseURL: '/' })
}

/**
 * Obtiene el resumen del dashboard (KPIs + última evaluación por estudiante).
 *
 * @returns Promesa con los datos del dashboard.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function obtenerResumenDashboard(): Promise<DashboardData> {
  const { data } = await api.get<{ data: DashboardData }>('/v1/dashboard/summary')

  return data.data
}

/**
 * Procesa una evaluación psicopedagógica y devuelve su puntaje.
 *
 * @param payload Datos validados de la evaluación (estudiante + encuesta + respuestas).
 * @returns Promesa con el resultado estructurado de la evaluación.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function evaluarYAsignarCronograma(payload: EvaluarPayload): Promise<EvaluacionResultado> {
  const { data } = await api.post<{ data: EvaluacionResultado }>('/v1/psychopedagogic/evaluations', payload)

  return data.data
}

/**
 * Lista paginada de estudiantes con filtros (search, estado, grado).
 */
export async function obtenerEstudiantes(filtros: FiltrosEstudiantes): Promise<Paginador<EstudianteLista>> {
  const { data } = await api.get<{ data: Paginador<EstudianteLista> }>('/v1/students', { params: filtros })

  return data.data
}

/**
 * Crea un estudiante.
 */
export async function crearEstudiante(payload: EstudianteForm): Promise<Estudiante> {
  const { data } = await api.post<{ data: Estudiante }>('/v1/students', payload)

  return data.data
}

/**
 * Actualiza un estudiante.
 */
export async function actualizarEstudiante(id: number, payload: EstudianteForm): Promise<Estudiante> {
  const { data } = await api.put<{ data: Estudiante }>(`/v1/students/${id}`, payload)

  return data.data
}

/**
 * Desactiva un estudiante (baja lógica).
 */
export async function desactivarEstudiante(id: number): Promise<void> {
  await api.delete(`/v1/students/${id}`)
}

/**
 * Sube un CSV masivo de estudiantes (opcionalmente los matricula).
 */
export async function importarEstudiantes(
  archivo: File,
  separator: string,
  matricula?: { course_id: number; term_id: number },
): Promise<ResultadoImport> {
  const formData = new FormData()

  formData.append('file', archivo)
  formData.append('separator', separator)

  if (matricula !== undefined) {
    formData.append('course_id', String(matricula.course_id))
    formData.append('term_id', String(matricula.term_id))
  }

  const { data } = await api.post<{ data: ResultadoImport }>('/v1/students/import', formData)

  return data.data
}

/**
 * Descarga el listado filtrado de estudiantes como CSV o XLSX.
 */
export async function exportarEstudiantes(filtros: FiltrosEstudiantes, formato: 'csv' | 'xlsx'): Promise<void> {
  const { data } = await api.get('/v1/students/export', {
    params: { ...filtros, format: formato },
    responseType: 'blob',
  })

  const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
  const url = URL.createObjectURL(blob)
  const marca = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const enlace = document.createElement('a')

  enlace.href = url
  enlace.download = `estudiantes_${marca}.${formato}`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

/**
 * Catálogo de cursos (para el filtro de grado y la matrícula del import).
 */
export async function obtenerCursos(): Promise<RecursoAcademico[]> {
  const { data } = await api.get<{ data: Paginador<RecursoAcademico> }>('/v1/academic/courses', {
    params: { per_page: 100 },
  })

  return data.data.data
}

/**
 * Catálogo de períodos académicos (para la matrícula del import).
 */
export async function obtenerTerminos(): Promise<RecursoAcademico[]> {
  const { data } = await api.get<{ data: Paginador<RecursoAcademico> }>('/v1/academic/terms', {
    params: { current_only: 1 },
  })

  return data.data.data
}

/**
 * Encuesta de un área con sus preguntas.
 */
interface Encuesta {
  id: number
  evaluation_area: string
  is_active: boolean
  questions: { id: number }[]
}

/**
 * Construye un payload de demostración a partir de los datos sembrados:
 * evalúa a un estudiante real en el área de atención con puntajes altos
 * para disparar una alerta.
 *
 * @returns Promise con el payload listo para el endpoint de evaluación.
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export async function payloadDeDemostracion(): Promise<EvaluarPayload> {
  const [resumen, listado] = await Promise.all([
    api.get<{ data: DashboardData }>('/v1/dashboard/summary'),
    api.get<{ data: { data: Encuesta[] } }>('/v1/psychopedagogic/surveys', {
      params: { evaluation_area: 'attention', is_active: true },
    }),
  ])

  const estudiante = resumen.data.data.students[0]
  const encuesta = listado.data.data.data[0]

  if (estudiante === undefined || encuesta === undefined) {
    throw new Error('No hay datos de demostración: crea estudiantes y encuestas antes.')
  }

  const detalle = await api.get<{ data: Encuesta }>(`/v1/psychopedagogic/surveys/${encuesta.id}`)

  const answers: Record<number, number> = Object.fromEntries(
    detalle.data.data.questions.map((pregunta) => [pregunta.id, 5]),
  )

  return {
    student_id: estudiante.id,
    survey_id: detalle.data.data.id,
    answers,
  }
}