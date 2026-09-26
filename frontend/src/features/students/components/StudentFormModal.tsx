import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  createStudent,
  fetchStudent,
  updateStudent,
} from '@/features/students/services/students.service'
import { fetchCourses, fetchTerms } from '@/features/academic'
import type { AcademicResource, StudentDetail, StudentForm, StudentListItem } from '@/types'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

/**
 * 4-step wizard to create/edit a student: identification, current academic
 * information, contact/legal representative and health. Navigates with
 * validated steps and submits the whole form at once.
 *
 * @author Fanny Mayorga
 */

interface StudentFormModalProps {
  open: boolean
  student: StudentListItem | null
  onClose: () => void
  onSaved: (message: string) => void
}

const TOTAL_STEPS = 4

const EMPTY_FORM: StudentForm = {
  first_name: '',
  last_name: '',
  birth_date: '',
  document_type: 'cedula',
  document_number: '',
  gender: '',
  representative_name: '',
  representative_relation: '',
  contact_phone: '',
  contact_email: '',
  home_address: '',
  laterality: '',
  medical_conditions: '',
  course_id: '',
  term_id: '',
  parallel: '',
  academic_status: 'active',
  is_active: true,
}

const DOCUMENT_TYPES = ['cedula', 'pasaporte', 'dni'] as const
const GENDERS = ['male', 'female', 'other'] as const
const ACADEMIC_STATUSES = ['active', 'inactive', 'graduated', 'retired'] as const
const LATERALITIES = ['right', 'left', 'ambidextrous'] as const

