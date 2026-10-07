import { useEffect } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/shared/utils/scrollLock'

/**
 * Base modal of the EduSense UI kit: overlay, close on backdrop/Escape and a
 * panel with a header, body and optional footer. When `as="form"` the whole
 * panel becomes a form so submit buttons in the footer work as expected.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  size?: 'md' | 'lg' | 'xl' | 'wide' | 'fullscreen'
  children: ReactNode
  footer?: ReactNode
  as?: 'div' | 'form'
  onSubmit?: (event: FormEvent) => void
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  as = 'div',
  onSubmit,
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
    lockScroll()

    return () => {
      window.removeEventListener('keydown', handleEscape)
      unlockScroll()
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const Panel = as

  return (
    <div
      className={`ed-modal__overlay${size === 'fullscreen' ? ' ed-modal__overlay--fullscreen' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="ed-modal__fondo" onClick={onClose} aria-hidden="true" />

      <Panel
        className={`ed-modal__panel ed-modal__panel--${size}`}
        onSubmit={as === 'form' ? onSubmit : undefined}
      >
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

        {footer != null && <div className="ed-modal__footer">{footer}</div>}
      </Panel>
    </div>
  )
}