import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildDemoPayload, fetchDashboardSummary, submitEvaluation } from '@/features/psychopedagogic/services/dashboard.service'
import echo from '@/services/realtime'
import type {
  DashboardData,
  EvaluationProcessedEvent,
  EvaluationResult,
  Notification,
  StudentSummary,
} from '@/types'

/**
 * Dashboard logic hook: owns the summary data, loading/error state, the
 * WebSocket subscription to "evaluacion.procesada", the transient
 * notifications and the demo run. The component only renders the state.
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */

/**
 * Plays a short alert tone using the Web Audio API (autonomous audio may be
 * blocked by the browser; the visual alert keeps working anyway).
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

export function useDashboard() {
  const { t } = useTranslation()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notificationCounter = useRef<number>(0)

  /**
   * Adds a transient notification to the visible stack.
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
   */
  const openStudent = useCallback(
    (student: StudentSummary): void => {
      addNotification(t('dashboard.title'), t('dashboard.ficha_toast', { name: student.full_name }), 'info')
    },
    [addNotification, t],
  )

  return {
    data,
    loading,
    error,
    processing,
    notifications,
    runDemo,
    openStudent,
  }
}