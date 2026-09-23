import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { Download, FileUp, RotateCcw, Upload } from 'lucide-react'
import Modal from '../ui/Modal'
import Field from '../ui/Field'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { importarEstudiantes, obtenerCursos, obtenerTerminos } from '../../api'
import type { RecursoAcademico, ResultadoImport } from '../../types'

/**
 * Modal de carga masiva de estudiantes (CSV). Permite elegir el separador,
 * matricular opcionalmente al curso/período y muestra el resumen de la
 * importación con los errores por fila.
 *
 * @author Fanny Mayorga
 */

interface StudentImportModalProps {
  abierto: boolean
  onCerrar: () => void
  onImportado: () => void
}

export default function StudentImportModal({ abierto, onCerrar, onImportado }: StudentImportModalProps) {
  const { t } = useTranslation()

  const [archivo, setArchivo] = useState<File | null>(null)
  const [separador, setSeparador] = useState<string>(';')
  const [matricular, setMatricular] = useState<boolean>(false)
  const [cursoId, setCursoId] = useState<string>('')
  const [terminoId, setTerminoId] = useState<string>('')
  const [cursos, setCursos] = useState<RecursoAcademico[]>([])
  const [terminos, setTerminos] = useState<RecursoAcademico[]>([])
  const [enviando, setEnviando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImport | null>(null)

  useEffect(() => {
    if (!abierto) {
      return
    }

    setArchivo(null)
    setSeparador(';')
    setMatricular(false)
    setCursoId('')
    setTerminoId('')
    setEnviando(false)
    setError(null)
    setResultado(null)

    void obtenerCursos().then(setCursos).catch(() => setCursos([]))
    void obtenerTerminos().then(setTerminos).catch(() => setTerminos([]))
  }, [abierto])

  const elegirArchivo = (evento: ChangeEvent<HTMLInputElement>): void => {
    setArchivo(evento.target.files?.[0] ?? null)
    setResultado(null)
    setError(null)
  }

  const descargarPlantilla = (): void => {
    const encabezado = 'document_number,first_name,last_name,birth_date'
    const ejemplo = '1712345678,María,José,2015-03-12'
    const blob = new Blob([`\uFEFF${encabezado}\n${ejemplo}\n`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')

    enlace.href = url
    enlace.download = 'plantilla_estudiantes.csv'
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()

    if (archivo === null) {
      setError(t('students.import.file_required'))

      return
    }

    if (matricular && (cursoId === '' || terminoId === '')) {
      setError(t('students.import.enroll_incomplete'))

      return
    }

    setEnviando(true)
    setError(null)

    try {
      const resumen = await importarEstudiantes(
        archivo,
        separador,
        matricular ? { course_id: Number(cursoId), term_id: Number(terminoId) } : undefined,
      )

      setResultado(resumen)
      onImportado()
    } catch (motivo) {
      if (isAxiosError(motivo)) {
        setError(t('students.import.error_validation'))
      } else {
        setError(t('students.import.error_generic'))
      }
    } finally {
      setEnviando(false)
    }
  }

  const reiniciar = (): void => {
    setArchivo(null)
    setResultado(null)
    setError(null)
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={t('students.import.title')}>
      {resultado === null ? (
        <form className="space-y-4" onSubmit={(evento) => void enviar(evento)}>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-relaxed text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
            {t('students.import.hint')}
          </div>

          <Field etiqueta={t('students.import.file')}>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-white px-4 py-6 text-sm font-medium text-stone-500 transition hover:border-primary-400 hover:text-primary-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-primary-500">
              <FileUp className="h-5 w-5" />
              <span className="truncate">{archivo !== null ? archivo.name : t('students.import.choose')}</span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={elegirArchivo} />
            </label>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field etiqueta={t('students.import.separator')} htmlPara="separator">
              <Select id="separator" value={separador} onChange={(evento) => setSeparador(evento.target.value)}>
                <option value=",">{t('students.import.separator_comma')}</option>
                <option value=";">{t('students.import.separator_semicolon')}</option>
              </Select>
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 dark:border-stone-700 dark:bg-stone-900">
            <input
              type="checkbox"
              checked={matricular}
              onChange={(evento) => setMatricular(evento.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('students.import.enroll')}</span>
          </label>

          {matricular && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field etiqueta={t('students.import.course')} htmlPara="course">
                <Select id="course" value={cursoId} onChange={(evento) => setCursoId(evento.target.value)}>
                  <option value="">{t('students.import.course_placeholder')}</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field etiqueta={t('students.import.term')} htmlPara="term">
                <Select id="term" value={terminoId} onChange={(evento) => setTerminoId(evento.target.value)}>
                  <option value="">{t('students.import.term_placeholder')}</option>
                  {terminos.map((termino) => (
                    <option key={termino.id} value={termino.id}>
                      {termino.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {error !== null && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button variante="ghost" tamano="sm" type="button" onClick={descargarPlantilla}>
              <Download className="h-4 w-4" />
              {t('students.import.download_template')}
            </Button>

            <Button variante="secondary" type="button" onClick={onCerrar}>
              {t('students.confirm.cancel')}
            </Button>

            <Button type="submit" cargando={enviando}>
              <Upload className="h-4 w-4" />
              {enviando ? t('students.import.uploading') : t('students.import.upload')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tono="emerald">{t('students.import.created', { count: resultado.created })}</Badge>
            <Badge tono="sky">{t('students.import.updated', { count: resultado.updated })}</Badge>
            <Badge tono={resultado.failed > 0 ? 'rose' : 'stone'}>
              {t('students.import.failed', { count: resultado.failed })}
            </Badge>
          </div>

          {resultado.errors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('students.import.errors_title')}</p>
              <ol className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                {resultado.errors.map((errorFila, indice) => (
                  <li key={indice} className="flex gap-2">
                    <span className="shrink-0 text-rose-500">&bull;</span>
                    {errorFila}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button variante="ghost" tamano="sm" type="button" onClick={reiniciar}>
              <RotateCcw className="h-4 w-4" />
              {t('students.import.another')}
            </Button>

            <Button type="button" onClick={onCerrar}>
              {t('students.import.close')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}