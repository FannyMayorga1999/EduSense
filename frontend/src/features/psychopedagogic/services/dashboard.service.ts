import { api } from '@/services/http'
import type { DashboardData, EvaluatePayload, EvaluationResult } from '@/types'

/**
 * API calls of the psychopedagogic dashboard (summary, evaluation, demo).
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

/**
 * Fetches the dashboard summary (KPIs + latest evaluation per student).
 *
 * @returns Promise with the dashboard data.
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
 */
export async function submitEvaluation(payload: EvaluatePayload): Promise<EvaluationResult> {
  const { data } = await api.post<{ data: EvaluationResult }>('/v1/psychopedagogic/evaluations', payload)

  return data.data
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