import { useTranslation } from 'react-i18next'
import { Construction } from 'lucide-react'

/**
 * Provisional page for the menu sections that do not have their own view yet
 * (Surveys, Schedule).
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
        <h1 className="ed-page__title">{t(`menu.${id}`)}</h1>
        <p className="ed-page__subtitle">{t('placeholder.subtitle')}</p>
      </div>

      <div className="ed-ph__caja">
        <div className="ed-ph__icono">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="ed-ph__titulo">{t('placeholder.title')}</h2>
        <p className="ed-ph__mensaje">
          {t('placeholder.message', { name: t(`menu.${id}`) })}
        </p>
      </div>
    </section>
  )
}