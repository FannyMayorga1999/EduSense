import type { LucideIcon } from 'lucide-react'
import Card from './ui/Card'

/**
 * Tarjeta KPI reutilizable para el dashboard.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */
interface KpiCardProps {
  titulo: string
  valor: number
  icono: LucideIcon
  acento: string
  cargando?: boolean
}

export default function KpiCard({ titulo, valor, icono: Icono, acento, cargando = false }: KpiCardProps) {
  return (
    <Card className="p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${acento}`}>
          <Icono className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-500 dark:text-stone-400">{titulo}</p>
          {cargando ? (
            <div className="mt-1 h-7 w-12 animate-pulse rounded-md bg-stone-200 dark:bg-stone-700" />
          ) : (
            <p className="text-2xl font-bold text-stone-900 dark:text-white">{valor}</p>
          )}
        </div>
      </div>
    </Card>
  )
}