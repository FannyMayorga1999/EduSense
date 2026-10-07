import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpenCheck, ClipboardCheck, GraduationCap, Languages, LineChart, Moon, Sun, Users } from 'lucide-react'
import { LoginForm, useAuth, useLogin } from '@/features/system/auth'
import { useDarkMode } from '@/shared/hooks/useTheme'

/**
 * Authentication page (public home) of EduSense. Thin view: only assembles
 * the brand layout, the language/theme selectors and the auth form (its
 * state lives in the `useLogin` hook of the auth submodule).
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */
export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { dark, toggle } = useDarkMode()
  const { user, loading } = useAuth()
  const login = useLogin()

  const toggleLanguage = (): void => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  if (!loading && user !== null) {
    return <Navigate to="/" replace />
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

          <LoginForm
            email={login.email}
            password={login.password}
            showPassword={login.showPassword}
            submitting={login.submitting}
            showDemo={login.showDemo}
            onEmailChange={login.setEmail}
            onPasswordChange={login.setPassword}
            onTogglePassword={() => login.setShowPassword((prev) => !prev)}
            onSubmit={(event) => void login.submit(event)}
            onToggleDemo={() => login.setShowDemo((prev) => !prev)}
            onFillDemo={login.fillDemoAccount}
          />

          <p className="ed-login__pie">
            EduSense &middot; Fanny Mayorga
          </p>
        </div>
      </main>
    </div>
  )
}