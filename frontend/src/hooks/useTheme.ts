import { useEffect, useState } from 'react'

/**
 * Hook que gestiona el modo claro/oscuro y lo persiste en localStorage.
 * Lo comparten la página de login y el shell autenticado.
 *
 * @author Fanny Mayorga
 */
export function useModoOscuro(): { oscuro: boolean; alternar: () => void } {
  const [oscuro, setOscuro] = useState<boolean>(() => {
    const guardado = window.localStorage.getItem('edusense-theme')

    if (guardado !== null) {
      return guardado === 'dark'
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
    window.localStorage.setItem('edusense-theme', oscuro ? 'dark' : 'light')
  }, [oscuro])

  return {
    oscuro,
    alternar: () => setOscuro((previo) => !previo),
  }
}