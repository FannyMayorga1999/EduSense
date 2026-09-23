import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración de Vite para el frontend de EduSense.
// Autor: Fanny Mayorga | Fecha: 16-09-2026
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige las peticiones /api hacia el servidor API de Laravel.
      // En contenedores la API se alcanza por el nombre de servicio "backend".
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
      // El endpoint de Sanctum para la cookie CSRF vive fuera de /api.
      '/sanctum': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})