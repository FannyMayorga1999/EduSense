import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/system/auth/hooks/useAuth'
import {
  deactivateStudent,
  exportStudents,
  fetchStudents,
  updateStudent,
} from '@/features/students/services/students.service'
import { fetchCourses } from '@/features/academic'
import usePagination from '@/hooks/usePagination'
import type { AcademicResource, StudentListItem } from '@/types'

/**
 * Students module hook: owns the filters, the paginated listing, the CRUD
 * actions (create/edit/deactivate/reactivate), the bulk import, the export
 * and the transient banners. The page delegates all the state here and the
 * list component only renders it.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

export function useStudents() {
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

  const pagination = usePagination<StudentListItem>({
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

  const { goToPage, reload } = pagination

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

    fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
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

  const closeForm = useCallback((): void => {
    setFormOpen(false)
    setEditing(null)
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

  const openImport = useCallback((): void => {
    setImportOpen(true)
  }, [])

  const closeImport = useCallback((): void => {
    setImportOpen(false)
  }, [])

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

  const requestDeactivate = useCallback((student: StudentListItem): void => {
    setPendingAction({ type: 'deactivate', student })
  }, [])

  const requestReactivate = useCallback((student: StudentListItem): void => {
    setPendingAction({ type: 'reactivate', student })
  }, [])

  const cancelAction = useCallback((): void => {
    setPendingAction(null)
  }, [])

  const confirmAction = useCallback(async (): Promise<void> => {
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
  }, [pendingAction, t, reload])

  return {
    canCreate,
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
    reload: pagination.reload,
    formOpen,
    editing,
    openNew,
    openEdit,
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
    banner,
    exportList,
  }
}