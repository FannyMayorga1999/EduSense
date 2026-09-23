import { useTranslation } from 'react-i18next'
import type { ComponentType } from 'react'
import { CalendarCheck2, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Users, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Button from './ui/Button'

/**
 * Menú lateral (sidebar) de EduSense. Los ítems se filtran según los roles
 * y permisos del usuario autenticado: el administrador ve todos; el resto
 * solo ve las secciones para las que tiene el permiso correspondiente.
 *
 * @author Fanny Mayorga
 * @date   20-09-2026
 */

interface ItemMenu {
  clave: string
  ruta: string
  icono: ComponentType<{ className?: string }>
  permiso?: string
}

const ITEMS_MENU: ItemMenu[] = [
  { clave: 'dashboard', ruta: '/', icono: LayoutDashboard },
  { clave: 'students', ruta: '/students', icono: Users, permiso: 'view_students' },
  { clave: 'surveys', ruta: '/surveys', icono: ClipboardList, permiso: 'view_surveys' },
  { clave: 'schedule', ruta: '/schedule', icono: CalendarCheck2, permiso: 'view_schedules' },
]

const CLAVE_ROL: Record<string, string> = {
  administrator: 'login.role_admin',
  teacher: 'login.role_teacher',
  psychopedagogist: 'login.role_psychopedagogist',
  evaluator: 'login.role_evaluator',
}

interface SidebarProps {
  abierto: boolean
  cerrar: () => void
}

export default function Sidebar({ abierto, cerrar }: SidebarProps) {
  const { t } = useTranslation()
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()

  const esAdministrador = usuario?.roles.includes('administrator') ?? false

  const itemsVisibles = ITEMS_MENU.filter(
    (item) =>
      item.permiso === undefined ||
      esAdministrador ||
      (usuario?.permissions ?? []).includes(item.permiso),
  )

  const rolActual = usuario?.roles[0]
  const etiquetaRol = rolActual !== undefined ? t(CLAVE_ROL[rolActual] ?? rolActual) : ''

  const cerrarSesion = async (): Promise<void> => {
    await logout()
    navegar('/login', { replace: true })
  }

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={cerrar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200 bg-white transition-transform duration-200 dark:border-stone-700 dark:bg-stone-900 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={t('app.name')}
      >
        <div className="flex items-center gap-2.5 border-b border-stone-200 px-5 py-4 dark:border-stone-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-stone-900 dark:text-white">
              {t('app.name')}
            </p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{t('app.tagline')}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            title={t('sidebar.close')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {itemsVisibles.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.ruta === '/'}
              onClick={cerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                }`
              }
            >
              <item.icono className="h-5 w-5 shrink-0" />
              {t(`menu.${item.clave}`)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-3 dark:border-stone-700">
          <div className="flex items-center gap-3 rounded-xl bg-stone-100 px-3 py-3 dark:bg-stone-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {usuario?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 dark:text-white" title={t('home.user_label')}>
                {usuario?.name}
              </p>
              <p className="truncate text-xs font-medium text-primary-600 dark:text-primary-400">{etiquetaRol}</p>
            </div>
            <Button variante="ghost" tamano="sm" onClick={() => void cerrarSesion()} title={t('home.logout')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}