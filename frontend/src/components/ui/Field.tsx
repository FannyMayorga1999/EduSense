import type { ReactNode } from 'react'

/**
 * Envoltorio de campo con etiqueta, ayuda y mensaje de error del kit UI.
 *
 * @author Fanny Mayorga
 */

interface FieldProps {
  etiqueta: string
  htmlPara?: string
  error?: string | null
  ayuda?: string
  children: ReactNode
}

export default function Field({ etiqueta, htmlPara, error, ayuda, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlPara} className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        {etiqueta}
      </label>
      {children}
      {ayuda !== undefined && error === null && (
        <p className="text-xs text-stone-500 dark:text-stone-400">{ayuda}</p>
      )}
      {error !== null && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  )
}