import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react'
import { AlertContext } from '@/shared/components/ui/alertContext'
import type {
  AlertAction,
  AlertContextValue,
  AlertItem,
  AlertOptions,
  AlertVariant,
} from '@/shared/components/ui/alertContext'
import { formatDateTime } from '@/shared/utils/format'

/**
 * Alert notifications of the EduSense UI kit. Every alert follows one of four
 * fixed shapes (information required, task completed, context updated, request
 * failed) so the outcome of a form submission is always read the same way.
 *
 * @author Fanny Mayorga
 * @date   02-10-2026
 */

const ICONS: Record<AlertVariant, typeof Info> = {
  'info-needed': AlertTriangle,
  completed: CheckCircle2,
  'context-updated': Info,
  error: XCircle,
}

const MAX_VISIBLE = 4

/**
 * Provides the alert queue and renders the fixed viewport.
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number): void => {
    setAlerts((current) => current.filter((alert) => alert.id !== id))

    const timer = timers.current.get(id)

    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  /**
   * Default action pair per variant. Labels come from i18n so they follow the
   * active language; clicking one dismisses the alert unless the caller
   * supplied its own handler.
   */
  const defaultActions = useCallback(
    (variant: AlertVariant, id: number): AlertAction[] => {
      const close = (): void => dismiss(id)

      if (variant === 'info-needed') {
        return [
          { label: t('alerts.actions.add_details'), emphasis: true, onClick: close },
          { label: t('alerts.actions.see_missing'), onClick: close },
        ]
      }

      if (variant === 'completed') {
        return [
          { label: t('alerts.actions.review_output'), onClick: close },
          { label: t('alerts.actions.refine_result'), emphasis: true, onClick: close },
        ]
      }

      if (variant === 'context-updated') {
        return [
          { label: t('alerts.actions.view_context'), emphasis: true, onClick: close },
          { label: t('alerts.actions.manage_memory'), onClick: close },
        ]
      }

      return [
        { label: t('alerts.actions.try_again'), emphasis: true, onClick: close },
        { label: t('alerts.actions.learn_why'), onClick: close },
      ]
    },
    [dismiss, t],
  )

  const push = useCallback(
    (message: string, options: AlertOptions = {}): void => {
      const variant = options.variant ?? 'completed'
      const id = Date.now() + Math.random()
      const sticky = options.sticky ?? false
      const duration = options.duration ?? 6000

      // Keep the queue short so a burst of errors cannot cover the screen.
      setAlerts((current) => [
        ...current.slice(-(MAX_VISIBLE - 1)),
        {
          id,
          variant,
          message,
          timestamp: formatDateTime(Date.now()),
          actions: options.actions ?? defaultActions(variant, id),
          duration,
          sticky,
        },
      ])

      if (!sticky) {
        timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
      }
    },
    [defaultActions, dismiss],
  )

  useEffect(() => {
    const pending = timers.current

    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo<AlertContextValue>(() => ({ push, dismiss }), [push, dismiss])

  return (
    <AlertContext.Provider value={value}>
      {children}

      <div className="ed-alerts" role="region" aria-label={t('alerts.region')}>
        {alerts.map((alert) => {
          const Icon = ICONS[alert.variant]

          return (
            <div
              key={alert.id}
              className={`ed-alert ed-alert--${alert.variant}`}
              role={alert.variant === 'error' ? 'alert' : 'status'}
              aria-live={alert.variant === 'error' ? 'assertive' : 'polite'}
            >
              <div className="ed-alert__cabecera">
                <Icon className="ed-alert__icon" aria-hidden="true" />
                <span className="ed-alert__titulo">{t(`alerts.variants.${alert.variant}.title`)}</span>

                <button
                  type="button"
                  onClick={() => dismiss(alert.id)}
                  className="ed-alert__cerrar"
                  aria-label={t('alerts.dismiss')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="ed-alert__subtitulo">{t(`alerts.variants.${alert.variant}.subtitle`)}</p>
              <p className="ed-alert__mensaje">{alert.message}</p>

              <div className="ed-alert__pie">
                <time className="ed-alert__fecha" dateTime={alert.timestamp}>
                  {alert.timestamp}
                </time>

                {alert.actions.length > 0 && (
                  <div className="ed-alert__acciones">
                    {alert.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          dismiss(alert.id)
                          action.onClick?.()
                        }}
                        className={`ed-alert__accion${action.emphasis === true ? ' ed-alert__accion--fuerte' : ''}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AlertContext.Provider>
  )
}