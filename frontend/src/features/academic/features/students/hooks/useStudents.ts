import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/system/auth/hooks/useAuth'
import {
  bulkToggleStatus,
  bulkUpdateParallel,
  deactivateStudent,
  exportStudents,
  fetchStudent,
  fetchStudents,
  reactivateStudent,
  updateStudent,
} from '@/features/academic/features/students/api/students.service'
import { fetchCourses } from '@/features/academic'
import usePagination from '@/shared/hooks/usePagination'
import { useAlert } from '@/shared/components/ui/alertContext'
import type { AcademicResource } from '@/types'
import type { Student, StudentDetail, StudentListItem } from '../types'

/**
 * Students module hook: owns the filters, the paginated listing, the CRUD
 * actions (create/edit/deactivate/reactivate), the bulk import, the export and
 * the expanded row state. Feedback is delegated to the shared alert queue. The
 * page delegates all the state here and the list component only renders it.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

export function useStudents() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { push } = useAlert()

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
  const [status, setStatus] = useState<string[]>([])
  const [grade, setGrade] = useState<string[]>([])
  const [parallel, setParallel] = useState<string[]>([])
  const [courses, setCourses] = useState<AcademicResource[]>([])
  const [parallels, setParallels] = useState<string[]>([])

  const pagination = usePagination<StudentListItem>({
    errorMessage: t('students.messages.load_error'),
    fetch: (p, perPage) => {
      const regularParallels = parallel.filter((p) => p !== '__undefined__')
      const includeUndefined = parallel.includes('__undefined__')

      return fetchStudents({
        page: p,
        per_page: perPage,
        search: appliedSearch === '' ? undefined : appliedSearch,
        is_active: status.length > 0 ? status : undefined,
        grade: grade.length > 0 ? grade : undefined,
        parallel: regularParallels.length > 0 ? regularParallels : undefined,
        parallel_undefined: includeUndefined ? '1' : undefined,
      })
    },
    deps: [status, grade, parallel, appliedSearch],
  })

  const { goToPage, reload } = pagination

  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [importOpen, setImportOpen] = useState<boolean>(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [confirming, setConfirming] = useState<boolean>(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'deactivate' | 'reactivate'
    student: StudentListItem
  } | null>(null)

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkParallelOpen, setBulkParallelOpen] = useState<boolean>(false)
  const [bulkParallelValue, setBulkParallelValue] = useState<string>('')
  const [bulkStatusOpen, setBulkStatusOpen] = useState<boolean>(false)
  const [bulkStatusValue, setBulkStatusValue] = useState<boolean>(true)
  const [bulkConfirming, setBulkConfirming] = useState<boolean>(false)

  // Detail drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false)
  const [detailStudent, setDetailStudent] = useState<StudentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [detailStartEdit, setDetailStartEdit] = useState<boolean>(false)

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

    fetchStudents({ page: 1, per_page: 1000 })
      .then((result) => {
        const uniqueParallels = Array.from(
          new Set(
            result.data
              .map((student: StudentListItem) => student.enrollments[0]?.parallel)
              .filter((parallel: string | null | undefined): parallel is string => 
                parallel !== null && parallel !== undefined && parallel !== ''
              ),
          ),
        ).sort()

        setParallels(uniqueParallels)
      })
      .catch(() => setParallels([]))
  }, [canViewCourses])

  const openNew = useCallback((): void => {
    setEditingStudent(null)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback((): void => {
    setFormOpen(false)
    setEditingStudent(null)
  }, [])

  /**
   * After a save: success alert, close the wizard and refresh both the
   * paginated list and the expanded row when one is open.
   */
  const handleSaved = useCallback(
    (message: string): void => {
      setFormOpen(false)
      setEditingStudent(null)
      push(message, { variant: 'completed' })
      reload()
    },
    [push, reload],
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
        const regularParallels = parallel.filter((p) => p !== '__undefined__')
        const includeUndefined = parallel.includes('__undefined__')

        await exportStudents(
          {
            search: appliedSearch === '' ? undefined : appliedSearch,
            is_active: status.length > 0 ? status : undefined,
            grade: grade.length > 0 ? grade : undefined,
            parallel: regularParallels.length > 0 ? regularParallels : undefined,
            parallel_undefined: includeUndefined ? '1' : undefined,
          },
          format,
        )
      } catch {
        push(t('students.messages.export_error'), { variant: 'error' })
      }
    },
    [appliedSearch, status, grade, parallel, push, t],
  )

  const exportSelected = useCallback(
    async (format: 'csv' | 'xlsx'): Promise<void> => {
      try {
        await exportStudents({ ids: selectedIds }, format)
      } catch {
        push(t('students.messages.export_error'), { variant: 'error' })
      }
    },
    [selectedIds, push, t],
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
        push(t('students.messages.deactivated'), { variant: 'completed' })
      } else {
        await updateStudent(student.id, {
          first_name: student.first_name,
          last_name: student.last_name,
          document_number: student.document_number ?? '',
          birth_date: student.birth_date ?? '',
          is_active: true,
        })
        push(t('students.messages.reactivated'), { variant: 'completed' })
      }

      setPendingAction(null)
      reload()
    } catch {
      push(t('students.messages.error_generic'), { variant: 'error' })
      setPendingAction(null)
    } finally {
      setConfirming(false)
    }
  }, [pendingAction, push, t, reload])

  // Bulk selection handlers
  const toggleSelection = useCallback((id: number): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const selectAll = useCallback((): void => {
    if (pagination.data) {
      setSelectedIds(pagination.data.data.map((student: StudentListItem) => student.id))
    }
  }, [pagination.data])

  const clearSelection = useCallback((): void => {
    setSelectedIds([])
  }, [])

  const openBulkParallel = useCallback((): void => {
    setBulkParallelValue('')
    setBulkParallelOpen(true)
  }, [])

  const closeBulkParallel = useCallback((): void => {
    setBulkParallelOpen(false)
  }, [])

  const confirmBulkParallel = useCallback(async (): Promise<void> => {
    if (selectedIds.length === 0) {
      return
    }

    setBulkConfirming(true)

    try {
      const result = await bulkUpdateParallel(selectedIds, bulkParallelValue || null)
      push(t('students.messages.bulk_parallel_updated', { count: result.updated }), { variant: 'completed' })
      setBulkParallelOpen(false)
      setSelectedIds([])
      reload()
    } catch {
      push(t('students.messages.error_generic'), { variant: 'error' })
    } finally {
      setBulkConfirming(false)
    }
  }, [selectedIds, bulkParallelValue, push, t, reload])

  const openBulkStatus = useCallback((activate: boolean): void => {
    setBulkStatusValue(activate)
    setBulkStatusOpen(true)
  }, [])

  const closeBulkStatus = useCallback((): void => {
    setBulkStatusOpen(false)
  }, [])

  const confirmBulkStatus = useCallback(async (): Promise<void> => {
    if (selectedIds.length === 0) {
      return
    }

    setBulkConfirming(true)

    try {
      const result = await bulkToggleStatus(selectedIds, bulkStatusValue)
      const message = bulkStatusValue
        ? t('students.messages.bulk_reactivated', { count: result.updated })
        : t('students.messages.bulk_deactivated', { count: result.updated })
      push(message, { variant: 'completed' })
      setBulkStatusOpen(false)
      setSelectedIds([])
      reload()
    } catch {
      push(t('students.messages.error_generic'), { variant: 'error' })
    } finally {
      setBulkConfirming(false)
    }
  }, [selectedIds, bulkStatusValue, push, t, reload])

  /**
   * Opens the detail side drawer. With `startEdit` the drawer lands directly
   * in its inline edit mode (used by the table row pencil, so editing always
   * happens in the same side panel instead of a separate modal).
   */
  const openDetailDrawer = useCallback(
    async (studentId: number, startEdit = false): Promise<void> => {
      setDetailLoading(true)
      setDetailStartEdit(startEdit)
      setDetailDrawerOpen(true)

      try {
        const detail = await fetchStudent(studentId)
        setDetailStudent(detail)
      } catch {
        push(t('students.messages.error_generic'), { variant: 'error' })
        setDetailDrawerOpen(false)
      } finally {
        setDetailLoading(false)
      }
    },
    [push, t],
  )

  const closeDetailDrawer = useCallback((): void => {
    setDetailDrawerOpen(false)
    setDetailStudent(null)
    setDetailStartEdit(false)
  }, [])

  /**
   * Quick status toggle from the detail drawer badge: activates/deactivates
   * the student, refreshes the paginated list and the drawer detail so the
   * badge re-renders with the new tone. Resolves `true` only on success.
   */
  const toggleDetailStatus = useCallback(
    async (student: StudentDetail): Promise<boolean> => {
      const nextIsActive = !student.is_active

      try {
        if (nextIsActive) {
          await reactivateStudent(student.id)
        } else {
          await deactivateStudent(student.id)
        }

        push(
          t(nextIsActive ? 'students.messages.reactivated' : 'students.messages.deactivated'),
          { variant: 'completed' },
        )

        reload()

        const detail = await fetchStudent(student.id)
        setDetailStudent(detail)

        return true
      } catch {
        push(t('students.messages.error_generic'), { variant: 'error' })

        return false
      }
    },
    [push, t, reload],
  )

  /**
   * Re-fetches the drawer detail and refreshes the paginated list without
   * touching the open state. Used after the inline edit form saves so the
   * view mode re-renders with fresh data.
   */
  const refreshDetail = useCallback(async (): Promise<void> => {
    if (detailStudent === null) {
      reload()

      return
    }

    try {
      const detail = await fetchStudent(detailStudent.id)
      setDetailStudent(detail)
      reload()
    } catch {
      push(t('students.messages.load_error'), { variant: 'error' })
      reload()
    }
  }, [detailStudent, push, t, reload])

  /**
   * After the inline edit form inside the drawer saves: success alert plus a
   * refresh of the drawer detail and the paginated list.
   */
  const handleDetailSaved = useCallback(
    (message: string): void => {
      push(message, { variant: 'completed' })
      void refreshDetail()
    },
    [push, refreshDetail],
  )

  /**
   * Chips of the applied filters (search, statuses, grades and parallels) shown in the
   * "active filters" bar. Removing a chip re-queries automatically because
   * the underlying filter state changes the usePagination dependencies.
   */
  const activeFilters: { key: string; label: string }[] = []

  if (appliedSearch !== '') {
    activeFilters.push({ key: 'search', label: appliedSearch })
  }

  for (const selected of status) {
    const label = selected === '1' ? t('students.status_active') : t('students.status_inactive')
    activeFilters.push({ key: `status:${selected}`, label })
  }

  for (const selected of grade) {
    activeFilters.push({ key: `grade:${selected}`, label: selected })
  }

  for (const selected of parallel) {
    activeFilters.push({ key: `parallel:${selected}`, label: selected })
  }

  const removeFilter = (key: string): void => {
    if (key === 'search') {
      setSearch('')
      setAppliedSearch('')

      return
    }

    if (key.startsWith('status:')) {
      const selected = key.slice('status:'.length)
      setStatus((prev) => prev.filter((item) => item !== selected))

      return
    }

    if (key.startsWith('grade:')) {
      const selected = key.slice('grade:'.length)
      setGrade((prev) => prev.filter((item) => item !== selected))

      return
    }

    if (key.startsWith('parallel:')) {
      const selected = key.slice('parallel:'.length)
      setParallel((prev) => prev.filter((item) => item !== selected))
    }
  }

  const clearFilters = (): void => {
    setSearch('')
    setAppliedSearch('')
    setStatus([])
    setGrade([])
    setParallel([])
  }

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
    parallel,
    setParallel,
    courses,
    parallels,
    activeFilters,
    removeFilter,
    clearFilters,
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
    openNew,
    closeForm,
    handleSaved,
    editingStudent,
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
    detailLoading,
    detailStartEdit,
    openDetailDrawer,
    closeDetailDrawer,
    toggleDetailStatus,
    refreshDetail,
    handleDetailSaved,
  }
}