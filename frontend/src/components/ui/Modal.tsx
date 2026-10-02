import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Base modal of the EduSense UI kit: overlay, close on backdrop/Escape and a
 * panel with a header. The content is owned by the page that uses it.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  size?: 'md' | 'lg' | 'xl' | 'wide'
  children: ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="ed-modal__overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ed-modal__fondo" onClick={onClose} aria-hidden="true" />

      <div className={`ed-modal__panel ed-modal__panel--${size}`}>
        <div className="ed-modal__header">
          <div className="ed-modal__head">
            <h2 className="ed-modal__title">{title}</h2>
            {subtitle !== undefined && (
              <p className="ed-modal__subtitle">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="ed-modal__close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="ed-modal__body">{children}</div>
      </div>
    </div>
  )
}