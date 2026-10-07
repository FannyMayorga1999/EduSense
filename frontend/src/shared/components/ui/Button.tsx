import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Base button of the EduSense UI kit.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconOnly?: boolean
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  loading = false,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeClass = iconOnly ? 'ed-btn--icon' : `ed-btn--${size}`
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`ed-btn ed-btn--${variant} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}