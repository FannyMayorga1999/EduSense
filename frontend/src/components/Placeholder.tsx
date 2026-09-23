import { useTranslation } from 'react-i18next'
import { Construction } from 'lucide-react'

/**
 * Página provisional para las secciones del menú que aún no tienen
 * vista propia (Estudiantes, Encuestas, Cronograma).
 *
 * @author Fanny Mayorga
 * @date   20-09-2026
 */

interface PlaceholderProps {
  id: string
}

export default function Placeholder({ id }: PlaceholderProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-6" aria-label={t(`menu.${id}`)}>
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t(`menu.${id}`)}</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('placeholder.subtitle')}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">{t('placeholder.title')}</h2>
        <p className="max-w-md text-sm text-stone-500 dark:text-stone-400">
          {t('placeholder.message', { name: t(`menu.${id}`) })}
        </p>
      </div>
    </section>
  )
}