import { useEffect, useState } from 'react'

/**
 * Hook that manages the light/dark mode and persists it in localStorage.
 * Shared between the login page and the authenticated shell.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */
export function useDarkMode(): { dark: boolean; toggle: () => void } {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = window.localStorage.getItem('edusense-theme')

    if (saved !== null) {
      return saved === 'dark'
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    window.localStorage.setItem('edusense-theme', dark ? 'dark' : 'light')
  }, [dark])

  return {
    dark,
    toggle: () => setDark((prev) => !prev),
  }
}