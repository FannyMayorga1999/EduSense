import { useTranslation } from 'react-i18next'
import type { ComponentType } from 'react'
import { CalendarCheck2, CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Users, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/system/auth/hooks/useAuth'
import Button from '@/components/ui/Button'

/**
 * Lateral sidebar (menu) of EduSense. Items are filtered according to the
 * roles and permissions of the authenticated user: the administrator sees
 * everything; the rest only see the sections for which they have the
 * corresponding permission.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */

interface MenuItem {
  key: string
  path: string
  icon: ComponentType<{ className?: string }>
  permission?: string
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard },
  { key: 'students', path: '/students', icon: Users, permission: 'view_students' },
  { key: 'terms', path: '/terms', icon: CalendarDays, permission: 'view_terms' },
  { key: 'surveys', path: '/surveys', icon: ClipboardList, permission: 'view_surveys' },
  { key: 'schedule', path: '/schedule', icon: CalendarCheck2, permission: 'view_schedules' },
]

const ROLE_LABEL_KEYS: Record<string, string> = {
  administrator: 'login.role_admin',
  teacher: 'login.role_teacher',
  psychopedagogist: 'login.role_psychopedagogist',
  evaluator: 'login.role_evaluator',
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.roles.includes('administrator') ?? false

  const visibleItems = MENU_ITEMS.filter(
    (item) =>
      item.permission === undefined ||
      isAdmin ||
      (user?.permissions ?? []).includes(item.permission),
  )

  const currentRole = user?.roles[0]
  const roleLabel = currentRole !== undefined ? t(ROLE_LABEL_KEYS[currentRole] ?? currentRole) : ''

  const handleLogout = async (): Promise<void> => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {open && (
        <div
          className="ed-sb__fondo"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`ed-sb ${open ? 'ed-sb--abierto' : 'ed-sb--cerrado'}`}
        aria-label={t('app.name')}
      >
        <div className="ed-sb__brand">
          <div className="ed-sb__logo">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="ed-sb__marca-text">
            <p className="ed-sb__nombre">
              {t('app.name')}
            </p>
            <p className="ed-sb__tagline">{t('app.tagline')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={t('sidebar.close')}
            className="ed-sb__cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="ed-sb__nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `ed-sb__link ${isActive ? 'ed-sb__link--activo' : 'ed-sb__link--inactivo'}`
              }
            >
              <item.icon className="ed-sb__icono" />
              {t(`menu.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="ed-sb__pie">
          <div className="ed-sb__usuario">
            <div className="ed-sb__avatar">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="ed-sb__info">
              <p className="ed-sb__nombre-usuario" title={t('home.user_label')}>
                {user?.name}
              </p>
              <p className="ed-sb__rol">{roleLabel}</p>
            </div>
            <Button variant="ghost" iconOnly onClick={() => void handleLogout()} title={t('home.logout')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}