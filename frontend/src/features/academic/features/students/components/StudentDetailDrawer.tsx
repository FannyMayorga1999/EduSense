import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  Heart,
  FileText,
  Pencil,
  ArrowLeft,
  Save,
  Check,
} from 'lucide-react'
import type { StudentDetail } from '../types'
import { formatDate } from '@/shared/utils/format'
import { lockScroll, unlockScroll } from '@/shared/utils/scrollLock'
import Badge from '@/shared/components/ui/Badge'
import Modal from '@/shared/components/ui/Modal'
import Button from '@/shared/components/ui/Button'
import StudentForm from './StudentForm'

interface StudentDetailDrawerProps {
  student: StudentDetail | null
  open: boolean
  onClose: () => void
  canEdit?: boolean
  initialMode?: 'view' | 'edit'
  onToggleStatus?: (student: StudentDetail) => Promise<boolean>
  onSavedEdit?: (message: string) => void
}

type DrawerMode = 'view' | 'edit'

/**
 * Right side panel with the student detail and, in the same shell, the inline
 * edit form (pencil switches the mode instead of opening a separate modal).
 *
 * @author Fanny Mayorga | @date 06-10-2026
 */
export default function StudentDetailDrawer({
  student,
  open,
  onClose,
  canEdit = false,
  initialMode = 'view',
  onToggleStatus,
  onSavedEdit,
}: StudentDetailDrawerProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<DrawerMode>('view')
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false)
  const [statusBusy, setStatusBusy] = useState<boolean>(false)
  const [wasOpen, setWasOpen] = useState<boolean>(open)

  // Reset the shell whenever the drawer opens/closes (render-phase adjustment).
  if (open !== wasOpen) {
    setWasOpen(open)
    setMode(open ? initialMode : 'view')
    setStatusModalOpen(false)
    setStatusBusy(false)
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      // The status confirmation modal handles its own Escape first.
      if (statusModalOpen) {
        setStatusModalOpen(false)

        return
      }

      // In edit mode Escape goes back to the detail instead of closing.
      if (mode === 'edit') {
        setMode('view')

        return
      }

      onClose()
    }

    if (open) {
      window.addEventListener('keydown', handleEscape)
      lockScroll()
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      unlockScroll()
    }
  }, [open, onClose, mode, statusModalOpen])

  if (!open || !student) {
    return null
  }

  const isEditing = mode === 'edit'
  const enrollment = student.enrollments[0]
  const parallel = enrollment?.parallel
  const currentStatusLabel = t(student.is_active ? 'students.status_active' : 'students.status_inactive')
  const nextStatusLabel = t(student.is_active ? 'students.status_inactive' : 'students.status_active')

  const backToDetail = (): void => {
    setMode('view')
  }

  const handleOverlayClick = (): void => {
    if (isEditing) {
      setMode('view')

      return
    }

    onClose()
  }

  const handleFormSaved = (message: string): void => {
    setMode('view')
    onSavedEdit?.(message)
  }

  const openStatusModal = (): void => {
    setStatusModalOpen(true)
  }

  const closeStatusModal = (): void => {
    if (!statusBusy) {
      setStatusModalOpen(false)
    }
  }

  const handleConfirmStatus = async (): Promise<void> => {
    if (onToggleStatus === undefined) {
      return
    }

    setStatusBusy(true)

    try {
      const succeeded = await onToggleStatus(student)

      if (succeeded) {
        setStatusModalOpen(false)
      }
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Drawer: same side panel for view and edit modes */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl dark:bg-stone-900">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-700">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              {isEditing ? t('students.form.edit_title') : t('students.detail.title')}
            </h2>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <button
                  type="button"
                  onClick={backToDetail}
                  className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  aria-label={t('students.detail.back')}
                  title={t('students.detail.back')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                canEdit && (
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                    aria-label={t('students.detail.edit')}
                    title={t('students.detail.edit')}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                aria-label={t('students.detail.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto ed-hide-x px-6 py-6">
            {isEditing ? (
              <StudentForm
                student={student}
                variant="sections"
                onSaved={handleFormSaved}
                onCancel={backToDetail}
              />
            ) : (
              <>
                {/* Student Info */}
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    <User className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-white">
                      {student.full_name}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {student.document_type}: {student.document_number}
                    </p>
                    <div className="mt-2">
                      <Badge
                        tone={student.is_active ? 'emerald' : 'rose'}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer transition hover:opacity-75 hover:ring-2 hover:ring-primary-500/50"
                        aria-label={t('students.detail.change_title')}
                        title={t('students.detail.change_title')}
                        onClick={openStatusModal}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openStatusModal()
                          }
                        }}
                      >
                        {currentStatusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <section className="mb-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                    <User className="h-4 w-4" />
                    {t('students.detail.personal_info')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.birth_date')}
                      </p>
                      <p className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-white">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(student.birth_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.gender')}
                      </p>
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {student.gender || '—'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                    <Mail className="h-4 w-4" />
                    {t('students.detail.contact_info')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.contact_email')}
                      </p>
                      <p className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-white">
                        <Mail className="h-3.5 w-3.5" />
                        {student.contact_email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.contact_phone')}
                      </p>
                      <p className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-white">
                        <Phone className="h-3.5 w-3.5" />
                        {student.contact_phone || '—'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.home_address')}
                      </p>
                      <p className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-white">
                        <MapPin className="h-3.5 w-3.5" />
                        {student.home_address || '—'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Academic Information */}
                {enrollment && (
                  <section className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                      <GraduationCap className="h-4 w-4" />
                      {t('students.detail.academic_info')}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('students.form.course')}
                        </p>
                        <p className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-white">
                          <BookOpen className="h-3.5 w-3.5" />
                          {enrollment.course?.name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('students.table.parallel')}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {parallel ? (
                            <Badge tone="sky">{parallel}</Badge>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-500">
                              {t('students.parallel_undefined')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('students.form.academic_status')}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {student.academic_status || '—'}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Legal Representative */}
                {student.representative_name && (
                  <section className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                      <FileText className="h-4 w-4" />
                      {t('students.detail.representative')}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('students.form.representative_name')}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {student.representative_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('students.form.representative_relation')}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {student.representative_relation || '—'}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Health Information */}
                {student.medical_conditions && (
                  <section>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                      <Heart className="h-4 w-4" />
                      {t('students.detail.health_info')}
                    </h4>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50">
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {t('students.form.medical_conditions')}
                      </p>
                      <p className="mt-1 text-sm text-stone-900 dark:text-white">
                        {student.medical_conditions}
                      </p>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Edit mode footer */}
          {isEditing && (
            <div className="shrink-0 border-t border-stone-200 px-6 py-4 dark:border-stone-700">
              <div className="ed-acciones ed-acciones--simple">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={backToDetail}
                  className="ed-acciones__ancho"
                >
                  <X className="h-4 w-4" />
                  {t('students.confirm.cancel')}
                </Button>
                <Button type="submit" form="student-form" className="ed-acciones__ancho">
                  <Save className="h-4 w-4" />
                  {t('students.form.save')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status change confirmation */}
      <Modal
        open={statusModalOpen}
        onClose={closeStatusModal}
        title={t('students.detail.change_title')}
        footer={
          <div className="ed-acciones ed-acciones--simple">
            <Button variant="secondary" type="button" onClick={closeStatusModal} disabled={statusBusy} className="ed-acciones__ancho">
              <X className="h-4 w-4" />
              {t('students.confirm.cancel')}
            </Button>
            <Button
              variant={student.is_active ? 'danger' : 'primary'}
              loading={statusBusy}
              onClick={() => void handleConfirmStatus()}
              className="ed-acciones__ancho"
            >
              <Check className="h-4 w-4" />
              {t('students.detail.confirm_change')}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {t('students.detail.change_message', {
            current: currentStatusLabel,
            new: nextStatusLabel,
          })}
        </p>
      </Modal>
    </>
  )
}
