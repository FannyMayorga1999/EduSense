/** @type {import('tailwindcss').Config} */
// Configuración de Tailwind CSS para EduSense.
// Autor: Fanny Mayorga | Fecha: 16-09-2026
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta educativa verde/teal: primary (teal) y accent (emerald).
        // primary-600 (#0F9D8A) y primary-700 (#0C8575) son la marca;
        // primary-50 (#E6F7F4) es el fondo suave (badges/tabs/hover).
        primary: {
          50: '#e6f7f4',
          100: '#ccf0ea',
          200: '#a0e2d8',
          300: '#6ccbbd',
          400: '#40b6a5',
          500: '#1da894',
          600: '#0f9d8a',
          700: '#0c8575',
          800: '#0b6c60',
          900: '#0d4f47',
          950: '#04302b',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
    },
  },
  plugins: [],
}