import { createContext, useContext } from 'react'

/**
 * Alert queue contract. It lives outside the provider component so the hook
 * can be imported on its own, keeping fast refresh working on the provider.
 *
 * @author Fanny Mayorga
 * @date   02-10-2026
 */

/**
 * The four supported alert outcomes. Each one carries its own title, icon,
 * palette and default actions, so a caller only supplies the message.
 */
export type AlertVariant = 'info-needed' | 'completed' | 'context-updated' | 'error'

export interface AlertAction {
  /** Visible label of the button. */
  label: string
  /** Runs on click. Defaults to dismissing the alert. */
  onClick?: () => void
  /** Renders as the emphasised action of the pair. */
  emphasis?: boolean
}

export interface AlertOptions {
  variant?: AlertVariant
  /** Milliseconds the alert stays visible. Defaults to 6000. */
  duration?: number
  /** Replaces the default action pair of the variant. */
  actions?: AlertAction[]
  /** Keeps the alert on screen until it is dismissed. */
  sticky?: boolean
}

export interface AlertItem {
  id: number
  variant: AlertVariant
  /** Dynamic body explaining what happened. */
  message: string
  /** Formatted date and time the alert was raised. */
  timestamp: string
  actions: AlertAction[]
  duration: number
  sticky: boolean
}

export interface AlertContextValue {
  push: (message: string, options?: AlertOptions) => void
  dismiss: (id: number) => void
}

export const AlertContext = createContext<AlertContextValue | undefined>(undefined)

/**
 * Access to the alert queue. Must be used inside an `AlertProvider`.
 */
export function useAlert(): AlertContextValue {
  const context = useContext(AlertContext)

  if (context === undefined) {
    throw new Error('useAlert must be used inside an AlertProvider.')
  }

  return context
}