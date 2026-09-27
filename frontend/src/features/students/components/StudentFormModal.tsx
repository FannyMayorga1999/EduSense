import { useTranslation } from 'react-i18next'
import type { Student } from '@/types'
import Modal from '@/components/ui/Modal'
import StudentForm from '@/features/students/components/StudentForm'

/**
 * Modal wrapper of the student wizard. Used for the create flow; editing a
 * student is handled by the side detail panel, not this modal.
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
      size="wide"
    >
      <StudentForm student={student} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}