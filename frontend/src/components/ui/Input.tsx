import type { InputHTMLAttributes } from 'react'

/**
 * Campo de texto base del kit UI de EduSense.
 *
 * @author Fanny Mayorga
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const CLASE_BASE =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:placeholder-stone-500'

export default function Input({ className = '', ...props }: InputProps) {
  return <input className={`${CLASE_BASE} ${className}`} {...props} />
}