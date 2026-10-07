import type { StatusTone } from '@/shared/components/ui/StatusBadge'

/**
 * Maps the academic status of a student together with its logical state to the
 * visual presentation of the status badge. Kept free of i18n so the caller
 * resolves the label key with its own `t` function.
 *
 * @author Fanny Mayorga
 * @date   02-10-2026
 */

export interface AcademicStatusView {
  tone: StatusTone
  labelKey: string
}

/**
 * Resolves the badge tone and label key of a student status.
 *
 * A logically deleted student always reads as "inactive" regardless of the
 * academic status stored on the record.
 */
export function academicStatusView(academicStatus: string, isActive: boolean): AcademicStatusView {
  if (!isActive) {
    return { tone: 'stone', labelKey: 'students.form.academic_status_inactive' }
  }

  switch (academicStatus) {
    case 'graduated':
      return { tone: 'sky', labelKey: 'students.form.academic_status_graduated' }
    case 'retired':
      return { tone: 'amber', labelKey: 'students.form.academic_status_retired' }
    default:
      return { tone: 'emerald', labelKey: 'students.form.academic_status_active' }
  }
}
