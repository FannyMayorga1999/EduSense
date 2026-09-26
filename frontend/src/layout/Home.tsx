import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, Menu, Moon, Sun } from 'lucide-react'
import Sidebar from '@/layout/Sidebar'
import { useDarkMode } from '@/hooks/useTheme'
import { RequireAuth } from '@/features/system/auth'

/**
 * Authenticated shell of EduSense: lateral sidebar with role-based
 * navigation, top header with language/theme selectors and the active route
 * content rendered via <Outlet />.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */
function Home() {
  const { t, i18n } = useTranslation()
  const { dark, toggle } = useDarkMode()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const toggleLanguage = (): void => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  return (
    <div className="ed-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="ed-shell__cuerpo">
        <header className="ed-shell__header">
          <div className="ed-shell__header-in">
            <div className="ed-shell__izq">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                title={t('sidebar.open')}
                className="ed-shell__icon-btn lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="ed-shell__marca">
                <p className="ed-shell__title">{t('app.name')}</p>
                <p className="ed-shell__tagline">
                  {t('app.tagline')}
                </p>
              </div>
            </div>

            <div className="ed-shell__der">
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('app.language')}
                className="ed-shell__lang"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
              </button>

              <button
                type="button"
                onClick={toggle}
                title={dark ? t('app.light_mode') : t('app.dark_mode')}
                className="ed-shell__icon-btn"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="ed-shell__main">
          <Outlet />

          <footer className="ed-shell__footer">
            EduSense &middot; Fanny Mayorga
          </footer>
        </main>
      </div>
    </div>
  )
}

/**
 * Protected route: if there is no session, RequireAuth redirects to login.
 */
export default function HomeRoute() {
  return (
    <RequireAuth>
      <Home />
    </RequireAuth>
  )
}