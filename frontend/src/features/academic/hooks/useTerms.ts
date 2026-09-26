import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useAuth } from '@/features/system/auth/hooks/useAuth'
import { createTerm, deleteTerm, fetchTermsPaginated, updateTerm } from '@/features/academic/services/academic.service'
import usePagination from '@/hooks/usePagination'
import type { AcademicTerm, TermForm } from '@/types'

/**
 * Academic terms module hook: owns the paginated listing, the create/edit
 * form, the "set as current" action, the delete confirmation and the
 * transient banners. The page delegates all the state here and the table
 * component only renders it.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

const EMPTY_FORM: TermForm = {
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
}

export function useTerms() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const isAdmin = user?.roles.includes('administrator') ?? false
  const can = (permission: string): boolean =>
    isAdmin || (user?.permissions ?? []).includes(permission)

  const canCreate = can('create_terms')
  const canEdit = can('edit_terms')
  const canDelete = can('delete_terms')

  const pagination = usePagination<AcademicTerm>({
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

  const closeForm = useCallback((): void => {
    setFormOpen(false)
    setEditing(null)
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
      pagination.reload()
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
      pagination.reload()
    } catch {
      setBanner({ type: 'error', text: t('periods.messages.error_generic') })
    } finally {
      setSettingCurrent(null)
    }
  }

  const requestDelete = useCallback((term: AcademicTerm): void => {
    setDeleting(term)
  }, [])

  const cancelDelete = useCallback((): void => {
    setDeleting(null)
  }, [])

  const confirmDelete = async (): Promise<void> => {
    if (deleting === null) {
      return
    }

    setConfirmingDelete(true)

    try {
      await deleteTerm(deleting.id)
      setBanner({ type: 'ok', text: t('periods.messages.deleted', { name: deleting.name }) })
      setDeleting(null)
      pagination.reload()
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

  return {
    canCreate,
    canEdit,
    canDelete,
    data: pagination.data,
    loading: pagination.loading,
    error: pagination.error,
    page: pagination.page,
    totalPages: pagination.totalPages,
    limit: pagination.limit,
    total: pagination.total,
    from: pagination.from,
    to: pagination.to,
    goToPage: pagination.goToPage,
    changeLimit: pagination.changeLimit,
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
  }
}