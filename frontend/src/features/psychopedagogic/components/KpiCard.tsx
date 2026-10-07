import type { LucideIcon } from 'lucide-react'
import Card from '@/shared/components/ui/Card'

/**
 * KPI card of the psychopedagogic dashboard.
 *
 * @author Fanny Mayorga | @date 16-09-2026
 */
interface KpiCardProps {
  title: string
  value: number
  icon: LucideIcon
  accent: string
  loading?: boolean
}

export default function KpiCard({ title, value, icon: Icon, accent, loading = false }: KpiCardProps) {
  return (
    <Card className="ed-kpi">
      <div className="ed-kpi__fila">
        <div className={`ed-kpi__icono ${accent}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ed-kpi__texto">
          <p className="ed-kpi__titulo">{title}</p>
          {loading ? (
            <div className="ed-kpi__valor-skeleton" />
          ) : (
            <p className="ed-kpi__valor">{value}</p>
          )}
        </div>
      </div>
    </Card>
  )
}