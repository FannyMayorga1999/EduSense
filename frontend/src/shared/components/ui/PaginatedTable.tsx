import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Paginator } from '@/types'
import Pagination from '@/shared/components/ui/Pagination'

/**
 * Global paginated table of the EduSense UI kit: wraps the card, the toolbar
 * (filters/actions), the configured columns, the loading skeletons, the empty
 * message and the pagination footer. Any listing only needs to configure
 * columns and the `usePagination` state.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

export interface TableColumn<T> {
  key: string
  header: ReactNode
  render?: (row: T) => ReactNode
}

interface PaginatedTableProps<T> {
  data: Paginator<T> | null
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  onChange: (page: number) => void
  limit: number
  onChangeLimit: (limit: number) => void
  total: number
  from: number | null
  to: number | null
  columns: TableColumn<T>[]
  getRowKey: (row: T) => number | string
  toolbar?: ReactNode
  loadingRows?: number
  emptyMessage: string
  /**
   * Content rendered in a full width row right below the given row. Enabling
   * it makes every row toggleable, so callers can drill into an entity without
   * leaving the listing (keyboard and screen reader friendly).
   */
  renderExpanded?: (row: T) => ReactNode
  isRowExpanded?: (row: T) => boolean
  onToggleRow?: (row: T) => void
  expandLabel?: string
  collapseLabel?: string
}

export default function PaginatedTable<T>({
  data,
  loading,
  error,
  page,
  totalPages,
  onChange,
  limit,
  onChangeLimit,
  total,
  from,
  to,
  columns,
  getRowKey,
  toolbar,
  loadingRows = 5,
  emptyMessage,
  renderExpanded,
  isRowExpanded,
  onToggleRow,
  expandLabel = 'Expand row',
  collapseLabel = 'Collapse row',
}: PaginatedTableProps<T>) {
  const expandable = renderExpanded !== undefined && onToggleRow !== undefined

  return (
    <>
      {error !== null && <div className="ed-banner ed-banner--error">{error}</div>}

      <div className="ed-card">
        {toolbar !== undefined && <div className="ed-toolbar">{toolbar}</div>}

        <div className="overflow-x-auto">
          <table className="ed-table">
            <thead className="ed-table__thead">
              <tr>
                {expandable && (
                  <th scope="col" className="ed-table__th ed-table__th--toggle">
                    <span className="sr-only">Details</span>
                  </th>
                )}

                {columns.map((column) => (
                  <th key={column.key} scope="col" className="ed-table__th">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: loadingRows }).map((_, index) => (
                  <tr key={index}>
                    {expandable && (
                      <td className="ed-cargando">
                        <div className="ed-skeleton" />
                      </td>
                    )}

                    {columns.map((_, cell) => (
                      <td key={cell} className="ed-cargando">
                        <div className="ed-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.data.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={columns.length + (expandable ? 1 : 0)} className="ed-vacio">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((row) => {
                  const key = getRowKey(row)
                  const expanded = expandable && (isRowExpanded?.(row) ?? false)

                  const toggle = (event: React.MouseEvent<HTMLElement>): void => {
                    // Row clicks are a convenience: never hijack a real control.
                    if (
                      (event.target as HTMLElement).closest(
                        'button, a, input, select, textarea, label',
                      ) !== null
                    ) {
                      return
                    }

                    onToggleRow?.(row)
                  }

                  return (
                    <Fragment key={key}>
                      <tr
                        className={
                          expandable
                            ? `ed-table__row ed-table__row--expandable${expanded ? ' ed-table__row--expandida' : ''}`
                            : 'ed-table__row'
                        }
                        aria-expanded={expandable ? expanded : undefined}
                        onClick={expandable ? toggle : undefined}
                      >
                        {expandable && (
                          <td className="ed-table__td ed-table__td--toggle">
                            <button
                              type="button"
                              onClick={() => onToggleRow?.(row)}
                              aria-expanded={expanded}
                              aria-label={expanded ? collapseLabel : expandLabel}
                              title={expanded ? collapseLabel : expandLabel}
                              className="ed-table__toggle"
                            >
                              <ChevronDown
                                className={`ed-table__toggle-icon${expanded ? ' ed-table__toggle-icon--abierta' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        )}

                        {columns.map((column) => (
                          <td key={column.key} className="ed-table__td">
                            {column.render
                              ? column.render(row)
                              : ((row as Record<string, ReactNode>)[column.key] ?? null)}
                          </td>
                        ))}
                      </tr>

                      {expanded && renderExpanded !== undefined && (
                        <tr className="ed-table__detalle">
                          <td
                            colSpan={columns.length + (expandable ? 1 : 0)}
                            className="ed-table__detalle-celda"
                          >
                            {renderExpanded(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={onChange}
          limit={limit}
          onChangeLimit={onChangeLimit}
          total={total}
          from={from}
          to={to}
        />
      </div>
    </>
  )
}