import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { ChevronLeft, ChevronRight, Save, UserRound, X } from 'lucide-react'
import {
  createStudent,
  fetchStudent,
  updateStudent,
} from '@/features/academic/features/students/api/students.service'
import { fetchCourses, fetchTerms } from '@/features/academic'
import { documentTypeTone } from '@/features/academic/features/students/utils/documentType'
import { errorMessageForStatus } from '@/features/academic/features/students/utils/errors'
import type { AcademicResource } from '@/types'
import type { Student, StudentDetail, StudentForm } from '../types'
import Field from '@/shared/components/ui/Field'
import Input from '@/shared/components/ui/Input'
import Select from '@/shared/components/ui/Select'
import Button from '@/shared/components/ui/Button'
import Badge from '@/shared/components/ui/Badge'
import { useAlert } from '@/shared/components/ui/alertContext'

/**
 * 3-step form to create/edit a student (identification, current academic
 * information and contact/legal representative). It is rendered inside the
 * wizard modal in its sections variant, or as a wizard in narrower hosts.
 * The parent owns the onSaved/onCancel behaviors.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface StudentFormHandle {
  submit: () => void
}

interface StudentFormFooterHandlers {
  onCancel: () => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  step: number
  totalSteps: number
  submitting: boolean
  canGoBack: boolean
  canGoNext: boolean
  isLastStep: boolean
}

interface StudentFormProps {
  student: Student | null
  onSaved: (message: string) => void
  onCancel: () => void
  variant?: 'wizard' | 'sections'
  renderFooter?: (handlers: StudentFormFooterHandlers) => ReactNode
}

const TOTAL_STEPS = 3

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
  course_id: '',
  term_id: '',
  parallel: '',
  academic_status: 'active',
  is_active: true,
}

const DOCUMENT_TYPES = ['cedula', 'pasaporte', 'dni'] as const
const GENDERS = ['male', 'female', 'other'] as const
const ACADEMIC_STATUSES = ['active', 'inactive', 'graduated', 'retired'] as const

/**
 * Initial form state for create (empty) or edit (seeded from the student).
 */
function seedForm(student: Student | null): StudentForm {
  if (student === null) {
    return EMPTY_FORM
  }

  return {
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
    is_active: student.is_active,
  }
}

/**
 * Academic enrollment fields of the detail are fetched again because the
 * list item does not carry the current course/term ids.
 */
function fillAcademic(source: StudentDetail): Partial<StudentForm> {
  const enrollment = source.enrollments[0]

  return {
    course_id: enrollment?.course?.id !== undefined ? String(enrollment.course.id) : '',
    term_id: enrollment?.term?.id !== undefined ? String(enrollment.term.id) : '',
    parallel: enrollment?.parallel ?? '',
    academic_status: source.academic_status || 'active',
  }
}

