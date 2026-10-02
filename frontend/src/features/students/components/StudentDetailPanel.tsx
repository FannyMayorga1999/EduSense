import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, UserCheck, UserX } from 'lucide-react'
import type { StudentDetail, StudentListItem } from '@/types'
import { fetchStudent } from '@/features/students/services/students.service'
import { formatDate } from '@/utils/format'
import SidePanel from '@/components/ui/SidePanel'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Tooltip from '@/components/ui/Tooltip'
import { documentTypeTone } from '@/features/students/utils/documentType'
import StudentForm from '@/features/students/components/StudentForm'

/**
 * Side panel that shows all the information of a student and allows editing
 * it in place. The panel has two modes (`view`/`edit`) controlled by the
 * parent hook: view renders the full detail, edit embeds the student wizard.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface StudentDetailPanelProps {
  open: boolean
  student: StudentListItem | null
  mode: 'view' | 'edit'
  canEdit: boolean
  canDelete: boolean
  refreshKey: number
  onClose: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSavedEdit: (message: string) => void
  onDeactivate: (student: StudentListItem) => void
  onReactivate: (student: StudentListItem) => void
}

function Campo({ label, children }: { label: string; children?: ReactNode }) {
  const hasValue =
    children !== undefined && children !== null && children !== ''
  return (
    <div className="ed-detalle__campo">
      <span className="ed-detalle__etiqueta">{label}</span>
      <div className="ed-detalle__valor">
        {hasValue ? children : <span className="ed-detalle__vacio">—</span>}
      </div>
    </div>
  )
}

function CondicionBadge({
  academicStatus,
  active,
  t,
}: {
  academicStatus: string
  active: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  if (!active) {
    return <Badge tone="stone">{t('students.form.academic_status_inactive')}</Badge>
  }

  if (academicStatus === 'graduated') {
    return <Badge tone="sky">{t('students.form.academic_status_graduated')}</Badge>
  }

  if (academicStatus === 'retired') {
    return <Badge tone="amber">{t('students.form.academic_status_retired')}</Badge>
  }

  return <Badge tone="emerald">{t('students.form.academic_status_active')}</Badge>
}

export default function StudentDetailPanel({
  open,
  student,
  mode,
  canEdit,
  canDelete,
  refreshKey,
  onClose,
  onEdit,
  onCancelEdit,
  onSavedEdit,
  onDeactivate,
  onReactivate,
}: StudentDetailPanelProps) {
  const { t } = useTranslation()

  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [failed, setFailed] = useState<boolean>(false)

  const id = student?.id ?? null

  useEffect(() => {
    if (!open || id === null) {
      setDetail(null)
      setFailed(false)

      return
    }

    let cancelled = false

    setLoading(true)
    setFailed(false)

    void fetchStudent(id)
      .then((context) => {
        if (!cancelled) {
          setDetail(context)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, id, refreshKey])

  const detailStudent = detail ?? student
  const source = detailStudent
  const currentEnrollment = detail ? detail.enrollments[0] : undefined
  const active = detail ? detail.is_active : (student?.is_active ?? false)

  const headerActions =
    mode === 'view' ? (
      <>
        {canEdit && (
          <Button size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t('students.detail.edit')}
          </Button>
        )}

        {canDelete && student !== null ? (
          active ? (
            <Tooltip label={t('students.actions.deactivate')}>
              <button
                type="button"
                onClick={() => onDeactivate(student)}
                aria-label={t('students.actions.deactivate')}
                className="ed-item-accion ed-item-accion--peligro"
              >
                <UserX className="h-4 w-4" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip label={t('students.actions.reactivate')}>
              <button
                type="button"
                onClick={() => onReactivate(student)}
                aria-label={t('students.actions.reactivate')}
                className="ed-item-accion ed-item-accion--ok"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            </Tooltip>
          )
        ) : null}
      </>
    ) : undefined

  const body = () => {
    if (mode === 'edit') {
      return (
        <StudentForm
          student={source}
          onSaved={onSavedEdit}
          onCancel={onCancelEdit}
          variant="sections"
        />
      )
    }

    if (loading) {
      return (
        <p className="ed-pista" role="status">
          {t('students.messages.loading')}
        </p>
      )
    }

    if (failed || detail === null) {
      return (
        <p className="ed-alerta" role="alert">
          {t('students.messages.load_error')}
        </p>
      )
    }

    const iniciales =
      `${detail.first_name?.[0] ?? ''}${detail.last_name?.[0] ?? ''}`.trim().toUpperCase() || '?'

    return (
      <div className="space-y-6">
        <header className="ed-detalle__hero">
          <span className="ed-detalle__avatar" aria-hidden="true">
            {iniciales}
          </span>
          <div className="ed-detalle__identificacion">
            <h3 className="ed-detalle__nombre">{detail.full_name}</h3>
            <div className="ed-detalle__badges">
              <CondicionBadge
                academicStatus={detail.academic_status}
                active={detail.is_active}
                t={t}
              />
              {currentEnrollment !== undefined &&
                currentEnrollment.course !== null && (
                  <Badge tone="teal">
                    {currentEnrollment.course.name}
                    {currentEnrollment.parallel !== null && currentEnrollment.parallel !== undefined
                      ? ` · ${currentEnrollment.parallel}`
                      : ''}
                  </Badge>
                )}
            </div>
          </div>
        </header>

        <div className="ed-detalle__tarjetas">
          <section className="ed-detalle__tarjeta" aria-label={t('students.form.section_identification')}>
          <h4 className="ed-seccion">{t('students.form.section_identification')}</h4>
          <div className="ed-detalle__grilla">
            <Campo label={t('students.form.document_type')}>
              <Badge tone={documentTypeTone(detail.document_type)}>
                {t(`students.form.document_type_${detail.document_type}`)}
              </Badge>
            </Campo>
            <Campo label={t('students.form.document_number')}>
              {detail.document_number}
            </Campo>
            <Campo label={t('students.form.birth_date')}>
              {formatDate(detail.birth_date)}
            </Campo>
            <Campo label={t('students.form.gender')}>
              {detail.gender !== null ? t(`students.form.gender_${detail.gender}`) : undefined}
            </Campo>
          </div>
        </section>

        <section className="ed-detalle__tarjeta" aria-label={t('students.form.section_academic')}>
          <h4 className="ed-seccion">{t('students.form.section_academic')}</h4>
          <div className="ed-detalle__grilla">
            <Campo label={t('students.table.grade')}>
              {currentEnrollment?.course?.name}
            </Campo>
            <Campo label={t('students.form.parallel')}>
              {currentEnrollment?.parallel}
            </Campo>
            <Campo label={t('students.form.termino')}>
              {currentEnrollment?.term?.name}
            </Campo>
            <Campo label={t('students.form.academic_status')}>
              {detail.academic_status !== ''
                ? t(`students.form.academic_status_${detail.academic_status}`)
                : undefined}
            </Campo>
          </div>

          {student !== null && (
            <div className="ed-detalle__contadores">
              <span>{student.psychopedagogic_records_count}</span>
              <span>{t('students.detail.records_count')}</span>
              <span aria-hidden="true">·</span>
              <span>{student.diagnostics_count}</span>
              <span>{t('students.detail.diagnostics_count')}</span>
              <span aria-hidden="true">·</span>
              <span>{student.intervention_schedules_count}</span>
              <span>{t('students.detail.interventions_count')}</span>
            </div>
          )}
        </section>

        <section className="ed-detalle__tarjeta" aria-label={t('students.form.section_contact')}>
          <h4 className="ed-seccion">{t('students.form.section_contact')}</h4>
          <div className="ed-detalle__grilla">
            <Campo label={t('students.form.representative_name')}>
              {detail.representative_name}
            </Campo>
            <Campo label={t('students.form.representative_relation')}>
              {detail.representative_relation}
            </Campo>
            <Campo label={t('students.form.contact_phone')}>
              {detail.contact_phone}
            </Campo>
            <Campo label={t('students.form.contact_email')}>
              {detail.contact_email}
            </Campo>
            <Campo label={t('students.form.home_address')}>
              {detail.home_address}
            </Campo>
            <Campo label={t('students.detail.tutor')}>
              {detail.tutor !== null && detail.tutor !== undefined
                ? `${detail.tutor.name}${detail.tutor.email !== '' ? ` · ${detail.tutor.email}` : ''}`
                : undefined}
            </Campo>
          </div>
        </section>

        <section className="ed-detalle__tarjeta" aria-label={t('students.form.section_health')}>
          <h4 className="ed-seccion">{t('students.form.section_health')}</h4>
          <div className="ed-detalle__grilla">
            <Campo label={t('students.form.laterality')}>
              {detail.laterality !== null
                ? t(`students.form.laterality_${detail.laterality}`)
                : undefined}
            </Campo>
            <Campo label={t('students.form.medical_conditions')}>
              {detail.medical_conditions}
            </Campo>
          </div>
        </section>

        {detail.enrollments.length > 1 && (
          <section
            className="ed-detalle__tarjeta ed-detalle__tarjeta--ancha"
            aria-label={t('students.detail.section_enrollments')}
          >
            <h4 className="ed-seccion">{t('students.detail.section_enrollments')}</h4>
            <ul className="ed-detalle__lista">
              {detail.enrollments.map((enrollment) => (
                <li key={enrollment.id} className="ed-detalle__item">
                  <span className="ed-detalle__item-tiempo">
                    {enrollment.term?.name ?? '—'}
                  </span>
                  <span className="ed-detalle__item-nombre">
                    {enrollment.course?.name ?? '—'}
                  </span>
                  <span className="ed-detalle__item-paralelo">
                    {enrollment.parallel ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
      </div>
    )
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? t('students.form.edit_title') : t('students.detail.title')}
      closeLabel={t('students.detail.close')}
      actions={headerActions}
    >
      {body()}
    </SidePanel>
  )
}