import type { SelectHTMLAttributes } from 'react'

/**
 * Selector (select/option) base del kit UI de EduSense, con el mismo estilo
 * que `Input`.
 *
 * @author Fanny Mayorga
 */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export default function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={`ed-select ${className}`} {...props}>
      {children}
    </select>
  )
}