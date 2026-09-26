import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'
import Select from './Select'

/**
 * Reusable table footer of the UI kit: records-per-page selector, visible
 * range label ("1–25 of 130") and numbered navigation with a window and
 * ellipsis. Centralizes the pagination translations.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  limit: number
  onChangeLimit: (limit: number) => void
  total: number
  from: number | null
  to: number | null
}

const LIMIT_OPTIONS = [10, 25, 50, 100]

function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) {
    pages.push('…')
  }

  for (let current = start; current <= end; current += 1) {
    pages.push(current)
  }

  if (end < totalPages - 1) {
    pages.push('…')
  }

  pages.push(totalPages)

  return pages
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  limit,
  onChangeLimit,
  total,
  from,
  to,
}: PaginationProps) {
  const { t } = useTranslation()

  if (total === 0) {
    return null
  }

  return (
    <div className="ed-pagination">
      <div className="ed-pagination__tamano">
        <span className="ed-pagination__label">{t('pagination.per_page')}</span>
        <Select
          className="ed-pagination__select"
          value={limit}
          onChange={(event) => onChangeLimit(Number(event.target.value))}
          aria-label={t('pagination.per_page')}
        >
          {LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <p className="ed-pagination__rango">
        {t('pagination.range', { from: from ?? 0, to: to ?? 0, total })}
      </p>

      {totalPages > 1 && (
        <nav className="ed-pagination__navegacion" aria-label={t('pagination.navigation')}>
          <Button
            variant="secondary"
            iconOnly
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            aria-label={t('pagination.previous')}
            title={t('pagination.previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="ed-pagination__numeros">
            {pageWindow(page, totalPages).map((item, index) =>
              item === '…' ? (
                <span key={`punto-${index}`} className="ed-pagination__punto">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={t('pagination.page', { numero: item })}
                  className={`ed-pagination__pagina ${
                    item === page
                      ? 'ed-pagination__pagina--activo'
                      : 'ed-pagination__pagina--inactivo'
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <Button
            variant="secondary"
            iconOnly
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            aria-label={t('pagination.next')}
            title={t('pagination.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  )
}