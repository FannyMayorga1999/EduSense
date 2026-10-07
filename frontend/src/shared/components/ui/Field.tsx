import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

/**
 * Field wrapper with label, help tooltip, hint and error message of the UI kit.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: string
  help?: string
  children: ReactNode
}

function HelpTip({ text, label }: { text: string; label: string }) {
  return (
    <span className="ed-field__help">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className="ed-field__help-btn"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span className="ed-field__tooltip" role="tooltip">
        {text}
      </span>
    </span>
  )
}

export default function Field({ label, htmlFor, error, hint, help, children }: FieldProps) {
  return (
    <div className="ed-field">
      <div className="ed-field__head">
        <label htmlFor={htmlFor} className="ed-field__label">
          {label}
        </label>
        {help !== undefined && <HelpTip text={help} label={label} />}
      </div>
      {children}
      {hint !== undefined && error === undefined && (
        <p className="ed-field__ayuda">{hint}</p>
      )}
      {error !== undefined && error !== null && (
        <p className="ed-field__error">{error}</p>
      )}
    </div>
  )
}