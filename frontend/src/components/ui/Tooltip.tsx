import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Tooltip of the EduSense UI kit: dark-blue rectangular bubble with an angular
 * arrow on its bottom-left edge pointing to its child. It is positioned with
 * `position: fixed` (measuring the button that wraps it) so it can never be
 * clipped by overflowing containers such as tables or modal scroll bodies. It
 * shows on hover and keyboard focus.
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */

interface TooltipProps {
  label: string
  children: ReactNode
}

interface Coords {
  top: number
  left: number
}

export default function Tooltip({ label, children }: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<Coords | null>(null)

  const show = (): void => {
    const rect = wrapRef.current?.getBoundingClientRect()

    if (rect === undefined) {
      setCoords(null)

      return
    }

    setCoords({ top: rect.top, left: rect.left })
  }

  const hide = (): void => {
    setCoords(null)
  }

  return (
    <span
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="ed-tooltip"
    >
      {children}
      {coords !== null && (
        <span
          className="ed-tooltip__burbuja"
          role="tooltip"
          style={{ top: coords.top, left: coords.left }}
        >
          {label}
        </span>
      )}
    </span>
  )
}