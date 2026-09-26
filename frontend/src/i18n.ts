import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

/**
 * Multilanguage support configuration (Spanish / English).
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es.translation },
    en: { translation: en.translation },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n