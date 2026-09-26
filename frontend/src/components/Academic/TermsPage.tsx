import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { createTerm, deleteTerm, fetchTermsPaginated, updateTerm } from '../../api'
import type { AcademicTerm, TermForm } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Field from '../ui/Field'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import PaginatedTable from '../ui/PaginatedTable'
import usePagination from '../../hooks/usePagination'

/**
 * Administration page of the academic terms catalog (school years): paginated
 * listing, create/edit, mark as current (single) and delete. Actions are shown
 * according to the permissions of the authenticated user.
 *
 * @author Fanny Mayorga
 */

const EMPTY_FORM: TermForm = {
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
}

export default function TermsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const isAdmin = user?.roles.includes('administrator') ?? false
  const can = (permission: string): boolean =>
    isAdmin || (user?.permissions ?? []).includes(permission)

  const canCreate = can('create_terms')
  const canEdit = can('edit_terms')
  const canDelete = can('delete_terms')

  const { data, loading, error, page, totalPages, limit, total, from, to, goToPage, changeLimit, reload } =
    usePagination<AcademicTerm>({
      errorMessage: t('periods.messages.load_error'),
      fetch: (p, perPage) => fetchTermsPaginated(p, perPage),
    })

  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<AcademicTerm | null>(null)
  const [form, setForm] = useState<TermForm>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)

  const [deleting, setDeleting] = useState<AcademicTerm | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false)
  const [settingCurrent, setSettingCurrent] = useState<number | null>(null)

  const [banner, setBanner] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (banner === null) {
      return
    }

    const id = window.setTimeout(() => setBanner(null), 5000)

    return () => window.clearTimeout(id)
  }, [banner])

  const openNew = useCallback((): void => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((term: AcademicTerm): void => {
    setEditing(term)
    setForm({
      name: term.name,
      start_date: (term.start_date ?? '').slice(0, 10),
      end_date: (term.end_date ?? '').slice(0, 10),
      is_current: term.is_current,
    })
    setFieldErrors({})
    setFormOpen(true)
  }, [])

  const updateField = (field: keyof TermForm, value: string | boolean): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[field]
      return copy
    })
  }

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    const errors: Record<string, string> = {}

    if (form.name.trim() === '') {
      errors.name = t('periods.form.required')
    }

    if (form.start_date === '') {
      errors.start_date = t('periods.form.required')
    }

    if (form.end_date === '') {
      errors.end_date = t('periods.form.required')
    } else if (form.start_date !== '' && form.end_date < form.start_date) {
      errors.end_date = t('periods.form.end_after_start')
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      if (editing !== null) {
        const updated = await updateTerm(editing.id, form)
        setBanner({ type: 'ok', text: t('periods.messages.updated', { name: updated.name }) })
      } else {
        const created = await createTerm(form)
        setBanner({ type: 'ok', text: t('periods.messages.created', { name: created.name }) })
      }

      setFormOpen(false)
      reload()
    } catch (reason) {
      if (isAxiosError(reason) && reason.response?.status === 422) {
        const details = reason.response.data?.errors as Record<string, string[]> | undefined

        if (details !== undefined) {
          const mapped: Record<string, string> = {}

          for (const [field, messages] of Object.entries(details)) {
            mapped[field] = messages[0]
          }

          setFieldErrors(mapped)
        }
      } else {
        setBanner({ type: 'error', text: t('periods.messages.error_generic') })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const setCurrent = async (term: AcademicTerm): Promise<void> => {
    setSettingCurrent(term.id)

    try {
      await updateTerm(term.id, { is_current: true })
      setBanner({ type: 'ok', text: t('periods.messages.current_set', { name: term.name }) })
      reload()
    } catch {
      setBanner({ type: 'error', text: t('periods.messages.error_generic') })
    } finally {
      setSettingCurrent(null)
    }
  }

  const confirmDelete = async (): Promise<void> => {
    if (deleting === null) {
      return
    }

    setConfirmingDelete(true)

    try {
      await deleteTerm(deleting.id)
      setBanner({ type: 'ok', text: t('periods.messages.deleted', { name: deleting.name }) })
      setDeleting(null)
      reload()
    } catch (reason) {
      if (isAxiosError(reason) && reason.response?.status === 422) {
        setBanner({ type: 'error', text: t('periods.messages.delete_blocked') })
      } else {
        setBanner({ type: 'error', text: t('periods.messages.error_generic') })
      }

      setDeleting(null)
    } finally {
      setConfirmingDelete(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('periods.table.name'),
      render: (term: AcademicTerm) => <span className="ed-table__resalto">{term.name}</span>,
    },
    {
      key: 'start',
      header: t('periods.table.start'),
      render: (term: AcademicTerm) => <>{term.start_date?.slice(0, 10) ?? '—'}</>,
    },
    {
      key: 'end',
      header: t('periods.table.end'),
      render: (term: AcademicTerm) => <>{term.end_date?.slice(0, 10) ?? '—'}</>,
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
              onClick={() => setDeleting(term)}
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
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
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
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)} className="ed-acciones__ancho">
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
        onClose={() => setDeleting(null)}
        title={t('periods.confirm.delete_title')}
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t('periods.confirm.delete_message', { name: deleting?.name ?? '' })}
          </p>

          <div className="ed-acciones ed-acciones--simple">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
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