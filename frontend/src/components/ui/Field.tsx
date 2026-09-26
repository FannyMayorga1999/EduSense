import type { ReactNode } from 'react'

/**
 * Field wrapper with label, hint and error message of the UI kit.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: string
  children: ReactNode
}

export default function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="ed-field">
      <label htmlFor={htmlFor} className="ed-field__label">
        {label}
      </label>
      {children}
      {hint !== undefined && error === null && <p className="ed-field__ayuda">{hint}</p>}
      {error !== null && <p className="ed-field__error">{error}</p>}
    </div>
  )
}