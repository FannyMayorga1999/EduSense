import { useTranslation } from 'react-i18next'
import { Save, X } from 'lucide-react'
import type { Student } from '../types'
import Modal from '@/shared/components/ui/Modal'
import StudentForm from '@/features/academic/features/students/components/StudentForm'
import Button from '@/shared/components/ui/Button'

/**
 * Modal wrapper of the student wizard, used for both the create and the edit
 * flows. The wizard is rendered in its sections variant so the whole record is
 * reachable without leaving the listing.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface StudentFormModalProps {
  open: boolean
  student: Student | null
  onClose: () => void
  onSaved: (message: string) => void
}

export default function StudentFormModal({
  open,
  student,
  onClose,
  onSaved,
}: StudentFormModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(student === null ? 'students.form.create_title' : 'students.form.edit_title')}
      subtitle={t('students.form.subtitle')}
      size="fullscreen"
      footer={
        <div className="ed-acciones ed-acciones--simple">
          <Button variant="secondary" type="button" onClick={onClose} className="ed-acciones__ancho">
            <X className="h-4 w-4" />
            {t('students.confirm.cancel')}
          </Button>
          <Button type="submit" form="student-form" className="ed-acciones__ancho">
            <Save className="h-4 w-4" />
            {t('students.form.save')}
          </Button>
        </div>
      }
    >
      <StudentForm
        student={student}
        onSaved={onSaved}
        onCancel={onClose}
        variant="sections"
      />
    </Modal>
  )
}