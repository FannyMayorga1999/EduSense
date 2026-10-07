import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useAuth } from './useAuth'
import { useAlert } from '@/shared/components/ui/alertContext'

/**
 * Login hook of the auth submodule: owns the form state (email/password),
 * the submission flow with error mapping (401/403/429) and the demo account
 * quick fill. Feedback goes to the shared alert queue. The page and the form
 * only consume its exposed values.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

export interface DemoAccount {
  role: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'role_admin', email: 'admin@edusense.local', password: 'edusense-2026' },
  { role: 'role_teacher', email: 'profesor@edusense.local', password: 'edusense-2026' },
  { role: 'role_psychopedagogist', email: 'psicopedagogo@edusense.local', password: 'edusense-2026' },
  { role: 'role_evaluator', email: 'evaluador@edusense.local', password: 'edusense-2026' },
]

export function useLogin() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { push } = useAlert()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [showDemo, setShowDemo] = useState<boolean>(false)

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    if (email.trim() === '' || password === '') {
      push(t('login.error_invalid'), { variant: 'info-needed' })

      return
    }

    setSubmitting(true)

    try {
      await login(email.trim(), password)
      push(t('login.messages.welcome'), { variant: 'completed' })
    } catch (reason) {
      let message = t('login.error_generic')

      if (isAxiosError(reason)) {
        if (reason.response?.status === 401) {
          message = t('login.error_invalid')
        } else if (reason.response?.status === 403) {
          message = t('login.error_inactive')
        } else if (reason.response?.status === 429) {
          message = t('login.error_throttled')
        }
      }

      push(message, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoAccount = (account: DemoAccount): void => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    submitting,
    showDemo,
    setShowDemo,
    submit,
    fillDemoAccount,
  }
}