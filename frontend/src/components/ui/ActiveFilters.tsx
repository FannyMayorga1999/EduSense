import { X } from 'lucide-react'

/**
 * Generic bar of applied filters of the EduSense UI kit: renders one chip per
 * active value with a label and a remove button; clicking a chip calls
 * `onRemove` so the caller re-queries. Hidden when there are no filters.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

export interface ActiveFilter {
  key: string
  label: string
}

interface ActiveFiltersProps {
  filters: ActiveFilter[]
  onRemove: (key: string) => void
  onClearAll: () => void
  title?: string
  clearAllLabel?: string
  removeLabel?: string
}

export default function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  title = '',
  clearAllLabel = '',
  removeLabel = '',
}: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null
  }

  return (
    <div className="ed-filtros-activos">
      {title !== '' && <span className="ed-filtros-activos__titulo">{title}</span>}

      <div className="ed-filtros-activos__chips">
        {filters.map((filter) => (
          <span key={filter.key} className="ed-chip">
            {filter.label}
            <button
              type="button"
              onClick={() => onRemove(filter.key)}
              aria-label={removeLabel}
              className="ed-chip__x"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <button type="button" onClick={onClearAll} className="ed-filtros-activos__limpiar">
        {clearAllLabel}
      </button>
    </div>
  )
}