export default function StudentFormModal({
  open,
  student,
  onClose,
  onSaved,
}: StudentFormModalProps) {
  const { t } = useTranslation()

  const [step, setStep] = useState<number>(0)
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM)
  const [courses, setCourses] = useState<AcademicResource[]>([])
  const [terms, setTerms] = useState<AcademicResource[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const isEditing = student !== null

  const fillAcademic = (source: StudentDetail): Partial<StudentForm> => {
    const enrollment = source.enrollments[0]

    return {
      course_id: enrollment?.course?.id !== undefined ? String(enrollment.course.id) : '',
      term_id: enrollment?.term?.id !== undefined ? String(enrollment.term.id) : '',
      parallel: enrollment?.parallel ?? '',
      academic_status: source.academic_status || 'active',
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    setStep(0)
    setFieldErrors({})
    setGeneralError(null)
    setSubmitting(false)

    if (student === null) {
      setForm(EMPTY_FORM)
    } else {
      setForm({
        ...EMPTY_FORM,
        document_type: student.document_type || 'cedula',
        first_name: student.first_name,
        last_name: student.last_name,
        birth_date: student.birth_date ?? '',
        document_number: student.document_number ?? '',
        gender: student.gender ?? '',
        representative_name: student.representative_name ?? '',
        representative_relation: student.representative_relation ?? '',
        contact_phone: student.contact_phone ?? '',
        contact_email: student.contact_email ?? '',
        home_address: student.home_address ?? '',
        laterality: student.laterality ?? '',
        medical_conditions: student.medical_conditions ?? '',
        is_active: student.is_active,
      })

      void fetchStudent(student.id)
        .then((context) => setForm((prev) => ({ ...prev, ...fillAcademic(context) })))
        .catch(() => setGeneralError(t('students.messages.load_error')))
    }

    void fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
    void fetchTerms(false)
      .then(setTerms)
      .catch(() => setTerms([]))
  }, [open, student, t])

  const updateField = (field: keyof StudentForm, value: string | boolean): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[`student.${field}`]
      return copy
    })
  }

  const validateStep = (index: number): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (index === 0) {
      if (form.document_type === '') {
        errors['student.document_type'] = t('students.form.required')
      }

      if (form.document_number.trim() === '') {
        errors['student.document_number'] = t('students.form.required')
      } else if (form.document_number.replace(/\D/g, '').length < 7) {
        errors['student.document_number'] = t('students.form.document_hint')
      }

      if (form.first_name.trim() === '') {
        errors['student.first_name'] = t('students.form.required')
      }

      if (form.last_name.trim() === '') {
        errors['student.last_name'] = t('students.form.required')
      }

      if (form.birth_date === '') {
        errors['student.birth_date'] = t('students.form.required')
      }
    }

    if (index === 1) {
      const hasEnrollment = form.course_id !== '' || form.term_id !== '' || form.parallel !== ''

      if (hasEnrollment && (form.course_id === '' || form.term_id === '')) {
        errors['student.term_id'] = t('students.form.enroll_incomplete')
      }
    }

    if (index === 2 && form.contact_email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
        errors['student.contact_email'] = t('students.form.email_invalid')
      }
    }

    return errors
  }

  const goNext = (): void => {
    const errors = validateStep(step)

    setFieldErrors(errors)

    if (Object.keys(errors).length === 0) {
      setGeneralError(null)
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
    }
  }

  const goBack = (): void => {
    setFieldErrors({})
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    const errors = validateStep(step)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)

      return
    }

    setSubmitting(true)
    setGeneralError(null)
    setFieldErrors({})

    try {
      if (isEditing && student !== null) {
        await updateStudent(student.id, form)
        onSaved(t('students.messages.updated'))
      } else {
        await createStudent(form)
        onSaved(t('students.messages.created'))
      }

      onClose()
    } catch (reason) {
      if (isAxiosError(reason) && reason.response?.status === 422) {
        const details = reason.response.data?.errors as Record<string, string[]> | undefined

        if (details !== undefined) {
          const mapped: Record<string, string> = {}

          for (const [field, messages] of Object.entries(details)) {
            mapped[`student.${field}`] = messages[0]
          }

          setFieldErrors(mapped)
        }
      } else {
        setGeneralError(t('students.messages.error_generic'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    t('students.form.wizard_step_1'),
    t('students.form.wizard_step_2'),
    t('students.form.wizard_step_3'),
    t('students.form.wizard_step_4'),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(isEditing ? 'students.form.edit_title' : 'students.form.create_title')}
      size="wide"
    >
      <form className="ed-form" onSubmit={(event) => void submit(event)}>
        {/* Stepper */}
        <nav className="ed-stepper" aria-label={t('students.form.wizard_label')}>
          {steps.map((label, index) => {
            const completed = index < step
            const active = index === step

            return (
              <div key={label} className="ed-stepper__paso" aria-current={active ? 'step' : undefined}>
                {completed ? (
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    title={`${t('students.form.go_to')} ${label}`}
                    aria-label={`${t('students.form.go_to')} ${label}`}
                    className="ed-stepper__cabeza ed-stepper__cabeza--hecho"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <span
                    className={`ed-stepper__cabeza ${
                      active ? 'ed-stepper__cabeza--activo' : 'ed-stepper__cabeza--pendiente'
                    }`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={`ed-stepper__etiqueta ${
                    active ? 'ed-stepper__etiqueta--activo' : 'ed-stepper__etiqueta--pendiente'
                  }`}
                >
                  {label}
                </span>
                {index < TOTAL_STEPS - 1 && (
                  <div className="ed-stepper__barra" aria-hidden="true" />
                )}
              </div>
            )
          })}
        </nav>

        {/* Step 1: identification */}
        {step === 0 && (
          <div className="ed-wizard__paso">
            <h3 className="ed-seccion">
              {t('students.form.section_identification')}
            </h3>

            <div className="ed-malla ed-malla--tres">
              <Field
                label={t('students.form.document_type')}
                htmlFor="document_type"
                error={fieldErrors['student.document_type']}
              >
                <Select
                  id="document_type"
                  value={form.document_type}
                  onChange={(event) => updateField('document_type', event.target.value)}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`students.form.document_type_${type}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t('students.form.document_number')}
                htmlFor="document_number"
                hint={t('students.form.document_hint')}
                error={fieldErrors['student.document_number']}
              >
                <Input
                  id="document_number"
                  value={form.document_number}
                  inputMode="numeric"
                  onChange={(event) => updateField('document_number', event.target.value)}
                  required
                />
              </Field>

              <Field
                label={t('students.form.gender')}
                htmlFor="gender"
                error={fieldErrors['student.gender']}
              >
                <Select
                  id="gender"
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                >
                  <option value="">{t('students.form.placeholder_select')}</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {t(`students.form.gender_${gender}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t('students.form.first_name')}
                htmlFor="first_name"
                error={fieldErrors['student.first_name']}
              >
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(event) => updateField('first_name', event.target.value)}
                  required
                />
              </Field>

              <Field
                label={t('students.form.last_name')}
                htmlFor="last_name"
                error={fieldErrors['student.last_name']}
              >
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(event) => updateField('last_name', event.target.value)}
                  required
                />
              </Field>

              <Field
                label={t('students.form.birth_date')}
                htmlFor="birth_date"
                error={fieldErrors['student.birth_date']}
              >
                <Input
                  id="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={(event) => updateField('birth_date', event.target.value)}
                  required
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: current academic information */}
        {step === 1 && (
          <div className="ed-wizard__paso">
            <h3 className="ed-seccion">
              {t('students.form.section_academic')}
            </h3>

            <div className="ed-malla ed-malla--tres">
              <Field
                label={t('students.form.course')}
                htmlFor="course_id"
                error={fieldErrors['student.course_id']}
              >
                <Select id="course_id" value={form.course_id} onChange={(event) => updateField('course_id', event.target.value)}>
                  <option value="">{t('students.form.course_placeholder')}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('students.form.parallel')} htmlFor="parallel">
                <Input
                  id="parallel"
                  value={form.parallel}
                  placeholder="A"
                  onChange={(event) => updateField('parallel', event.target.value)}
                />
              </Field>

              <Field
                label={t('students.form.termino')}
                htmlFor="term_id"
                error={fieldErrors['student.term_id']}
              >
                <Select id="term_id" value={form.term_id} onChange={(event) => updateField('term_id', event.target.value)}>
                  <option value="">{t('students.form.termino_placeholder')}</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t('students.form.academic_status')}
                htmlFor="academic_status"
                error={fieldErrors['student.academic_status']}
              >
                <Select
                  id="academic_status"
                  value={form.academic_status}
                  onChange={(event) => updateField('academic_status', event.target.value)}
                >
                  {ACADEMIC_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`students.form.academic_status_${status}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* Step 3: contact and legal representative */}
        {step === 2 && (
          <div className="ed-wizard__paso">
            <h3 className="ed-seccion">
              {t('students.form.section_contact')}
            </h3>

            <div className="ed-malla ed-malla--tres">
              <Field
                label={t('students.form.representative_name')}
                htmlFor="representative_name"
              >
                <Input
                  id="representative_name"
                  value={form.representative_name}
                  onChange={(event) => updateField('representative_name', event.target.value)}
                />
              </Field>

              <Field
                label={t('students.form.representative_relation')}
                htmlFor="representative_relation"
              >
                <Input
                  id="representative_relation"
                  value={form.representative_relation}
                  placeholder={t('students.form.representative_relation_placeholder')}
                  onChange={(event) => updateField('representative_relation', event.target.value)}
                />
              </Field>

              <Field
                label={t('students.form.contact_phone')}
                htmlFor="contact_phone"
              >
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(event) => updateField('contact_phone', event.target.value)}
                />
              </Field>

              <Field
                label={t('students.form.contact_email')}
                htmlFor="contact_email"
                error={fieldErrors['student.contact_email']}
              >
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(event) => updateField('contact_email', event.target.value)}
                />
              </Field>

              <Field
                label={t('students.form.home_address')}
                htmlFor="home_address"
              >
                <Input
                  id="home_address"
                  value={form.home_address}
                  onChange={(event) => updateField('home_address', event.target.value)}
                />
              </Field>
            </div>

            <label className="ed-toggle ed-toggle--entre">
              <span className="ed-toggle__texto">
                {t('students.form.is_active')}
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateField('is_active', event.target.checked)}
                className="ed-checkbox"
              />
            </label>
          </div>
        )}

        {/* Step 4: health */}
        {step === 3 && (
          <div className="ed-wizard__paso">
            <h3 className="ed-seccion">
              {t('students.form.section_health')}
            </h3>

            <div className="ed-malla">
              <Field
                label={t('students.form.laterality')}
                htmlFor="laterality"
                error={fieldErrors['student.laterality']}
              >
                <Select
                  id="laterality"
                  value={form.laterality}
                  onChange={(event) => updateField('laterality', event.target.value)}
                >
                  <option value="">{t('students.form.placeholder_select')}</option>
                  {LATERALITIES.map((lateralidad) => (
                    <option key={lateralidad} value={lateralidad}>
                      {t(`students.form.laterality_${lateralidad}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t('students.form.medical_conditions')}
                htmlFor="medical_conditions"
                error={fieldErrors['student.medical_conditions']}
              >
                <textarea
                  id="medical_conditions"
                  value={form.medical_conditions}
                  onChange={(event) => updateField('medical_conditions', event.target.value)}
                  placeholder={t('students.form.medical_conditions_placeholder')}
                  rows={4}
                  className="ed-textarea"
                />
              </Field>
            </div>
          </div>
        )}

        <p className="ed-pista" aria-live="polite">
          {t('students.form.step_of', { actual: step + 1, total: TOTAL_STEPS })}
        </p>

        {generalError !== null && (
          <p className="ed-alerta">
            {generalError}
          </p>
        )}

        <div className="ed-acciones ed-acciones--entre">
          <Button variant="ghost" type="button" onClick={onClose} className="ed-acciones__ancho">
            {t('students.confirm.cancel')}
          </Button>

          <div className="ed-acciones__grupo">
            {step > 0 && (
              <Button
                variant="secondary"
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="ed-acciones__ancho"
                title={t('students.form.previous')}
                aria-label={t('students.form.previous')}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('students.form.previous')}
              </Button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="ed-acciones__ancho"
                title={t('students.form.next')}
                aria-label={t('students.form.next')}
              >
                {t('students.form.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                loading={submitting}
                className="ed-acciones__ancho"
                title={submitting ? t('students.form.saving') : t('students.form.save')}
                aria-label={submitting ? t('students.form.saving') : t('students.form.save')}
              >
                <Save className="h-4 w-4" />
                {submitting ? t('students.form.saving') : t('students.form.save')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}