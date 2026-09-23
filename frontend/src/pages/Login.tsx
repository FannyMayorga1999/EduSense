import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import {
  BellRing,
  BookOpenCheck,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Languages,
  LineChart,
  Moon,
  Sun,
  Users,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useModoOscuro } from '../hooks/useTheme'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'

/**
 * Página de autenticación (home público) de EduSense.
 *
 * @author Fanny Mayorga
 */

interface CuentaDemo {
  rol: string
  email: string
  password: string
}

const CUENTAS_DEMO: CuentaDemo[] = [
  { rol: 'role_admin', email: 'admin@edusense.local', password: 'edusense-2026' },
  { rol: 'role_teacher', email: 'profesor@edusense.local', password: 'edusense-2026' },
  { rol: 'role_psychopedagogist', email: 'psicopedagogo@edusense.local', password: 'edusense-2026' },
  { rol: 'role_evaluator', email: 'evaluador@edusense.local', password: 'edusense-2026' },
]

export default function Login() {
  const { t, i18n } = useTranslation()
  const { oscuro, alternar } = useModoOscuro()
  const { usuario, cargando, login } = useAuth()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [mostrarClave, setMostrarClave] = useState<boolean>(false)
  const [enviando, setEnviando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [verDemo, setVerDemo] = useState<boolean>(false)

  if (!cargando && usuario !== null) {
    return <Navigate to="/" replace />
  }

  const alternarIdioma = (): void => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()

    if (email.trim() === '' || password === '') {
      setError(t('login.error_invalid'))

      return
    }

    setEnviando(true)
    setError(null)

    try {
      await login(email.trim(), password)
    } catch (motivo) {
      if (isAxiosError(motivo)) {
        if (motivo.response?.status === 401) {
          setError(t('login.error_invalid'))
        } else if (motivo.response?.status === 403) {
          setError(t('login.error_inactive'))
        } else if (motivo.response?.status === 429) {
          setError(t('login.error_throttled'))
        } else {
          setError(t('login.error_generic'))
        }
      } else {
        setError(t('login.error_generic'))
      }
    } finally {
      setEnviando(false)
    }
  }

  const usarCuenta = (cuenta: CuentaDemo): void => {
    setEmail(cuenta.email)
    setPassword(cuenta.password)
    setError(null)
  }

  return (
    <div className="grid min-h-screen bg-stone-50 lg:grid-cols-2 dark:bg-stone-950">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-10 text-white lg:flex lg:flex-col lg:justify-between dark:from-primary-800 dark:via-primary-900 dark:to-accent-900">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold leading-tight">{t('app.name')}</p>
            <p className="text-sm text-white/70">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
            {t('login.branding_lead')}
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-white/85">
            {['feature1', 'feature2', 'feature3'].map((clave) => (
              <li key={clave} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  {clave === 'feature1' ? (
                    <LineChart className="h-4 w-4" />
                  ) : clave === 'feature2' ? (
                    <ClipboardCheck className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </span>
                <span>{t(`login.${clave}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">EduSense &middot; Fanny Mayorga</p>
      </aside>

      {/* Panel del formulario */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={alternarIdioma}
            title={t('app.language')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
          </button>
          <button
            type="button"
            onClick={alternar}
            title={oscuro ? t('app.light_mode') : t('app.dark_mode')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight text-stone-900 dark:text-white">
                {t('app.name')}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t('login.welcome')}</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('login.subtitle')}</p>
          </div>

          <Card className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={(evento) => void enviar(evento)}>
              <Field etiqueta={t('login.email')} htmlPara="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  required
                />
              </Field>

              <Field etiqueta={t('login.password')} htmlPara="password">
                <div className="relative">
                  <Input
                    id="password"
                    type={mostrarClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('login.password_placeholder')}
                    value={password}
                    onChange={(evento) => setPassword(evento.target.value)}
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarClave((previo) => !previo)}
                    title={mostrarClave ? t('login.password_hide') : t('login.password_show')}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 transition hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label={mostrarClave ? t('login.password_hide') : t('login.password_show')}
                  >
                    {mostrarClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error !== null && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" cargando={enviando}>
                {enviando ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <div className="mt-6 border-t border-stone-200 pt-4 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setVerDemo((previo) => !previo)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <BellRing className="h-3.5 w-3.5" />
                {verDemo ? t('login.demo_hide') : t('login.demo_toggle')}
              </button>

              {verDemo && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t('login.demo_use')}</p>
                  {CUENTAS_DEMO.map((cuenta) => (
                    <button
                      type="button"
                      key={cuenta.email}
                      onClick={() => usarCuenta(cuenta)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-left transition hover:border-primary-300 hover:bg-primary-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-stone-900 dark:text-white">
                          {t(`login.${cuenta.rol}`)}
                        </span>
                        <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                          {cuenta.email}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-stone-500 dark:text-stone-400">
                        {cuenta.password}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-600">
            EduSense &middot; Fanny Mayorga
          </p>
        </div>
      </main>
    </div>
  )
}