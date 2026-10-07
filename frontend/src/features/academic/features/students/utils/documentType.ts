export type DocumentTone = 'teal' | 'violet' | 'amber' | 'stone'

/**
 * Badge tone assigned to each document type so the student identification
 * reads with color everywhere it is shown (1:1 with the Badge UI kit).
 * Cédula = teal, Pasaporte = violet, DNI = amber; unknown falls back to teal.
 *
 * @author Fanny Mayorga | @date 28-09-2026
 */
export function documentTypeTone(type: string): DocumentTone {
  if (type === 'pasaporte') {
    return 'violet'
  }

  if (type === 'dni') {
    return 'amber'
  }

  return 'teal'
}