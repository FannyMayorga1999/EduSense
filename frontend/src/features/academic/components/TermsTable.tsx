import { useTranslation } from 'react-i18next'
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { useTerms } from '@/features/academic/hooks/useTerms'
import { formatDate } from '@/utils/format'
import type { AcademicTerm } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Field from '@/components/ui/Field'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PaginatedTable from '@/components/ui/PaginatedTable'

/**
 * Academic terms administration view (school years): paginated listing,
 * create/edit, mark as current (single) and delete. All the state comes from
 * the `useTerms` hook; here only the presentation is rendered.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

type TermsTableProps = ReturnType<typeof useTerms>

export default function TermsTable(props: TermsTableProps) {
  const { t } = useTranslation()

  const {
    canCreate,
    canEdit,
    canDelete,
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
    editing,
    form,
    fieldErrors,
    submitting,
    openNew,
    openEdit,
    closeForm,
    updateField,
    submit,
    setCurrent,
    settingCurrent,
    deleting,
    requestDelete,
    cancelDelete,
    confirmingDelete,
    confirmDelete,
    banner,
  } = props

  const columns = [
    {
      key: 'name',
      header: t('periods.table.name'),
      render: (term: AcademicTerm) => <span className="ed-table__resalto">{term.name}</span>,
    },
    {
      key: 'start',
      header: t('periods.table.start'),
      render: (term: AcademicTerm) => <>{formatDate(term.start_date)}</>,
    },
    {
      key: 'end',
      header: t('periods.table.end'),
      render: (term: AcademicTerm) => <>{formatDate(term.end_date)}</>,
    },
    {
      key: 'status',
      header: t('periods.table.status'),
      render: (term: AcademicTerm) =>
        term.is_current ? (
          <Badge tone="emerald">{t('periods.status.current')}</Badge>
        ) : (
          <Badge tone="stone">{t('periods.status.not_current')}</Badge>
        ),
    },
    {
      key: 'matches',
      header: t('periods.table.matches'),
      render: (term: AcademicTerm) => <>{term.enrollments_count}</>,
    },
    {
      key: 'actions',
      header: t('periods.table.actions'),
      render: (term: AcademicTerm) => (
        <div className="flex items-center gap-2">
          {!term.is_current && canEdit && (
            <button
              type="button"
              onClick={() => void setCurrent(term)}
              disabled={settingCurrent === term.id}
              title={t('periods.actions.set_current')}
              aria-label={t('periods.actions.set_current')}
              className="ed-item-accion ed-item-accion--ok"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => openEdit(term)}
              title={t('periods.actions.edit')}
              aria-label={t('periods.actions.edit')}
              className="ed-item-accion"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => requestDelete(term)}
              title={t('periods.actions.delete')}
              aria-label={t('periods.actions.delete')}
              className="ed-item-accion ed-item-accion--peligro"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="mod-academic space-y-6" aria-label={t('periods.title')}>
      <div>
        <h1 className="ed-page__title">{t('periods.title')}</h1>
        <p className="ed-page__subtitle">{t('periods.subtitle')}</p>
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
        columns={columns}
        getRowKey={(term) => term.id}
        emptyMessage={t('periods.table.empty')}
        toolbar={
          <>
            <p className="ed-toolbar__info">{t('periods.legend')}</p>

            {canCreate && (
              <div className="ed-toolbar__acciones">
                <Button size="sm" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  {t('periods.new')}
                </Button>
              </div>
            )}
          </>
        }
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={t(editing !== null ? 'periods.form.title_edit' : 'periods.form.title_create')}
        size="wide"
      >
        <form className="ed-form" onSubmit={(event) => void submit(event)}>
          <Field label={t('periods.form.name')} htmlFor="term_name" error={fieldErrors.name}>
            <Input
              id="term_name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="2026-2027"
              required
            />
          </Field>

          <div className="ed-malla">
            <Field label={t('periods.form.start_date')} htmlFor="term_start" error={fieldErrors.start_date}>
              <Input
                id="term_start"
                type="date"
                value={form.start_date}
                onChange={(event) => updateField('start_date', event.target.value)}
                required
              />
            </Field>

            <Field label={t('periods.form.end_date')} htmlFor="term_end" error={fieldErrors.end_date}>
              <Input
                id="term_end"
                type="date"
                value={form.end_date}
                onChange={(event) => updateField('end_date', event.target.value)}
                required
              />
            </Field>
          </div>

          <label className="ed-toggle ed-toggle--entre">
            <span className="ed-toggle__texto">{t('periods.form.is_current')}</span>
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(event) => updateField('is_current', event.target.checked)}
              className="ed-checkbox"
            />
          </label>

          <p className="ed-pista">{t('periods.form.is_current_help')}</p>

          <div className="ed-acciones ed-acciones--fin">
            <Button variant="secondary" type="button" onClick={closeForm} className="ed-acciones__ancho">
              {t('periods.confirm.cancel')}
            </Button>
            <Button type="submit" loading={submitting} className="ed-acciones__ancho">
              {submitting ? t('periods.form.saving') : t('periods.form.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={cancelDelete}
        title={t('periods.confirm.delete_title')}
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t('periods.confirm.delete_message', { name: deleting?.name ?? '' })}
          </p>

          <div className="ed-acciones ed-acciones--simple">
            <Button variant="secondary" onClick={cancelDelete}>
              {t('periods.confirm.cancel')}
            </Button>
            <Button variant="danger" loading={confirmingDelete} onClick={() => void confirmDelete()}>
              {confirmingDelete ? t('periods.confirm.executing') : t('periods.confirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}