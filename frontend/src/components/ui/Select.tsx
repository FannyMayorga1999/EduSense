import type { SelectHTMLAttributes } from 'react'

/**
 * Selector (select/option) base del kit UI de EduSense, con el mismo estilo
 * que `Input`.
 *
 * @author Fanny Mayorga
 */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const CLASE_BASE =
  'w-full appearance-none rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-stone-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white'

export default function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={`${CLASE_BASE} ${className}`} {...props}>
      {children}
    </select>
  )
}