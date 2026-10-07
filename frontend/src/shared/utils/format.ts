/**
 * Pure formatting helpers shared across the app.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

/**
 * Returns the date-only fragment (YYYY-MM-DD) of an ISO date, or an em dash
 * when the value is empty.
 */
export function formatDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return value.slice(0, 10)
}

/**
 * Localised date and time of a timestamp, used by the alert queue header.
 */
export function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}