import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, Menu, Moon, Sun } from 'lucide-react'
import Sidebar from './Sidebar'
import { useModoOscuro } from '../hooks/useTheme'
import RequireAuth from '../auth/RequireAuth'

/**
 * Shell autenticado de EduSense: menú lateral (sidebar) con navegación por
 * roles, cabecera superior con selectores de idioma/tema y el contenido de
 * la ruta activa mediante <Outlet />.
 *
 * @author Fanny Mayorga
 * @date   20-09-2026
 */
function Home() {
  const { t, i18n } = useTranslation()
  const { oscuro, alternar } = useModoOscuro()
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false)

  const alternarIdioma = (): void => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 transition-colors duration-200 dark:bg-stone-900 dark:text-white">
      <Sidebar abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-700 dark:bg-stone-900/80">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMenuAbierto(true)}
                title={t('sidebar.open')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 lg:hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <p className="text-lg font-bold leading-tight">{t('app.name')}</p>
                <p className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block">
                  {t('app.tagline')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={alternarIdioma}
                title={t('app.language')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
              </button>

              <button
                type="button"
                onClick={alternar}
                title={oscuro ? t('app.light_mode') : t('app.dark_mode')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 text-center text-xs text-stone-400 dark:text-stone-600 sm:px-6">
          EduSense &middot; Fanny Mayorga
        </footer>
      </div>
    </div>
  )
}

/**
 * Ruta protegida: si no hay sesión, RequireAuth redirige al login.
 */
export default function HomeRoute() {
  return (
    <RequireAuth>
      <Home />
    </RequireAuth>
  )
}