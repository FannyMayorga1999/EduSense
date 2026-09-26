import type { HTMLAttributes } from 'react'

/**
 * Status label of the EduSense UI kit.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

type Tone = 'teal' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'stone'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export default function Badge({ tone = 'stone', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`ed-badge ed-badge--${tone} ${className}`} {...props}>
      {children}
    </span>
  )
}