import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bell, CalendarCheck2, FileText, RefreshCw, Users } from 'lucide-react'
import { buildDemoPayload, fetchDashboardSummary, submitEvaluation } from '../api'
import echo from '../echo'
import type {
  DashboardData,
  EvaluationArea,
  EvaluationProcessedEvent,
  EvaluationResult,
  Notification,
  StudentSummary,
} from '../types'
import KpiCard from './KpiCard'
import Button from './ui/Button'

/**
 * Badge and progress bar styles per alert area.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
const AREA_COLORS: Record<EvaluationArea, { badge: string; barra: string }> = {
  attention: { badge: 'ed-badge--rose', barra: 'bg-rose-500' },
  reading_writing: { badge: 'ed-badge--amber', barra: 'bg-amber-500' },
  math: { badge: 'ed-badge--sky', barra: 'bg-sky-500' },
  motor: { badge: 'ed-badge--violet', barra: 'bg-violet-500' },
}

/**
 * Returns the alert styles of a student according to its alert area (or green
 * without alert).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
function alertStyles(area: EvaluationArea | null): { badge: string; barra: string } {
  if (area === null) {
    return {
      badge: 'ed-badge--emerald',
      barra: 'bg-emerald-500',
    }
  }

  return AREA_COLORS[area]
}

/**
 * Plays a short alert tone using the Web Audio API.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
function playAlertSound(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (AudioContextCtor === undefined) {
      return
    }

    const context = new AudioContextCtor()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = 880

    gain.gain.setValueAtTime(0.12, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.6)
  } catch {
    // The browser may block autonomous audio; the visual alert keeps working.
  }
}

/**
 * Main Dashboard component with real-time support (WebSocket). Shows KPIs,
 * the evaluated students table and alert notifications.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export default function Dashboard() {
  const { t } = useTranslation()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notificationCounter = useRef<number>(0)

  /**
   * Adds a transient notification to the visible stack.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const addNotification = useCallback((title: string, message: string, type: 'alerta' | 'info'): void => {
    const id = ++notificationCounter.current

    setNotifications((previous) => [...previous, { id, title, message, type }])

    window.setTimeout(() => {
      setNotifications((previous) => previous.filter((notification) => notification.id !== id))
    }, 6000)
  }, [])

  /**
   * Reloads the dashboard summary from the API.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const summary = await fetchDashboardSummary()

      setData(summary)
      setError(null)
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Unknown error'

      setError(detail)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Handler of the WebSocket "evaluacion.procesada" event: notifies the alert
   * (or the result) and refreshes the dashboard with the confirmed data.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const handleEvent = useCallback(
    (event: EvaluationProcessedEvent): void => {
      if (event.alerted) {
        addNotification(
          t('dashboard.new_alert_title'),
          t('dashboard.new_alert_message', { name: event.student, area: event.area }),
          'alerta',
        )
        playAlertSound()
      } else {
        addNotification(
          t('dashboard.eval_ok_title'),
          t('dashboard.eval_ok_message', { name: event.student, score: event.score }),
          'info',
        )
      }

      void refresh()
    },
    [addNotification, refresh, t],
  )

  useEffect(() => {
    let mounted = true

    fetchDashboardSummary()
      .then((summary) => {
        if (mounted) {
          setData(summary)
          setLoading(false)
        }
      })
      .catch((reason: Error) => {
        if (mounted) {
          setError(reason.message)
          setLoading(false)
        }
      })

    const channel = echo.channel('evaluaciones')
    channel.listen('.evaluacion.procesada', handleEvent)

    return () => {
      mounted = false
      channel.stopListening('.evaluacion.procesada')
    }
  }, [handleEvent])

  /**
   * Runs a sample evaluation against seeded data and refreshes the dashboard;
   * the WebSocket, when connected, confirms the event instantly.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const runDemo = useCallback(async (): Promise<void> => {
    setProcessing(true)

    try {
      const payload = await buildDemoPayload()
      const result: EvaluationResult = await submitEvaluation(payload)

      if (result.alerted) {
        addNotification(
          t('dashboard.eval_alert_title'),
          t('dashboard.eval_alert_message', { score: result.score, threshold: result.threshold }),
          'alerta',
        )
        playAlertSound()
      } else {
        addNotification(
          t('dashboard.eval_ok_title'),
          t('dashboard.eval_ok_message', { name: t('dashboard.demo_subject'), score: result.score }),
          'info',
        )
      }

      await refresh()
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Unknown error'

      addNotification(t('dashboard.load_error'), detail, 'info')
    } finally {
      setProcessing(false)
    }
  }, [addNotification, refresh, t])

  /**
   * Simulates opening the record of a student.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const openStudent = useCallback(
    (student: StudentSummary): void => {
      addNotification(t('dashboard.title'), t('dashboard.ficha_toast', { name: student.full_name }), 'info')
    },
    [addNotification, t],
  )

  return (
    <section className="space-y-6" aria-label={t('dashboard.title')}>
      {/* Dashboard header */}
      <div className="ed-page__encabezado">
        <div>
          <h1 className="ed-page__title">{t('dashboard.title')}</h1>
          <p className="ed-page__subtitle">{t('dashboard.subtitle')}</p>
        </div>

        <div className="ed-dash__acciones">
          <Button
            type="button"
            onClick={() => void runDemo()}
            disabled={processing || loading}
            loading={processing}
          >
            {processing ? t('dashboard.processing') : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t('dashboard.demo')}
              </>
            )}
          </Button>

          <div className="ed-dash__campana">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="ed-dash__campana-badge">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating notifications */}
      <div className="ed-dash__noif" aria-live="polite">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`ed-dash__noif-item ${
              notification.type === 'alerta'
                ? 'ed-dash__noif-item--alerta'
                : 'ed-dash__noif-item--info'
            }`}
          >
            <div className="ed-dash__noif-fila">
              {notification.type === 'alerta' ? (
                <AlertTriangle className="ed-dash__noif-icono" />
              ) : (
                <Bell className="ed-dash__noif-icono" />
              )}
              <div className="ed-dash__noif-contenido">
                <p className="ed-dash__noif-titulo">{notification.title}</p>
                <p className="ed-dash__noif-mensaje">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error !== null && (
        <div className="ed-banner ed-banner--error">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="ed-dash__kpis">
        <KpiCard
          title={t('dashboard.total_surveys')}
          value={data?.evaluated_students ?? 0}
          icon={Users}
          accent="bg-primary-500"
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.active_alerts')}
          value={data?.active_alerts ?? 0}
          icon={AlertTriangle}
          accent="bg-rose-500"
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.upcoming_activities')}
          value={data?.pending_sessions_today ?? 0}
          icon={CalendarCheck2}
          accent="bg-emerald-500"
          loading={loading}
        />
      </div>

      {/* Evaluated students table */}
      <div className="ed-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ed-table">
            <thead className="ed-table__thead">
              <tr>
                {(['name', 'grade', 'alert', 'progress', 'actions'] as const).map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="ed-table__th"
                  >
                    {t(`dashboard.table.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 5 }).map((__, cell) => (
                      <td key={cell} className="ed-cargando">
                        <div className="ed-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.students.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="ed-vacio">
                    {t('dashboard.table.empty')}
                  </td>
                </tr>
              ) : (
                (data?.students ?? []).map((student) => {
                  const styles = alertStyles(student.last_area)

                  return (
                    <tr key={student.id} className="ed-table__row">
                      <td className="ed-table__td ed-table__resalto">
                        {student.full_name}
                      </td>
                      <td className="ed-table__td ed-table__secundario">
                        {student.grade ?? student.document_number ?? '—'}
                      </td>
                      <td className="ed-table__td">
                        <span className={`ed-badge ${styles.badge}`}>
                          {student.alerted && student.area_label !== null ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {student.area_label}
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {t('dashboard.no_alert')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="ed-table__td">
                        <div className="ed-dash__fila">
                          <div className="ed-dash__progreso">
                            <div
                              className={`ed-dash__progreso-barra ${styles.barra}`}
                              style={{ width: `${student.score}%` }}
                            />
                          </div>
                          <span className="ed-dash__progreso-valor">
                            {student.score}%
                          </span>
                        </div>
                      </td>
                      <td className="ed-table__td">
                        <button
                          type="button"
                          onClick={() => openStudent(student)}
                          className="ed-accion-texto"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t('dashboard.view_file')}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}