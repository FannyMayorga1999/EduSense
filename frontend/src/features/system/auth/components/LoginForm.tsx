import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BellRing, Eye, EyeOff, LogIn } from 'lucide-react'
import { DEMO_ACCOUNTS } from '@/features/system/auth/hooks/useLogin'
import type { DemoAccount } from '@/features/system/auth/hooks/useLogin'
import Button from '@/shared/components/ui/Button'
import Card from '@/shared/components/ui/Card'
import Field from '@/shared/components/ui/Field'
import Input from '@/shared/components/ui/Input'

/**
 * Presentational login form: credentials, error alert and the demo accounts
 * quick fill. All the state comes from the `useLogin` hook through its props.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

interface LoginFormProps {
  email: string
  password: string
  showPassword: boolean
  submitting: boolean
  showDemo: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: FormEvent) => void
  onToggleDemo: () => void
  onFillDemo: (account: DemoAccount) => void
}

export default function LoginForm({
  email,
  password,
  showPassword,
  submitting,
  showDemo,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onToggleDemo,
  onFillDemo,
}: LoginFormProps) {
  const { t } = useTranslation()

  return (
    <Card className="ed-login__card">
      <form className="ed-form" onSubmit={onSubmit}>
        <Field label={t('login.email')} htmlFor="email">
          <Input
            id="email"
            type="text"
            autoComplete="email"
            placeholder={t('login.email_placeholder')}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
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
              onChange={(event) => onPasswordChange(event.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              title={showPassword ? t('login.password_hide') : t('login.password_show')}
              className="ed-login__clave-boton"
              aria-label={showPassword ? t('login.password_hide') : t('login.password_show')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" className="ed-login__submit" loading={submitting}>
          {!submitting && <LogIn className="h-4 w-4" />}
          {submitting ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <div className="ed-login__demo">
        <button
          type="button"
          onClick={onToggleDemo}
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
                onClick={() => onFillDemo(account)}
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
  )
}