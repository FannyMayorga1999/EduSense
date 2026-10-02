import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/system/auth/hooks/useAuth'

/**
 * User dropdown of the top navbar: circular avatar with initials, theme toggle
 * lives next to it in the shell, and the menu opens a floating card with the
 * user data, Profile/Configuration links and the Sign out action.
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */
export default function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<boolean>(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleMouseDown = (event: MouseEvent): void => {
      if (wrapRef.current !== null && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (user === null) {
    return null
  }

  const iniciales = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  const goTo = (path: string): void => {
    setOpen(false)
    navigate(path)
  }

  const handleLogout = async (): Promise<void> => {
    setOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="ed-user" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('user.menu_label')}
        title={user.name}
        className="ed-user__avatar"
      >
        {iniciales}
      </button>

      {open && (
        <div className="ed-user__menu" role="menu" aria-label={t('user.menu_label')}>
          <div className="ed-user__head">
            <p className="ed-user__nombre">{user.name}</p>
            <p className="ed-user__email">{user.email}</p>
          </div>

          <div className="ed-user__sep" />

          <button type="button" role="menuitem" className="ed-user__item" onClick={() => goTo('/profile')}>
            <User className="h-4 w-4" />
            {t('menu.profile')}
          </button>
          <button type="button" role="menuitem" className="ed-user__item" onClick={() => goTo('/settings/ajustes')}>
            <Settings className="h-4 w-4" />
            {t('menu.settings')}
          </button>

          <div className="ed-user__sep" />

          <button
            type="button"
            role="menuitem"
            className="ed-user__item ed-user__item--peligro"
            onClick={() => void handleLogout()}
          >
            <LogOut className="h-4 w-4" />
            {t('user.sign_out')}
          </button>
        </div>
      )}
    </div>
  )
}