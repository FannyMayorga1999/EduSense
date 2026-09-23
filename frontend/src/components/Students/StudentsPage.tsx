import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Pencil, Plus, Search, Upload, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import {
  actualizarEstudiante,
  desactivarEstudiante,
  exportarEstudiantes,
  obtenerCursos,
  obtenerEstudiantes,
} from '../../api'
import type { EstudianteLista, Paginador, RecursoAcademico } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import Pagination from '../ui/Pagination'
import Modal from '../ui/Modal'
import StudentFormModal from './StudentFormModal'
import StudentImportModal from './StudentImportModal'

/**
 * Página del módulo de Estudiantes: listado filtrado (búsqueda, estado y
 * grado), CRUD por modal, carga masiva CSV y descarga CSV/XLSX. Las acciones
 * se muestran según los permisos del usuario autenticado.
 *
 * @author Fanny Mayorga
 */

const POR_PAGINA = 10

export default function StudentsPage() {
  const { t } = useTranslation()
  const { usuario } = useAuth()

  const esAdministrador = usuario?.roles.includes('administrator') ?? false
  const puede = (permiso: string): boolean =>
    esAdministrador || (usuario?.permissions ?? []).includes(permiso)

  const puedeCrear = puede('create_students')
  const puedeEditar = puede('edit_students')
  const puedeEliminar = puede('delete_students')
  const puedeImportar = puede('import_students')
  const puedeExportar = puede('export_students')
  const puedeVerCursos = puede('view_courses')

  const [datos, setDatos] = useState<Paginador<EstudianteLista> | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState<number>(0)

  const [busqueda, setBusqueda] = useState<string>('')
  const [busquedaAplicada, setBusquedaAplicada] = useState<string>('')
  const [estado, setEstado] = useState<string>('')
  const [grado, setGrado] = useState<string>('')
  const [pagina, setPagina] = useState<number>(1)
  const [cursos, setCursos] = useState<RecursoAcademico[]>([])

  const [formAbierto, setFormAbierto] = useState<boolean>(false)
  const [editando, setEditando] = useState<EstudianteLista | null>(null)
  const [importAbierto, setImportAbierto] = useState<boolean>(false)
  const [confirmando, setConfirmando] = useState<boolean>(false)
  const [confirmaAccion, setConfirmaAccion] = useState<{
    tipo: 'deactivate' | 'reactivate'
    estudiante: EstudianteLista
  } | null>(null)
  const [banner, setBanner] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    const tiempo = window.setTimeout(() => setPagina(1), 50)
    const aplazado = window.setTimeout(() => setBusquedaAplicada(busqueda.trim()), 400)

    return () => {
      window.clearTimeout(tiempo)
      window.clearTimeout(aplazado)
    }
  }, [busqueda])

  useEffect(() => {
    if (!puedeVerCursos) {
      return
    }

    obtenerCursos().then(setCursos).catch(() => setCursos([]))
  }, [puedeVerCursos])

  useEffect(() => {
    let activo = true

    setCargando(true)
    setError(null)

    const consulta = {
      page: pagina,
      per_page: POR_PAGINA,
      search: busquedaAplicada === '' ? undefined : busquedaAplicada,
      is_active: estado === '' ? undefined : estado,
      grade: grado === '' ? undefined : grado,
    }

    obtenerEstudiantes(consulta)
      .then((resumen) => {
        if (activo) {
          setDatos(resumen)
          setCargando(false)
        }
      })
      .catch(() => {
        if (activo) {
          setError(t('students.messages.load_error'))
          setCargando(false)
        }
      })

    return () => {
      activo = false
    }
  }, [pagina, estado, grado, busquedaAplicada, recarga, t])

  useEffect(() => {
    if (banner === null) {
      return
    }

    const id = window.setTimeout(() => setBanner(null), 5000)

    return () => window.clearTimeout(id)
  }, [banner])

  const abrirNuevo = useCallback((): void => {
    setEditando(null)
    setFormAbierto(true)
  }, [])

  const abrirEdicion = useCallback((estudiante: EstudianteLista): void => {
    setEditando(estudiante)
    setFormAbierto(true)
  }, [])

  const manejarGuardado = useCallback((mensaje: string): void => {
    setFormAbierto(false)
    setEditando(null)
    setBanner({ tipo: 'ok', texto: mensaje })
    setRecarga((valor) => valor + 1)
  }, [])

  const manejarImportado = useCallback((): void => {
    setRecarga((valor) => valor + 1)
  }, [])

  const exportar = useCallback(
    async (formato: 'csv' | 'xlsx'): Promise<void> => {
      try {
        await exportarEstudiantes(
          {
            search: busquedaAplicada === '' ? undefined : busquedaAplicada,
            is_active: estado === '' ? undefined : estado,
            grade: grado === '' ? undefined : grado,
          },
          formato,
        )
      } catch {
        setBanner({ tipo: 'error', texto: t('students.messages.export_error') })
      }
    },
    [busquedaAplicada, estado, grado, t],
  )

  const confirmarAccion = async (): Promise<void> => {
    if (confirmaAccion === null) {
      return
    }

    const { tipo, estudiante } = confirmaAccion

    setConfirmando(true)

    try {
      if (tipo === 'deactivate') {
        await desactivarEstudiante(estudiante.id)
        setBanner({ tipo: 'ok', texto: t('students.messages.deactivated') })
      } else {
        await actualizarEstudiante(estudiante.id, {
          first_name: estudiante.first_name,
          last_name: estudiante.last_name,
          document_number: estudiante.document_number ?? '',
          birth_date: estudiante.birth_date ?? '',
          is_active: true,
        })
        setBanner({ tipo: 'ok', texto: t('students.messages.reactivated') })
      }

      setConfirmaAccion(null)
      setRecarga((valor) => valor + 1)
    } catch {
      setBanner({ tipo: 'error', texto: t('students.messages.error_generic') })
      setConfirmaAccion(null)
    } finally {
      setConfirmando(false)
    }
  }

  const totalPaginas = datos?.last_page ?? 1

  return (
    <section className="space-y-6" aria-label={t('students.title')}>
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t('students.title')}</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('students.subtitle')}</p>
      </div>

      {banner !== null && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            banner.tipo === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          {banner.texto}
        </div>
      )}

      {error !== null && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
        {/* Barra de filtros y acciones */}
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 dark:border-stone-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder={t('students.search_placeholder')}
                className="pl-9"
                aria-label={t('students.search_placeholder')}
              />
            </div>

            <Select
              value={estado}
              onChange={(evento) => setEstado(evento.target.value)}
              className="sm:w-40"
              aria-label={t('students.filter_status')}
            >
              <option value="">{t('students.status_all')}</option>
              <option value="1">{t('students.status_active')}</option>
              <option value="0">{t('students.status_inactive')}</option>
            </Select>

            {puedeVerCursos && cursos.length > 0 && (
              <Select
                value={grado}
                onChange={(evento) => setGrado(evento.target.value)}
                className="sm:w-48"
                aria-label={t('students.filter_grade')}
              >
                <option value="">{t('students.grade_all')}</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.name}>
                    {curso.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {puedeImportar && (
              <Button variante="secondary" tamano="sm" onClick={() => setImportAbierto(true)}>
                <Upload className="h-4 w-4" />
                {t('students.upload')}
              </Button>
            )}

            {puedeExportar && (
              <>
                <Button variante="secondary" tamano="sm" onClick={() => void exportar('csv')}>
                  <Download className="h-4 w-4" />
                  {t('students.download_csv')}
                </Button>
                <Button variante="secondary" tamano="sm" onClick={() => void exportar('xlsx')}>
                  <Download className="h-4 w-4" />
                  {t('students.download_xlsx')}
                </Button>
              </>
            )}

            {puedeCrear && (
              <Button tamano="sm" onClick={abrirNuevo}>
                <Plus className="h-4 w-4" />
                {t('students.new')}
              </Button>
            )}
          </div>
        </div>

        {/* Tabla de estudiantes */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-700">
            <thead className="bg-stone-50 dark:bg-stone-900">
              <tr>
                {(['document', 'full_name', 'grade', 'birth_date', 'status', 'actions'] as const).map((columna) => (
                  <th
                    key={columna}
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-stone-300"
                  >
                    {t(`students.table.${columna}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {cargando ? (
                Array.from({ length: 5 }).map((_, indice) => (
                  <tr key={indice}>
                    {Array.from({ length: 6 }).map((__, celda) => (
                      <td key={celda} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded-md bg-stone-200 dark:bg-stone-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (datos?.data.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">
                    {t('students.table.empty')}
                  </td>
                </tr>
              ) : (
                (datos?.data ?? []).map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/40">
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-300">
                      {estudiante.document_number ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900 dark:text-white">
                      {estudiante.full_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-300">
                      {estudiante.enrollments[0]?.course?.name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-300">
                      {estudiante.birth_date?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {estudiante.is_active ? (
                        <Badge tono="emerald">{t('students.status_active')}</Badge>
                      ) : (
                        <Badge tono="stone">{t('students.status_inactive')}</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        {puedeEditar && (
                          <button
                            type="button"
                            onClick={() => abrirEdicion(estudiante)}
                            title={t('students.actions.edit')}
                            aria-label={t('students.actions.edit')}
                            className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-primary-600 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        {estudiante.is_active && puedeEliminar && (
                          <button
                            type="button"
                            onClick={() => setConfirmaAccion({ tipo: 'deactivate', estudiante })}
                            title={t('students.actions.deactivate')}
                            aria-label={t('students.actions.deactivate')}
                            className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}

                        {!estudiante.is_active && puedeEditar && (
                          <button
                            type="button"
                            onClick={() => setConfirmaAccion({ tipo: 'reactivate', estudiante })}
                            title={t('students.actions.reactivate')}
                            aria-label={t('students.actions.reactivate')}
                            className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:bg-emerald-50 hover:text-emerald-600 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          onCambiar={setPagina}
          etiquetaPagina={t('students.pagination.page', { actual: pagina, total: totalPaginas })}
          etiquetaAnterior={t('students.pagination.previous')}
          etiquetaSiguiente={t('students.pagination.next')}
        />
      </div>

      <StudentFormModal
        abierto={formAbierto}
        estudiante={editando}
        onCerrar={() => {
          setFormAbierto(false)
          setEditando(null)
        }}
        onGuardado={manejarGuardado}
      />

      <StudentImportModal
        abierto={importAbierto}
        onCerrar={() => setImportAbierto(false)}
        onImportado={manejarImportado}
      />

      <Modal
        abierto={confirmaAccion !== null}
        onCerrar={() => setConfirmaAccion(null)}
        titulo={t(
          confirmaAccion?.tipo === 'deactivate'
            ? 'students.confirm.deactivate_title'
            : 'students.confirm.reactivate_title',
        )}
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t(
              confirmaAccion?.tipo === 'deactivate'
                ? 'students.confirm.deactivate_message'
                : 'students.confirm.reactivate_message',
              { name: confirmaAccion?.estudiante.full_name ?? '' },
            )}
          </p>

          <div className="flex justify-end gap-2">
            <Button variante="secondary" onClick={() => setConfirmaAccion(null)}>
              {t('students.confirm.cancel')}
            </Button>
            <Button
              variante={confirmaAccion?.tipo === 'deactivate' ? 'danger' : 'primary'}
              cargando={confirmando}
              onClick={() => void confirmarAccion()}
            >
              {confirmando ? t('students.confirm.executing') : t('students.confirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}