import Badge from '@/shared/components/ui/Badge'

/**
 * Status badge of the EduSense UI kit: a `Badge` with a colored dot that makes
 * the state readable at a glance in dense tables and detail panels.
 *
 * @author Fanny Mayorga
 * @date   02-10-2026
 */

export type StatusTone = 'teal' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'stone'

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
  dot?: boolean
  title?: string
  className?: string
}

const DOT_TONE: Record<StatusTone, string> = {
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  stone: 'bg-stone-400',
}

export default function StatusBadge({
  label,
  tone = 'stone',
  dot = true,
  title,
  className = '',
}: StatusBadgeProps) {
  return (
    <Badge tone={tone} title={title} className={`ed-status-badge ${className}`.trim()}>
      {dot && <span aria-hidden="true" className={`ed-status-badge__dot ${DOT_TONE[tone]}`} />}
      {label}
    </Badge>
  )
}
