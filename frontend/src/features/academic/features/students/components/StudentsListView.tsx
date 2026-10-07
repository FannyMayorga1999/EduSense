import { useTranslation } from 'react-i18next'
import { Check, Download, Eye, FileSpreadsheet, Pencil, Plus, Search, Upload, UserCheck, UserX, Users, X } from 'lucide-react'
import type { useStudents } from '@/features/academic/features/students/hooks/useStudents'
import StudentFormModal from '@/features/academic/features/students/components/StudentFormModal'
import StudentImportModal from '@/features/academic/features/students/components/StudentImportModal'
import StudentDetailDrawer from '@/features/academic/features/students/components/StudentDetailDrawer'
import { formatDate } from '@/shared/utils/format'
import { academicStatusView } from '@/features/academic/features/students/utils/academicStatus'
import type { StudentListItem } from '../types'
import Button from '@/shared/components/ui/Button'
import Input from '@/shared/components/ui/Input'
import MultiSelect from '@/shared/components/ui/MultiSelect'
import ActiveFilters from '@/shared/components/ui/ActiveFilters'
import Badge from '@/shared/components/ui/Badge'
import StatusBadge from '@/shared/components/ui/StatusBadge'
import Modal from '@/shared/components/ui/Modal'
import PaginatedTable from '@/shared/components/ui/PaginatedTable'
import Tooltip from '@/shared/components/ui/Tooltip'

