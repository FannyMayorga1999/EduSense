/**
 * Translates a failed HTTP response into an actionable message. A single
 * "something went wrong" string hides the most common causes (an expired
 * session, a missing permission or a rate limit), so each status maps to the
 * i18n key that tells the user what to do next.
 *
 * @author Fanny Mayorga
 * @date   02-10-2026
 */

type Translate = (key: string, options?: Record<string, unknown>) => string

export function errorMessageForStatus(status: number | null, t: Translate): string {
  switch (status) {
    case 401:
      return t('students.messages.error_unauthenticated')
    case 403:
      return t('students.messages.error_forbidden')
    case 419:
      return t('students.messages.error_expired')
    case 422:
      return t('students.messages.error_validation')
    case 429:
      return t('students.messages.error_rate_limit')
    case null:
      return t('students.messages.error_network')
    default:
      return status >= 500 ? t('students.messages.error_server') : t('students.messages.error_generic')
  }
}
