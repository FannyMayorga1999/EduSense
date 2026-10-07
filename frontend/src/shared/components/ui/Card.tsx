import type { HTMLAttributes } from 'react'

/**
 * Tarjeta base del kit UI de EduSense.
 *
 * @author Fanny Mayorga
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', ...props }: CardProps) {
  return <div className={`ed-card ${className}`} {...props} />
}