import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bell, CalendarCheck2, FileText, RefreshCw, Users } from 'lucide-react'
import { evaluarYAsignarCronograma, obtenerResumenDashboard, payloadDeDemostracion } from '../api'
import echo from '../echo'
import type {
  AreaEvaluacion,
  DashboardData,
  EstudianteResumen,
  EvaluacionResultado,
  EventoEvaluacionProcesada,
  Notificacion,
} from '../types'
import KpiCard from './KpiCard'
import Button from './ui/Button'

/**
 * Estilos de badge y barra de progreso por área de alerta.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
const COLORES_AREA: Record<AreaEvaluacion, { badge: string; barra: string }> = {
  attention: { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300', barra: 'bg-rose-500' },
  reading_writing: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', barra: 'bg-amber-500' },
  math: { badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300', barra: 'bg-sky-500' },
  motor: { badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300', barra: 'bg-violet-500' },
}

/**
 * Devuelve los estilos del estudiante según su área de alerta (o verde sin alerta).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
function estilosAlerta(area: AreaEvaluacion | null): { badge: string; barra: string } {
  if (area === null) {
    return {
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
      barra: 'bg-emerald-500',
    }
  }

  return COLORES_AREA[area]
}

/**
 * Reproduce un tono breve de alerta usando la Web Audio API.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
function reproducirSonidoAlerta(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (AudioContextCtor === undefined) {
      return
    }

    const contexto = new AudioContextCtor()
    const oscilador = contexto.createOscillator()
    const ganancia = contexto.createGain()

    oscilador.connect(ganancia)
    ganancia.connect(contexto.destination)

    oscilador.type = 'sine'
    oscilador.frequency.value = 880

    ganancia.gain.setValueAtTime(0.12, contexto.currentTime)
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.6)

    oscilador.start(contexto.currentTime)
    oscilador.stop(contexto.currentTime + 0.6)
  } catch {
    // El navegador puede bloquear el audio autónomo; la alerta visual sigue activa.
  }
}

/**
 * Componente principal del Dashboard con soporte de tiempo real (WebSocket).
 * Muestra KPIs, la tabla de estudiantes evaluados y notificaciones de alertas.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
export default function Dashboard() {
  const { t } = useTranslation()

  const [datos, setDatos] = useState<DashboardData | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<boolean>(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const contadorNotificaciones = useRef<number>(0)

  /**
   * Añade una notificación transitoria a la pila visible.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const agregarNotificacion = useCallback((titulo: string, mensaje: string, tipo: 'alerta' | 'info'): void => {
    const id = ++contadorNotificaciones.current

    setNotificaciones((previas) => [...previas, { id, titulo, mensaje, tipo }])

    window.setTimeout(() => {
      setNotificaciones((previas) => previas.filter((notificacion) => notificacion.id !== id))
    }, 6000)
  }, [])

  /**
   * Recarga el resumen del dashboard desde la API.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const refrescar = useCallback(async (): Promise<void> => {
    try {
      const resumen = await obtenerResumenDashboard()

      setDatos(resumen)
      setError(null)
    } catch (motivo) {
      const detalle = motivo instanceof Error ? motivo.message : 'Error desconocido'

      setError(detalle)
    } finally {
      setCargando(false)
    }
  }, [])

  /**
   * Manejador del evento WebSocket "evaluacion.procesada": notifica la alerta
   * (o el resultado) y refresca el dashboard con los datos confirmados.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const manejarEvento = useCallback(
    (evento: EventoEvaluacionProcesada): void => {
      if (evento.alerted) {
        agregarNotificacion(
          t('dashboard.new_alert_title'),
          t('dashboard.new_alert_message', { name: evento.student, area: evento.area }),
          'alerta',
        )
        reproducirSonidoAlerta()
      } else {
        agregarNotificacion(
          t('dashboard.eval_ok_title'),
          t('dashboard.eval_ok_message', { name: evento.student, score: evento.score }),
          'info',
        )
      }

      void refrescar()
    },
    [agregarNotificacion, refrescar, t],
  )

  useEffect(() => {
    let activo = true

    obtenerResumenDashboard()
      .then((resumen) => {
        if (activo) {
          setDatos(resumen)
          setCargando(false)
        }
      })
      .catch((motivo: Error) => {
        if (activo) {
          setError(motivo.message)
          setCargando(false)
        }
      })

    const canal = echo.channel('evaluaciones')
    canal.listen('.evaluacion.procesada', manejarEvento)

    return () => {
      activo = false
      canal.stopListening('.evaluacion.procesada')
    }
  }, [manejarEvento])

  /**
   * Ejecuta una evaluación de ejemplo sobre datos sembrados y refresca el
   * dashboard; el WebSocket, si está conectado, confirma el evento al instante.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const procesarDemostracion = useCallback(async (): Promise<void> => {
    setProcesando(true)

    try {
      const payload = await payloadDeDemostracion()
      const resultado: EvaluacionResultado = await evaluarYAsignarCronograma(payload)

      if (resultado.alerted) {
        agregarNotificacion(
          t('dashboard.eval_alert_title'),
          t('dashboard.eval_alert_message', { score: resultado.score, threshold: resultado.threshold }),
          'alerta',
        )
        reproducirSonidoAlerta()
      } else {
        agregarNotificacion(
          t('dashboard.eval_ok_title'),
          t('dashboard.eval_ok_message', { name: t('dashboard.demo_subject'), score: resultado.score }),
          'info',
        )
      }

      await refrescar()
    } catch (motivo) {
      const detalle = motivo instanceof Error ? motivo.message : 'Error desconocido'

      agregarNotificacion(t('dashboard.load_error'), detalle, 'info')
    } finally {
      setProcesando(false)
    }
  }, [agregarNotificacion, refrescar, t])

  /**
   * Simula la apertura de la ficha de un estudiante.
   *
   * @author Fanny Mayorga
   * @date   16-09-2026
   */
  const verFicha = useCallback(
    (estudiante: EstudianteResumen): void => {
      agregarNotificacion(t('dashboard.title'), t('dashboard.ficha_toast', { name: estudiante.full_name }), 'info')
    },
    [agregarNotificacion, t],
  )

  return (
    <section className="space-y-6" aria-label={t('dashboard.title')}>
      {/* Encabezado del dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('dashboard.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void procesarDemostracion()}
            disabled={procesando || cargando}
            cargando={procesando}
          >
            {procesando ? t('dashboard.processing') : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t('dashboard.demo')}
              </>
            )}
          </Button>

          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <Bell className="h-5 w-5" />
            {notificaciones.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notificaciones.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notificaciones flotantes */}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {notificaciones.map((notificacion) => (
          <div
            key={notificacion.id}
            className={`pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur ${
              notificacion.tipo === 'alerta'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/80 dark:text-rose-100'
                : 'border-stone-200 bg-white/90 text-stone-800 dark:border-stone-700 dark:bg-stone-800/90 dark:text-stone-100'
            }`}
          >
            <div className="flex items-start gap-2">
              {notificacion.tipo === 'alerta' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Bell className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">{notificacion.titulo}</p>
                <p className="mt-0.5 text-xs opacity-90">{notificacion.mensaje}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error !== null && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          titulo={t('dashboard.total_surveys')}
          valor={datos?.evaluated_students ?? 0}
          icono={Users}
          acento="bg-primary-500"
          cargando={cargando}
        />
        <KpiCard
          titulo={t('dashboard.active_alerts')}
          valor={datos?.active_alerts ?? 0}
          icono={AlertTriangle}
          acento="bg-rose-500"
          cargando={cargando}
        />
        <KpiCard
          titulo={t('dashboard.upcoming_activities')}
          valor={datos?.pending_sessions_today ?? 0}
          icono={CalendarCheck2}
          acento="bg-emerald-500"
          cargando={cargando}
        />
      </div>

      {/* Tabla de estudiantes evaluados */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-700">
            <thead className="bg-stone-50 dark:bg-stone-900">
              <tr>
                {(['name', 'grade', 'alert', 'progress', 'actions'] as const).map((columna) => (
                  <th
                    key={columna}
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-stone-300"
                  >
                    {t(`dashboard.table.${columna}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {cargando ? (
                Array.from({ length: 4 }).map((_, indice) => (
                  <tr key={indice}>
                    {Array.from({ length: 5 }).map((__, celda) => (
                      <td key={celda} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded-md bg-stone-200 dark:bg-stone-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (datos?.students.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">
                    {t('dashboard.table.empty')}
                  </td>
                </tr>
              ) : (
                (datos?.students ?? []).map((estudiante) => {
                  const estilos = estilosAlerta(estudiante.last_area)

                  return (
                    <tr key={estudiante.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/40">
                      <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">
                        {estudiante.full_name}
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                        {estudiante.grade ?? estudiante.document_number ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${estilos.badge}`}>
                          {estudiante.alerted && estudiante.area_label !== null ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {estudiante.area_label}
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {t('dashboard.no_alert')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                            <div
                              className={`h-2 rounded-full ${estilos.barra} transition-all duration-500`}
                              style={{ width: `${estudiante.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                            {estudiante.score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => verFicha(estudiante)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
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