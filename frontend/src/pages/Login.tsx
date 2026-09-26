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
import { useDarkMode } from '../hooks/useTheme'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'

/**
 * Authentication page (public home) of EduSense.
 *
 * @author Fanny Mayorga
 */

interface DemoAccount {
  role: string
  email: string
  password: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'role_admin', email: 'admin@edusense.local', password: 'edusense-2026' },
  { role: 'role_teacher', email: 'profesor@edusense.local', password: 'edusense-2026' },
  { role: 'role_psychopedagogist', email: 'psicopedagogo@edusense.local', password: 'edusense-2026' },
  { role: 'role_evaluator', email: 'evaluador@edusense.local', password: 'edusense-2026' },
]

export default function Login() {
  const { t, i18n } = useTranslation()
  const { dark, toggle } = useDarkMode()
  const { user, loading, login } = useAuth()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState<boolean>(false)

  if (!loading && user !== null) {
    return <Navigate to="/" replace />
  }

  const toggleLanguage = (): void => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    if (email.trim() === '' || password === '') {
      setError(t('login.error_invalid'))

      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await login(email.trim(), password)
    } catch (reason) {
      if (isAxiosError(reason)) {
        if (reason.response?.status === 401) {
          setError(t('login.error_invalid'))
        } else if (reason.response?.status === 403) {
          setError(t('login.error_inactive'))
        } else if (reason.response?.status === 429) {
          setError(t('login.error_throttled'))
        } else {
          setError(t('login.error_generic'))
        }
      } else {
        setError(t('login.error_generic'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoAccount = (account: DemoAccount): void => {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
  }

  return (
    <div className="ed-login">
      {/* Brand panel */}
      <aside className="ed-login__brand">
        <div className="ed-login__glow ed-login__glow--esquina" />
        <div className="ed-login__glow ed-login__glow--base" />

        <div className="ed-login__marca">
          <div className="ed-login__logo">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="ed-login__titulo-marca">{t('app.name')}</p>
            <p className="ed-login__tagline">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="relative">
          <div className="ed-login__art">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="ed-login__lead">
            {t('login.branding_lead')}
          </h2>
          <ul className="ed-login__features">
            {['feature1', 'feature2', 'feature3'].map((key) => (
              <li key={key} className="ed-login__feature">
                <span className="ed-login__feature-icono">
                  {key === 'feature1' ? (
                    <LineChart className="h-4 w-4" />
                  ) : key === 'feature2' ? (
                    <ClipboardCheck className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </span>
                <span>{t(`login.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="ed-login__footer-marca">EduSense &middot; Fanny Mayorga</p>
      </aside>

      {/* Form panel */}
      <main className="ed-login__panel">
        <div className="ed-login__topbar">
          <button
            type="button"
            onClick={toggleLanguage}
            title={t('app.language')}
            className="ed-login__lang"
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
          </button>
          <button
            type="button"
            onClick={toggle}
            title={dark ? t('app.light_mode') : t('app.dark_mode')}
            className="ed-login__icon-btn"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="ed-login__tarjeta">
          <div className="ed-login__marca-mobile">
            <div className="ed-login__logo-mobile">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="ed-login__titulo-mobile">
                {t('app.name')}
              </p>
              <p className="ed-login__tagline-mobile">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="ed-login__welcome">{t('login.welcome')}</h1>
            <p className="ed-login__subtitle">{t('login.subtitle')}</p>
          </div>

          <Card className="ed-login__card">
            <form className="ed-form" onSubmit={(event) => void submit(event)}>
              <Field label={t('login.email')} htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>

              <Field label={t('login.password')} htmlFor="password">
                <div className="ed-login__clave-fila">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('login.password_placeholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? t('login.password_hide') : t('login.password_show')}
                    className="ed-login__clave-boton"
                    aria-label={showPassword ? t('login.password_hide') : t('login.password_show')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error !== null && (
                <p className="ed-alerta">
                  {error}
                </p>
              )}

              <Button type="submit" className="ed-login__submit" loading={submitting}>
                {submitting ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <div className="ed-login__demo">
              <button
                type="button"
                onClick={() => setShowDemo((prev) => !prev)}
                className="ed-login__demo-toggle"
              >
                <BellRing className="h-3.5 w-3.5" />
                {showDemo ? t('login.demo_hide') : t('login.demo_toggle')}
              </button>

              {showDemo && (
                <div className="ed-login__demo-lista">
                  <p className="ed-pista">{t('login.demo_use')}</p>
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      type="button"
                      key={account.email}
                      onClick={() => fillDemoAccount(account)}
                      className="ed-login__demo-fila"
                    >
                      <span className="min-w-0">
                        <span className="ed-login__demo-rol">
                          {t(`login.${account.role}`)}
                        </span>
                        <span className="ed-login__demo-email">
                          {account.email}
                        </span>
                      </span>
                      <span className="ed-login__demo-clave">
                        {account.password}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <p className="ed-login__pie">
            EduSense &middot; Fanny Mayorga
          </p>
        </div>
      </main>
    </div>
  )
}