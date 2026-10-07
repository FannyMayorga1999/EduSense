import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { Download, FileUp, RotateCcw, Upload, X } from 'lucide-react'
import { importStudents } from '@/features/academic/features/students/api/students.service'
import { fetchCourses, fetchTerms } from '@/features/academic'
import type { AcademicResource } from '@/types'
import type { ImportResult } from '../types'
import Modal from '@/shared/components/ui/Modal'
import Field from '@/shared/components/ui/Field'
import Select from '@/shared/components/ui/Select'
import Button from '@/shared/components/ui/Button'
import Badge from '@/shared/components/ui/Badge'
import { useAlert } from '@/shared/components/ui/alertContext'

/**
 * Bulk student import modal (CSV). Lets the user choose the separator,
 * optionally enroll into a course/term and shows the import summary with the
 * per-row errors.
 *
 * @author Fanny Mayorga
 */

interface StudentImportModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export default function StudentImportModal({ open, onClose, onImported }: StudentImportModalProps) {
  const { t } = useTranslation()
  const { push } = useAlert()

  const [file, setFile] = useState<File | null>(null)
  const [separator, setSeparator] = useState<string>(';')
  const [enroll, setEnroll] = useState<boolean>(false)
  const [courseId, setCourseId] = useState<string>('')
  const [termId, setTermId] = useState<string>('')
  const [courses, setCourses] = useState<AcademicResource[]>([])
  const [terms, setTerms] = useState<AcademicResource[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setFile(null)
    setSeparator(';')
    setEnroll(false)
    setCourseId('')
    setTermId('')
    setSubmitting(false)
    setError(null)
    setResult(null)

    void fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
    void fetchTerms()
      .then(setTerms)
      .catch(() => setTerms([]))
  }, [open])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError(null)
  }

  const downloadTemplate = (): void => {
    const header = 'document_number,first_name,last_name,birth_date'
    const example = '1712345678,María,José,2015-03-12'
    const blob = new Blob([`\uFEFF${header}\n${example}\n`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'plantilla_estudiantes.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    if (file === null) {
      const message = t('students.import.file_required')
      setError(message)
      push(message, { variant: 'info-needed' })

      return
    }

    if (enroll && (courseId === '' || termId === '')) {
      const message = t('students.import.enroll_incomplete')
      setError(message)
      push(message, { variant: 'info-needed' })

      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const summary = await importStudents(
        file,
        separator,
        enroll ? { course_id: Number(courseId), term_id: Number(termId) } : undefined,
      )

      setResult(summary)
      onImported()
      push(t('students.import.success', { count: summary.created }), { variant: 'completed' })
    } catch (reason) {
      const message = isAxiosError(reason)
        ? t('students.import.error_validation')
        : t('students.import.error_generic')
      setError(message)
      push(message, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const reset = (): void => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const formFooter = (
    <div className="ed-acciones ed-acciones--simple">
      <Button
        variant="ghost"
        iconOnly
        type="button"
        onClick={downloadTemplate}
        title={t('students.import.download_template')}
        aria-label={t('students.import.download_template')}
      >
        <Download className="h-4 w-4" />
      </Button>

      <Button variant="secondary" type="button" onClick={onClose} className="ed-acciones__ancho">
        <X className="h-4 w-4" />
        {t('students.confirm.cancel')}
      </Button>

      <Button
        type="submit"
        iconOnly
        loading={submitting}
        title={t('students.import.upload')}
        aria-label={t('students.import.upload')}
      >
        <Upload className="h-4 w-4" />
      </Button>
    </div>
  )

  const resultFooter = (
    <div className="ed-acciones ed-acciones--simple">
      <Button
        variant="ghost"
        iconOnly
        type="button"
        onClick={reset}
        title={t('students.import.another')}
        aria-label={t('students.import.another')}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button variant="secondary" type="button" onClick={onClose} className="ed-acciones__ancho">
        <X className="h-4 w-4" />
        {t('students.import.close')}
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('students.import.title')}
      size="wide"
      as={result === null ? 'form' : 'div'}
      onSubmit={result === null ? (event) => void submit(event) : undefined}
      footer={result === null ? formFooter : resultFooter}
    >
      {result === null ? (
        <>
          <div className="ed-aviso">
            {t('students.import.hint')}
          </div>

          <Field label={t('students.import.file')}>
            <label className="ed-dropzone">
              <FileUp className="ed-dropzone__icono" />
              <span className="truncate">{file !== null ? file.name : t('students.import.choose')}</span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={handleFileChange} />
            </label>
          </Field>

          <div className="ed-malla">
            <Field label={t('students.import.separator')} htmlFor="separator">
              <Select id="separator" value={separator} onChange={(event) => setSeparator(event.target.value)}>
                <option value=",">{t('students.import.separator_comma')}</option>
                <option value=";">{t('students.import.separator_semicolon')}</option>
              </Select>
            </Field>
          </div>

          <label className="ed-toggle">
            <input
              type="checkbox"
              checked={enroll}
              onChange={(event) => setEnroll(event.target.checked)}
              className="ed-checkbox"
            />
            <span className="ed-toggle__texto">{t('students.import.enroll')}</span>
          </label>

          {enroll && (
            <div className="ed-malla">
              <Field label={t('students.import.course')} htmlFor="course">
                <Select id="course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                  <option value="">{t('students.import.course_placeholder')}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('students.import.term')} htmlFor="term">
                <Select id="term" value={termId} onChange={(event) => setTermId(event.target.value)}>
                  <option value="">{t('students.import.term_placeholder')}</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {error !== null && (
            <p className="ed-alerta">
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="ed-resultado__badges">
            <Badge tone="emerald">{t('students.import.created', { count: result.created })}</Badge>
            <Badge tone="sky">{t('students.import.updated', { count: result.updated })}</Badge>
            <Badge tone={result.failed > 0 ? 'rose' : 'stone'}>
              {t('students.import.failed', { count: result.failed })}
            </Badge>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('students.import.errors_title')}</p>
              <ol className="ed-lista-errores">
                {result.errors.map((rowError, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="ed-lista-errores__punto">&bull;</span>
                    {rowError}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}