import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { Save } from 'lucide-react'
import Modal from '../ui/Modal'
import Field from '../ui/Field'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { actualizarEstudiante, crearEstudiante } from '../../api'
import type { Estudiante, EstudianteForm } from '../../types'

/**
 * Modal de creación/edición de un estudiante. Maneja los errores de campo
 * (422) y reutiliza el patrón del formulario de login.
 *
 * @author Fanny Mayorga
 */

interface StudentFormModalProps {
  abierto: boolean
  estudiante: Estudiante | null
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

const FORMULARIO_VACIO: EstudianteForm = {
  first_name: '',
  last_name: '',
  document_number: '',
  birth_date: '',
  is_active: true,
}

export default function StudentFormModal({
  abierto,
  estudiante,
  onCerrar,
  onGuardado,
}: StudentFormModalProps) {
  const { t } = useTranslation()

  const [formulario, setFormulario] = useState<EstudianteForm>(FORMULARIO_VACIO)
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<boolean>(false)

  useEffect(() => {
    if (!abierto) {
      return
    }

    setErroresCampo({})
    setErrorGeneral(null)
    setEnviando(false)

    setFormulario(
      estudiante !== null
        ? {
            first_name: estudiante.first_name,
            last_name: estudiante.last_name,
            document_number: estudiante.document_number ?? '',
            birth_date: estudiante.birth_date ?? '',
            is_active: estudiante.is_active,
          }
        : FORMULARIO_VACIO,
    )
  }, [abierto, estudiante])

  const cambiar = (campo: keyof EstudianteForm, valor: string | boolean): void => {
    setFormulario((previo) => ({ ...previo, [campo]: valor }))
    setErroresCampo((previo) => {
      const copia = { ...previo }
      delete copia[campo]
      return copia
    })
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()

    setEnviando(true)
    setErrorGeneral(null)
    setErroresCampo({})

    try {
      if (estudiante !== null) {
        await actualizarEstudiante(estudiante.id, formulario)
        onGuardado(t('students.messages.updated'))
      } else {
        await crearEstudiante(formulario)
        onGuardado(t('students.messages.created'))
      }

      onCerrar()
    } catch (motivo) {
      if (isAxiosError(motivo) && motivo.response?.status === 422) {
        const detalles = motivo.response.data?.errors as Record<string, string[]> | undefined

        if (detalles !== undefined) {
          const mapeadas: Record<string, string> = {}

          for (const [campo, mensajes] of Object.entries(detalles)) {
            mapeadas[`estudiante.${campo}`] = mensajes[0]
          }

          setErroresCampo(mapeadas)
        }
      } else {
        setErrorGeneral(t('students.messages.error_generic'))
      }
    } finally {
      setEnviando(false)
    }
  }

  const esEdicion = estudiante !== null

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={t(esEdicion ? 'students.form.edit_title' : 'students.form.create_title')}
    >
      <form className="space-y-4" onSubmit={(evento) => void enviar(evento)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            etiqueta={t('students.form.first_name')}
            htmlPara="first_name"
            error={erroresCampo['estudiante.first_name']}
          >
            <Input
              id="first_name"
              value={formulario.first_name}
              onChange={(evento) => cambiar('first_name', evento.target.value)}
              required
            />
          </Field>

          <Field
            etiqueta={t('students.form.last_name')}
            htmlPara="last_name"
            error={erroresCampo['estudiante.last_name']}
          >
            <Input
              id="last_name"
              value={formulario.last_name}
              onChange={(evento) => cambiar('last_name', evento.target.value)}
              required
            />
          </Field>
        </div>

        <Field
          etiqueta={t('students.form.document_number')}
          htmlPara="document_number"
          ayuda={t('students.form.document_hint')}
          error={erroresCampo['estudiante.document_number']}
        >
          <Input
            id="document_number"
            value={formulario.document_number}
            onChange={(evento) => cambiar('document_number', evento.target.value)}
            required
          />
        </Field>

        <Field
          etiqueta={t('students.form.birth_date')}
          htmlPara="birth_date"
          error={erroresCampo['estudiante.birth_date']}
        >
          <Input
            id="birth_date"
            type="date"
            value={formulario.birth_date}
            onChange={(evento) => cambiar('birth_date', evento.target.value)}
            required
          />
        </Field>

        {esEdicion && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 dark:border-stone-700 dark:bg-stone-900">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t('students.form.is_active')}
            </span>
            <input
              type="checkbox"
              checked={formulario.is_active}
              onChange={(evento) => cambiar('is_active', evento.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        )}

        {errorGeneral !== null && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
            {errorGeneral}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variante="secondary" type="button" onClick={onCerrar}>
            {t('students.confirm.cancel')}
          </Button>
          <Button type="submit" cargando={enviando}>
            <Save className="h-4 w-4" />
            {enviando ? t('students.form.saving') : t('students.form.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}