export default function StudentForm({
  student,
  onSaved,
  onCancel,
  variant = 'wizard',
  renderFooter,
}: StudentFormProps) {
  const { t } = useTranslation()
  const { push } = useAlert()

  const [step, setStep] = useState<number>(0)
  const [form, setForm] = useState<StudentForm>(() => seedForm(student))
  const [courses, setCourses] = useState<AcademicResource[]>([])
  const [terms, setTerms] = useState<AcademicResource[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const isEditing = student !== null

  const nombreEnVivo = `${form.first_name} ${form.last_name}`.trim()
  const iniciales =
    `${form.first_name?.[0] ?? ''}${form.last_name?.[0] ?? ''}`.trim().toUpperCase()
  const nombreResumen =
    nombreEnVivo !== '' ? nombreEnVivo : t(isEditing ? 'students.form.edit_title' : 'students.form.create_title')

  useEffect(() => {
    let cancelled = false

    if (student !== null) {
      void fetchStudent(student.id)
        .then((context) => {
          if (!cancelled) {
            setForm((prev) => ({ ...prev, ...fillAcademic(context) }))
          }
        })
        .catch(() => {
          if (!cancelled) {
            setGeneralError(t('students.messages.load_error'))
          }
        })
    }

    void fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
    void fetchTerms(false)
      .then(setTerms)
      .catch(() => setTerms([]))

    return () => {
      cancelled = true
    }
  }, [student, t])

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

  const isSections = variant === 'sections'

  /**
   * Sections mode validates every section at once so all the fields show
   * their errors together when the user clicks Save.
   */
  const validateAll = (): Record<string, string> => ({
    ...validateStep(0),
    ...validateStep(1),
    ...validateStep(2),
  })

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    const errors = isSections ? validateAll() : validateStep(step)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      push(t('students.messages.error_validation'), { variant: 'info-needed' })

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
    } catch (reason) {
      if (!isAxiosError(reason)) {
        const message = t('students.messages.error_generic')
        setGeneralError(message)
        push(message, { variant: 'error' })

        return
      }

      const status = reason.response?.status ?? null

      if (status === 422) {
        const details = reason.response?.data?.errors as Record<string, string[]> | undefined
        const mapped: Record<string, string> = {}

        if (details !== undefined) {
          for (const [field, messages] of Object.entries(details)) {
            mapped[`student.${field}`] = messages[0]
          }
        }

        setFieldErrors(mapped)

        // A 422 without field messages would otherwise leave the form silent.
        if (Object.keys(mapped).length === 0) {
          const message =
            (reason.response?.data?.message as string | undefined) ??
            t('students.messages.error_validation')
          setGeneralError(message)
          push(message, { variant: 'info-needed' })
        } else {
          push(t('students.messages.error_validation'), { variant: 'info-needed' })
        }

        return
      }

      const message = errorMessageForStatus(status, t)
      setGeneralError(message)
      push(message, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="student-form" className="ed-form" onSubmit={(event) => void submit(event)}>
      {!isSections && (
        <>
          {/* Entity summary */}
          <div className="ed-resumen">
            <span className="ed-resumen__avatar" aria-hidden="true">
              {iniciales !== '' ? iniciales : <UserRound className="h-7 w-7" />}
            </span>
            <div className="ed-resumen__info">
              <span className="ed-resumen__nombre">{nombreResumen}</span>
              <div className="ed-resumen__badges">
                <Badge tone={documentTypeTone(form.document_type)}>
                  {t(`students.form.document_type_${form.document_type}`)}
                </Badge>
                {form.is_active ? (
                  form.academic_status === 'graduated' ? (
                    <Badge tone="sky">{t('students.form.academic_status_graduated')}</Badge>
                  ) : form.academic_status === 'retired' ? (
                    <Badge tone="amber">{t('students.form.academic_status_retired')}</Badge>
                  ) : (
                    <Badge tone="emerald">{t('students.form.academic_status_active')}</Badge>
                  )
                ) : (
                  <Badge tone="stone">{t('students.form.academic_status_inactive')}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Linear progress bar */}
          <div
            className="ed-progress"
            role="progressbar"
            aria-label={t('students.form.wizard_label')}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step + 1}
          >
            <div className="ed-progress__track" aria-hidden="true">
              {Array.from({ length: TOTAL_STEPS }, (_, index) => (
                <div
                  key={index}
                  className={`ed-progress__segmento ${index <= step ? 'ed-progress__segmento--activo' : ''}`}
                />
              ))}
            </div>
            <div className="ed-progress__meta" aria-live="polite">
              <span>
                {t('students.form.step_of', { actual: step + 1, total: TOTAL_STEPS })} ·{' '}
                {t(`students.form.wizard_step_${step + 1}`)}
              </span>
              <span className="ed-progress__porcentaje">
                {t('students.form.progress_percent', {
                  percent: Math.round(((step + 1) / TOTAL_STEPS) * 100),
                })}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Step 1: identification */}
      {(isSections || step === 0) && (
        <div className="ed-wizard__paso">
          <h3 className="ed-seccion">
            {t('students.form.section_identification')}
          </h3>

          <div className="ed-malla ed-malla--dos">
            <Field
              label={t('students.form.document_type')}
              htmlFor="document_type"
              help={t('students.form.document_type_help')}
              hint={t('students.form.document_type_help')}
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
              help={t('students.form.document_hint')}
              hint={t('students.form.document_hint')}
              error={fieldErrors['student.document_number']}
            >
              <Input
                id="document_number"
                value={form.document_number}
                inputMode="numeric"
                onChange={(event) => updateField('document_number', event.target.value)}
              />
            </Field>

            <Field
              label={t('students.form.gender')}
              htmlFor="gender"
              help={t('students.form.gender_help')}
              hint={t('students.form.gender_help')}
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
              help={t('students.form.first_name_help')}
              hint={t('students.form.first_name_help')}
              error={fieldErrors['student.first_name']}
            >
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(event) => updateField('first_name', event.target.value)}
              />
            </Field>

            <Field
              label={t('students.form.last_name')}
              htmlFor="last_name"
              help={t('students.form.last_name_help')}
              hint={t('students.form.last_name_help')}
              error={fieldErrors['student.last_name']}
            >
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(event) => updateField('last_name', event.target.value)}
              />
            </Field>

            <Field
              label={t('students.form.birth_date')}
              htmlFor="birth_date"
              help={t('students.form.birth_date_help')}
              hint={t('students.form.birth_date_help')}
              error={fieldErrors['student.birth_date']}
            >
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date}
                onChange={(event) => updateField('birth_date', event.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 2: current academic information */}
      {(isSections || step === 1) && (
        <div className={`ed-wizard__paso ${isSections ? 'mt-8' : ''}`}>
          <h3 className="ed-seccion">
            {t('students.form.section_academic')}
          </h3>

          <div className="ed-malla ed-malla--dos">
            <Field
              label={t('students.form.course')}
              htmlFor="course_id"
              help={t('students.form.course_help')}
              hint={t('students.form.course_help')}
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

            <Field
              label={t('students.form.parallel')}
              htmlFor="parallel"
              help={t('students.form.parallel_help')}
              hint={t('students.form.parallel_help')}
            >
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
              help={t('students.form.termino_help')}
              hint={t('students.form.termino_help')}
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
              help={t('students.form.academic_status_help')}
              hint={t('students.form.academic_status_help')}
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
      {(isSections || step === 2) && (
        <div className={`ed-wizard__paso ${isSections ? 'mt-8' : ''}`}>
          <h3 className="ed-seccion">
            {t('students.form.section_contact')}
          </h3>

          <div className="ed-malla ed-malla--dos">
            <Field
              label={t('students.form.representative_name')}
              htmlFor="representative_name"
              help={t('students.form.representative_name_help')}
              hint={t('students.form.representative_name_help')}
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
              help={t('students.form.representative_relation_help')}
              hint={t('students.form.representative_relation_help')}
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
              help={t('students.form.contact_phone_help')}
              hint={t('students.form.contact_phone_help')}
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
              help={t('students.form.contact_email_help')}
              hint={t('students.form.contact_email_help')}
              error={fieldErrors['student.contact_email']}
            >
              <Input
                id="contact_email"
                type="text"
                value={form.contact_email}
                onChange={(event) => updateField('contact_email', event.target.value)}
              />
            </Field>

            <Field
              label={t('students.form.home_address')}
              htmlFor="home_address"
              help={t('students.form.home_address_help')}
              hint={t('students.form.home_address_help')}
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

      {generalError !== null && (
        <p className="ed-alerta">
          {generalError}
        </p>
      )}

      {!isSections && (
        renderFooter !== undefined ? (
          renderFooter({
            onCancel,
            onBack: goBack,
            onNext: goNext,
            onSubmit: () => void submit({ preventDefault: () => {} } as FormEvent),
            step,
            totalSteps: TOTAL_STEPS,
            submitting,
            canGoBack: step > 0,
            canGoNext: step < TOTAL_STEPS - 1,
            isLastStep: step === TOTAL_STEPS - 1,
          })
        ) : (
          <div className="ed-acciones ed-acciones--entre">
            <Button variant="secondary" type="button" onClick={onCancel} className="ed-acciones__ancho">
              <X className="h-4 w-4" />
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
        )
      )}
    </form>
  )
}

export type { StudentFormHandle, StudentFormFooterHandlers }