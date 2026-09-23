import type { HTMLAttributes } from 'react'

/**
 * Tarjeta base del kit UI de EduSense.
 *
 * @author Fanny Mayorga
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800 ${className}`}
      {...props}
    />
  )
}