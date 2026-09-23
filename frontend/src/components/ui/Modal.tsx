import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Modal base del kit UI de EduSense: overlay, cierre por fondo/Escape y panel
 * con cabecera. El contenido queda a cargo de la página que lo usa.
 *
 * @author Fanny Mayorga
 */

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
}

export default function Modal({ abierto, onCerrar, titulo, children }: ModalProps) {
  useEffect(() => {
    if (!abierto) {
      return
    }

    const manejarEscape = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        onCerrar()
      }
    }

    window.addEventListener('keydown', manejarEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', manejarEscape)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCerrar} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-700">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            title="Cerrar"
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}