/**
 * Students module view: filtered listing (search, status and grade) with
 * inline expandable rows, CRUD by modal, bulk CSV upload and CSV/XLSX
 * download. All the state comes from the `useStudents` hook; here only the
 * presentation is rendered.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

type StudentsListViewProps = ReturnType<typeof useStudents>

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
    parallel,
    setParallel,
    courses,
    parallels,
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
    closeForm,
    handleSaved,
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
    exportList,
    exportSelected,
    // Bulk actions
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkParallelOpen,
    bulkParallelValue,
    setBulkParallelValue,
    openBulkParallel,
    closeBulkParallel,
    confirmBulkParallel,
    bulkStatusOpen,
    bulkStatusValue,
    openBulkStatus,
    closeBulkStatus,
    confirmBulkStatus,
    bulkConfirming,
    // Detail drawer
    detailDrawerOpen,
    detailStudent,
    detailStartEdit,
    openDetailDrawer,
    closeDetailDrawer,
    toggleDetailStatus,
    handleDetailSaved,
  } = props

  const allSelected = data !== null && data.data.length > 0 && data.data.every((student: StudentListItem) => selectedIds.includes(student.id))

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={allSelected ? clearSelection : selectAll}
          className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
          aria-label={allSelected ? t('students.bulk.deselect_all') : t('students.bulk.select_all')}
        />
      ),
      render: (student: StudentListItem) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(student.id)}
          onChange={() => toggleSelection(student.id)}
          className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
        />
      ),
    },
    {
      key: 'document',
      header: t('students.table.document'),
      render: (student: StudentListItem) => <>{student.document_number ?? '—'}</>,
    },
    {
      key: 'full_name',
      header: t('students.table.full_name'),
      render: (student: StudentListItem) => (
        <span className="ed-table__resalto font-medium">{student.full_name}</span>
      ),
    },
    {
      key: 'grade',
      header: t('students.table.grade'),
      render: (student: StudentListItem) => {
        const course = student.enrollments[0]?.course?.name

        return course !== undefined ? <Badge tone="teal">{course}</Badge> : <span>—</span>
      },
    },
    {
      key: 'parallel',
      header: t('students.table.parallel'),
      render: (student: StudentListItem) => {
        const parallel = student.enrollments[0]?.parallel

        return <Badge tone="sky">{parallel ? parallel : t('students.parallel_undefined') }</Badge>
      },
    },
    {
      key: 'birth_date',
      header: t('students.table.birth_date'),
      render: (student: StudentListItem) => <>{formatDate(student.birth_date)}</>,
    },
    {
      key: 'status',
      header: t('students.table.status'),
      render: (student: StudentListItem) => {
        const status = academicStatusView(student.academic_status, student.is_active)

        return <StatusBadge label={t(status.labelKey)} tone={status.tone} />
      },
    },
    {
      key: 'actions',
      header: t('students.table.actions'),
      render: (student: StudentListItem) => (
        <div className="flex items-center gap-1">
          <Tooltip label={t('students.actions.view_detail')}>
            <button
              type="button"
              onClick={() => openDetailDrawer(student.id)}
              aria-label={t('students.actions.view_detail')}
              className="ed-item-accion"
            >
              <Eye className="h-4 w-4" />
            </button>
          </Tooltip>

          {canEdit && (
            <Tooltip label={t('students.actions.edit')}>
              <button
                type="button"
                onClick={() => void openDetailDrawer(student.id, true)}
                aria-label={t('students.actions.edit')}
                className="ed-item-accion"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {student.is_active && canDelete && (
            <Tooltip label={t('students.actions.deactivate')}>
              <button
                type="button"
                onClick={() => requestDeactivate(student)}
                aria-label={t('students.actions.deactivate')}
                className="ed-item-accion ed-item-accion--peligro"
              >
                <UserX className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {!student.is_active && canEdit && (
            <Tooltip label={t('students.actions.reactivate')}>
              <button
                type="button"
                onClick={() => requestReactivate(student)}
                aria-label={t('students.actions.reactivate')}
                className="ed-item-accion ed-item-accion--ok"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            </Tooltip>
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
          <Button
            variant="primary"
            onClick={openNew}
          >
            <Plus className="h-4 w-4" />
            {t('students.new')}
          </Button>
        )}
      </div>

      <section className="ed-panel ed-panel--filtros" aria-label={t('students.title')}>
        <div className="ed-toolbar__filtros">
          <div className="ed-toolbar__filtros-controls">
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
                options={courses.map((course) => ({ value: String(course.id), label: course.name }))}
                value={grade}
                onChange={setGrade}
                placeholder={t('students.grade_all')}
                countText={(count) => t('students.selected_count', { count })}
                clearAllLabel={t('students.clear_all')}
                ariaLabel={t('students.filter_grade')}
                className="sm:w-52"
              />
            )}

            <MultiSelect
              options={[
                ...parallels.map((parallel) => ({ value: parallel, label: parallel })),
                { value: '__undefined__', label: t('students.parallel_undefined') },
              ]}
              value={parallel}
              onChange={setParallel}
              placeholder={t('students.parallel_all')}
              countText={(count) => t('students.selected_count', { count })}
              clearAllLabel={t('students.clear_all')}
              ariaLabel={t('students.filter_parallel')}
              className="sm:w-44"
            />
          </div>

          {(canExport || canImport) && (
            <div className="ed-toolbar__grupo sm:justify-self-end">
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
            selectedIds.length > 0 ? (
              <div className="sm:flex sm:justify-between sm:items-center sm:gap-4">
                <div className="ed-toolbar__grupo mb-2 sm:mb-0">
                  <span className="text-sm text-stone-600 dark:text-stone-400 self-center">
                    {t('students.bulk.selected_count', { count: selectedIds.length })}
                  </span>
                  {canEdit && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={openBulkParallel}
                        title={t('students.bulk.update_parallel')}
                      >
                        <Users className="h-4 w-4" />
                        {t('students.bulk.update_parallel')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openBulkStatus(true)}
                        title={t('students.bulk.activate')}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {t('students.bulk.activate')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openBulkStatus(false)}
                        title={t('students.bulk.deactivate')}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        {t('students.bulk.deactivate')}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    title={t('students.bulk.clear_selection')}
                  >
                    <X className="h-4 w-4" />
                    {t('students.bulk.clear_selection')}
                  </Button>
                </div>
                {canExport && (
                  <div className="ed-toolbar__grupo sm:ml-auto">
                    <div className="ed-toolbar__acciones">
                      <Button
                        variant="secondary"
                        iconOnly
                        onClick={() => void exportSelected('csv')}
                        title={t('students.download_selection')}
                        aria-label={t('students.download_selection')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        iconOnly
                        onClick={() => void exportSelected('xlsx')}
                        title={t('students.download_selection')}
                        aria-label={t('students.download_selection')}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      </section>

      <div>
        <StudentFormModal
          open={formOpen}
          student={props.editingStudent}
          onClose={closeForm}
          onSaved={handleSaved}
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
          footer={
            <div className="ed-acciones ed-acciones--simple">
              <Button variant="secondary" onClick={cancelAction} className="ed-acciones__ancho">
                <X className="h-4 w-4" />
                {t('students.confirm.cancel')}
              </Button>
              <Button
                variant={pendingAction?.type === 'deactivate' ? 'danger' : 'primary'}
                loading={confirming}
                onClick={() => void confirmAction()}
                className="ed-acciones__ancho"
              >
                <Check className="h-4 w-4" />
                {confirming ? t('students.confirm.executing') : t('students.confirm.confirm')}
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t(
              pendingAction?.type === 'deactivate'
                ? 'students.confirm.deactivate_message'
                : 'students.confirm.reactivate_message',
              { name: pendingAction?.student.full_name ?? '' },
            )}
          </p>
        </Modal>

        {/* Bulk Parallel Update Modal */}
        <Modal
          open={bulkParallelOpen}
          onClose={closeBulkParallel}
          title={t('students.bulk.update_parallel_title')}
          footer={
            <div className="ed-acciones ed-acciones--simple">
              <Button variant="secondary" onClick={closeBulkParallel} className="ed-acciones__ancho">
                <X className="h-4 w-4" />
                {t('students.confirm.cancel')}
              </Button>
              <Button
                variant="primary"
                loading={bulkConfirming}
                onClick={() => void confirmBulkParallel()}
                className="ed-acciones__ancho"
              >
                <Check className="h-4 w-4" />
                {bulkConfirming ? t('students.confirm.executing') : t('students.confirm.confirm')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {t('students.bulk.update_parallel_message', { count: selectedIds.length })}
            </p>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {t('students.table.parallel')}
              </label>
              <Input
                type="text"
                value={bulkParallelValue}
                onChange={(e) => setBulkParallelValue(e.target.value)}
                placeholder={t('students.bulk.parallel_placeholder')}
              />
            </div>
          </div>
        </Modal>

        {/* Bulk Status Toggle Modal */}
        <Modal
          open={bulkStatusOpen}
          onClose={closeBulkStatus}
          title={t(bulkStatusValue ? 'students.bulk.activate_title' : 'students.bulk.deactivate_title')}
          footer={
            <div className="ed-acciones ed-acciones--simple">
              <Button variant="secondary" onClick={closeBulkStatus} className="ed-acciones__ancho">
                <X className="h-4 w-4" />
                {t('students.confirm.cancel')}
              </Button>
              <Button
                variant={bulkStatusValue ? 'primary' : 'danger'}
                loading={bulkConfirming}
                onClick={() => void confirmBulkStatus()}
                className="ed-acciones__ancho"
              >
                <Check className="h-4 w-4" />
                {bulkConfirming ? t('students.confirm.executing') : t('students.confirm.confirm')}
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t(
              bulkStatusValue
                ? 'students.bulk.activate_message'
                : 'students.bulk.deactivate_message',
              { count: selectedIds.length },
            )}
          </p>
        </Modal>

        <StudentDetailDrawer
          student={detailStudent}
          open={detailDrawerOpen}
          onClose={closeDetailDrawer}
          canEdit={canEdit}
          initialMode={detailStartEdit ? 'edit' : 'view'}
          onToggleStatus={canEdit ? toggleDetailStatus : undefined}
          onSavedEdit={handleDetailSaved}
        />
      </div>
    </section>
  )
}