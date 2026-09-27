import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Side panel (drawer) of the EduSense UI kit: fixed overlay on the right,
 * close on backdrop/Escape and a full-height panel with a header (title +
 * optional actions), a scrollable body and an optional sticky footer.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export default function SidePanel({
  open,
  onClose,
  title,
  closeLabel = 'Close',
  actions,
  footer,
  children,
}: SidePanelProps) {
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
    <div className="ed-panel__overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ed-panel__fondo" onClick={onClose} aria-hidden="true" />

      <div className="ed-panel__marco">
        <div className="ed-panel__header">
          <h2 className="ed-panel__title">{title}</h2>

          {actions !== undefined && <div className="ed-panel__acciones">{actions}</div>}

          <button
            type="button"
            onClick={onClose}
            title={closeLabel}
            aria-label={closeLabel}
            className="ed-panel__close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="ed-panel__body">{children}</div>

        {footer !== undefined && <div className="ed-panel__footer">{footer}</div>}
      </div>
    </div>
  )
}