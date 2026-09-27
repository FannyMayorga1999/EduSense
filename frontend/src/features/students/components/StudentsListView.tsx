import { useTranslation } from 'react-i18next'
import { Download, Eye, FileSpreadsheet, Pencil, Plus, Search, Upload, UserCheck, UserX } from 'lucide-react'
import type { useStudents } from '@/features/students/hooks/useStudents'
import StudentFormModal from '@/features/students/components/StudentFormModal'
import StudentImportModal from '@/features/students/components/StudentImportModal'
import StudentDetailPanel from '@/features/students/components/StudentDetailPanel'
import { formatDate } from '@/utils/format'
import type { StudentListItem } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import MultiSelect from '@/components/ui/MultiSelect'
import ActiveFilters from '@/components/ui/ActiveFilters'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PaginatedTable from '@/components/ui/PaginatedTable'

/**
 * Students module view: filtered listing (search, status and grade), CRUD by
 * modal, bulk CSV upload and CSV/XLSX download. All the state comes from the
 * `useStudents` hook; here only the presentation is rendered.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

type StudentsListViewProps = ReturnType<typeof useStudents>

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

export default function StudentsListView(props: StudentsListViewProps) {
  const { t } = useTranslation()

  const {
    canEdit,
    canDelete,
    canImport,
    canExport,
    canViewCourses,
    search,
    setSearch,
    status,
    setStatus,
    grade,
    setGrade,
    courses,
    activeFilters,
    removeFilter,
    clearFilters,
    data,
    loading,
    error,
    page,
    totalPages,
    limit,
    total,
    from,
    to,
    goToPage,
    changeLimit,
    formOpen,
    openNew,
    openEdit,
    closeForm,
    handleSaved,
    panelStudent,
    panelMode,
    refreshKey,
    openView,
    closePanel,
    backToView,
    handlePanelSaved,
    importOpen,
    openImport,
    closeImport,
    handleImported,
    pendingAction,
    requestDeactivate,
    requestReactivate,
    cancelAction,
    confirming,
    confirmAction,
    banner,
    exportList,
  } = props

  const backToEdit = (): void => {
    if (panelStudent !== null) {
      openEdit(panelStudent)
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
        <button
          type="button"
          onClick={() => openView(student)}
          title={t('students.actions.view')}
          aria-label={t('students.actions.view')}
          className="ed-table__resalto text-left transition hover:text-primary-600 hover:underline"
        >
          {student.full_name}
        </button>
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
      render: (student: StudentListItem) => <>{formatDate(student.birth_date)}</>,
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
          <button
            type="button"
            onClick={() => openView(student)}
            title={t('students.actions.view')}
            aria-label={t('students.actions.view')}
            className="ed-item-accion"
          >
            <Eye className="h-4 w-4" />
          </button>

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
              onClick={() => requestDeactivate(student)}
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
              onClick={() => requestReactivate(student)}
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
      <div className="ed-page__encabezado">
        <div>
          <h1 className="ed-page__title">{t('students.title')}</h1>
          <p className="ed-page__subtitle">{t('students.subtitle')}</p>
        </div>

        {props.canCreate && (
          <Button variant="primary" onClick={openNew} className="ed-btn--ancho">
            <Plus className="h-4 w-4" />
            {t('students.new')}
          </Button>
        )}
      </div>

      {banner !== null && (
        <div role="status" aria-live="polite" className={`ed-banner ed-banner--${banner.type}`}>
          {banner.text}
        </div>
      )}

      <section className="ed-panel ed-panel--filtros" aria-label={t('students.title')}>
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

          <MultiSelect
            options={[
              { value: '1', label: t('students.status_active') },
              { value: '0', label: t('students.status_inactive') },
            ]}
            value={status}
            onChange={setStatus}
            placeholder={t('students.status_all')}
            countText={(count) => t('students.selected_count', { count })}
            clearAllLabel={t('students.clear_all')}
            ariaLabel={t('students.filter_status')}
            className="sm:w-44"
          />

          {canViewCourses && courses.length > 0 && (
            <MultiSelect
              options={courses.map((course) => ({ value: course.name, label: course.name }))}
              value={grade}
              onChange={setGrade}
              placeholder={t('students.grade_all')}
              countText={(count) => t('students.selected_count', { count })}
              clearAllLabel={t('students.clear_all')}
              ariaLabel={t('students.filter_grade')}
              className="sm:w-52"
            />
          )}
        </div>
      </section>

      <section aria-label={t('students.filters_active')}>
        <ActiveFilters
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={clearFilters}
          title={t('students.filters_active')}
          clearAllLabel={t('students.clear_all')}
          removeLabel={t('students.remove_filter')}
        />
      </section>

      <section aria-label={t('students.title')}>
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
            <div className="sm:flex sm:justify-end">
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
                    onClick={openImport}
                    title={t('students.upload')}
                    aria-label={t('students.upload')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          }
        />
      </section>

      <StudentFormModal
        open={formOpen}
        student={null}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <StudentDetailPanel
        open={panelStudent !== null}
        student={panelStudent}
        mode={panelMode}
        canEdit={canEdit}
        canDelete={canDelete}
        refreshKey={refreshKey}
        onClose={closePanel}
        onEdit={backToEdit}
        onCancelEdit={backToView}
        onSavedEdit={handlePanelSaved}
        onDeactivate={requestDeactivate}
        onReactivate={requestReactivate}
      />

      <StudentImportModal
        open={importOpen}
        onClose={closeImport}
        onImported={handleImported}
      />

      <Modal
        open={pendingAction !== null}
        onClose={cancelAction}
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
            <Button variant="secondary" onClick={cancelAction}>
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