import type { ReactNode } from 'react'
import type { Paginator } from '../../types'
import Pagination from './Pagination'

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
  header: string
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
}: PaginatedTableProps<T>) {
  return (
    <>
      {error !== null && <div className="ed-banner ed-banner--error">{error}</div>}

      <div className="ed-card">
        {toolbar !== undefined && <div className="ed-toolbar">{toolbar}</div>}

        <div className="overflow-x-auto">
          <table className="ed-table">
            <thead className="ed-table__thead">
              <tr>
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
                    {columns.map((_, cell) => (
                      <td key={cell} className="ed-cargando">
                        <div className="ed-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.data.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="ed-vacio">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((row) => (
                  <tr key={getRowKey(row)} className="ed-table__row">
                    {columns.map((column) => (
                      <td key={column.key} className="ed-table__td">
                        {column.render
                          ? column.render(row)
                          : ((row as Record<string, ReactNode>)[column.key] ?? null)}
                      </td>
                    ))}
                  </tr>
                ))
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