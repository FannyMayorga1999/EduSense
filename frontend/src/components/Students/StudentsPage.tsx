import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileSpreadsheet, Pencil, Plus, Search, Upload, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import {
  deactivateStudent,
  exportStudents,
  fetchCourses,
  fetchStudents,
  updateStudent,
} from '../../api'
import type { AcademicResource, StudentListItem } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import PaginatedTable from '../ui/PaginatedTable'
import usePagination from '../../hooks/usePagination'
import StudentFormModal from './StudentFormModal'
import StudentImportModal from './StudentImportModal'

/**
 * Students module page: filtered listing (search, status and grade), CRUD by
 * modal, bulk CSV upload and CSV/XLSX download. Actions are shown according to
 * the permissions of the authenticated user.
 *
 * @author Fanny Mayorga
 */

function AcademicStatusBadge({
  status,
  active,
  t,
}: {
  status: string
  active: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  if (!active) {
    return <Badge tone="stone">{t('students.form.academic_status_inactive')}</Badge>
  }

  if (status === 'graduated') {
    return <Badge tone="sky">{t('students.form.academic_status_graduated')}</Badge>
  }

  if (status === 'retired') {
    return <Badge tone="amber">{t('students.form.academic_status_retired')}</Badge>
  }

  return <Badge tone="emerald">{t('students.form.academic_status_active')}</Badge>
}

export default function StudentsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const isAdmin = user?.roles.includes('administrator') ?? false
  const can = (permission: string): boolean =>
    isAdmin || (user?.permissions ?? []).includes(permission)

  const canCreate = can('create_students')
  const canEdit = can('edit_students')
  const canDelete = can('delete_students')
  const canImport = can('import_students')
  const canExport = can('export_students')
  const canViewCourses = can('view_courses')

  const [search, setSearch] = useState<string>('')
  const [appliedSearch, setAppliedSearch] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [grade, setGrade] = useState<string>('')
  const [courses, setCourses] = useState<AcademicResource[]>([])

  const { data, loading, error, page, totalPages, limit, total, from, to, goToPage, changeLimit, reload } =
    usePagination<StudentListItem>({
      errorMessage: t('students.messages.load_error'),
      fetch: (p, perPage) =>
        fetchStudents({
          page: p,
          per_page: perPage,
          search: appliedSearch === '' ? undefined : appliedSearch,
          is_active: status === '' ? undefined : status,
          grade: grade === '' ? undefined : grade,
        }),
      deps: [status, grade, appliedSearch],
    })

  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<StudentListItem | null>(null)
  const [importOpen, setImportOpen] = useState<boolean>(false)
  const [confirming, setConfirming] = useState<boolean>(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'deactivate' | 'reactivate'
    student: StudentListItem
  } | null>(null)
  const [banner, setBanner] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => goToPage(1), 50)
    const debounced = window.setTimeout(() => setAppliedSearch(search.trim()), 400)

    return () => {
      window.clearTimeout(timeout)
      window.clearTimeout(debounced)
    }
  }, [search, goToPage])

  useEffect(() => {
    if (!canViewCourses) {
      return
    }

    fetchCourses().then(setCourses).catch(() => setCourses([]))
  }, [canViewCourses])

  useEffect(() => {
    if (banner === null) {
      return
    }

    const id = window.setTimeout(() => setBanner(null), 5000)

    return () => window.clearTimeout(id)
  }, [banner])

  const openNew = useCallback((): void => {
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((student: StudentListItem): void => {
    setEditing(student)
    setFormOpen(true)
  }, [])

  const handleSaved = useCallback(
    (message: string): void => {
      setFormOpen(false)
      setEditing(null)
      setBanner({ type: 'ok', text: message })
      reload()
    },
    [reload],
  )

  const handleImported = useCallback((): void => {
    reload()
  }, [reload])

  const exportList = useCallback(
    async (format: 'csv' | 'xlsx'): Promise<void> => {
      try {
        await exportStudents(
          {
            search: appliedSearch === '' ? undefined : appliedSearch,
            is_active: status === '' ? undefined : status,
            grade: grade === '' ? undefined : grade,
          },
          format,
        )
      } catch {
        setBanner({ type: 'error', text: t('students.messages.export_error') })
      }
    },
    [appliedSearch, status, grade, t],
  )

  const confirmAction = async (): Promise<void> => {
    if (pendingAction === null) {
      return
    }

    const { type, student } = pendingAction

    setConfirming(true)

    try {
      if (type === 'deactivate') {
        await deactivateStudent(student.id)
        setBanner({ type: 'ok', text: t('students.messages.deactivated') })
      } else {
        await updateStudent(student.id, {
          first_name: student.first_name,
          last_name: student.last_name,
          document_number: student.document_number ?? '',
          birth_date: student.birth_date ?? '',
          is_active: true,
        })
        setBanner({ type: 'ok', text: t('students.messages.reactivated') })
      }

      setPendingAction(null)
      reload()
    } catch {
      setBanner({ type: 'error', text: t('students.messages.error_generic') })
      setPendingAction(null)
    } finally {
      setConfirming(false)
    }
  }

  const columns = [
    {
      key: 'document',
      header: t('students.table.document'),
      render: (student: StudentListItem) => <>{student.document_number ?? '—'}</>,
    },
    {
      key: 'full_name',
      header: t('students.table.full_name'),
      render: (student: StudentListItem) => (
        <span className="ed-table__resalto">{student.full_name}</span>
      ),
    },
    {
      key: 'grade',
      header: t('students.table.grade'),
      render: (student: StudentListItem) => <>{student.enrollments[0]?.course?.name ?? '—'}</>,
    },
    {
      key: 'birth_date',
      header: t('students.table.birth_date'),
      render: (student: StudentListItem) => <>{student.birth_date?.slice(0, 10) ?? '—'}</>,
    },
    {
      key: 'status',
      header: t('students.table.status'),
      render: (student: StudentListItem) => (
        <AcademicStatusBadge status={student.academic_status} t={t} active={student.is_active} />
      ),
    },
    {
      key: 'actions',
      header: t('students.table.actions'),
      render: (student: StudentListItem) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => openEdit(student)}
              title={t('students.actions.edit')}
              aria-label={t('students.actions.edit')}
              className="ed-item-accion"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {student.is_active && canDelete && (
            <button
              type="button"
              onClick={() => setPendingAction({ type: 'deactivate', student })}
              title={t('students.actions.deactivate')}
              aria-label={t('students.actions.deactivate')}
              className="ed-item-accion ed-item-accion--peligro"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}

          {!student.is_active && canEdit && (
            <button
              type="button"
              onClick={() => setPendingAction({ type: 'reactivate', student })}
              title={t('students.actions.reactivate')}
              aria-label={t('students.actions.reactivate')}
              className="ed-item-accion ed-item-accion--ok"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="mod-students space-y-6" aria-label={t('students.title')}>
      <div>
        <h1 className="ed-page__title">{t('students.title')}</h1>
        <p className="ed-page__subtitle">{t('students.subtitle')}</p>
      </div>

      {banner !== null && (
        <div role="status" aria-live="polite" className={`ed-banner ed-banner--${banner.type}`}>
          {banner.text}
        </div>
      )}

      <PaginatedTable
        data={data}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        onChange={goToPage}
        limit={limit}
        onChangeLimit={changeLimit}
        total={total}
        from={from}
        to={to}
        getRowKey={(student) => student.id}
        emptyMessage={t('students.table.empty')}
        columns={columns}
        toolbar={
          <>
            <div className="ed-toolbar__filtros">
              <div className="ed-toolbar__busqueda">
                <Search className="ed-toolbar__icono" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('students.search_placeholder')}
                  className="pl-9"
                  aria-label={t('students.search_placeholder')}
                />
              </div>

              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="sm:w-40"
                aria-label={t('students.filter_status')}
              >
                <option value="">{t('students.status_all')}</option>
                <option value="1">{t('students.status_active')}</option>
                <option value="0">{t('students.status_inactive')}</option>
              </Select>

              {canViewCourses && courses.length > 0 && (
                <Select
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  className="sm:w-48"
                  aria-label={t('students.filter_grade')}
                >
                  <option value="">{t('students.grade_all')}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="ed-toolbar__acciones">
              {canExport && (
                <>
                  <Button
                    variant="secondary"
                    iconOnly
                    onClick={() => void exportList('csv')}
                    title={t('students.download_csv')}
                    aria-label={t('students.download_csv')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    iconOnly
                    onClick={() => void exportList('xlsx')}
                    title={t('students.download_xlsx')}
                    aria-label={t('students.download_xlsx')}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </>
              )}

              {canImport && (
                <Button
                  variant="secondary"
                  iconOnly
                  onClick={() => setImportOpen(true)}
                  title={t('students.upload')}
                  aria-label={t('students.upload')}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}

              {canCreate && (
                <Button iconOnly onClick={openNew} title={t('students.new')} aria-label={t('students.new')}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        }
      />

      <StudentFormModal
        open={formOpen}
        student={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={handleSaved}
      />

      <StudentImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />

      <Modal
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={t(
          pendingAction?.type === 'deactivate'
            ? 'students.confirm.deactivate_title'
            : 'students.confirm.reactivate_title',
        )}
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t(
              pendingAction?.type === 'deactivate'
                ? 'students.confirm.deactivate_message'
                : 'students.confirm.reactivate_message',
              { name: pendingAction?.student.full_name ?? '' },
            )}
          </p>

          <div className="ed-acciones ed-acciones--simple">
            <Button variant="secondary" onClick={() => setPendingAction(null)}>
              {t('students.confirm.cancel')}
            </Button>
            <Button
              variant={pendingAction?.type === 'deactivate' ? 'danger' : 'primary'}
              loading={confirming}
              onClick={() => void confirmAction()}
            >
              {confirming ? t('students.confirm.executing') : t('students.confirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}