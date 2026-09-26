import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bell, CalendarCheck2, FileText, RefreshCw, Users } from 'lucide-react'
import KpiCard from '@/features/psychopedagogic/components/KpiCard'
import { useDashboard } from '@/features/psychopedagogic/hooks/useDashboard'
import Button from '@/components/ui/Button'
import type { EvaluationArea } from '@/types'

/**
 * Main dashboard view (psychopedagogic): KPIs, evaluated students table and
 * real-time notifications. The state and events live in the `useDashboard`
 * hook; here only the presentation is rendered.
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

/**
 * Badge and progress bar styles per alert area.
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

export default function Dashboard() {
  const { t } = useTranslation()
  const {
    data,
    loading,
    error,
    processing,
    notifications,
    runDemo,
    openStudent,
  } = useDashboard()

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