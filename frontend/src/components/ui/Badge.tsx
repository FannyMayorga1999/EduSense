import type { HTMLAttributes } from 'react'

/**
 * Etiqueta de estado del kit UI de EduSense.
 *
 * @author Fanny Mayorga
 */

type Tono = 'teal' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'stone'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: Tono
}

const TONOS: Record<Tono, string> = {
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
  stone: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200',
}

export default function Badge({ tono = 'stone', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONOS[tono]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}