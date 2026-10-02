import type { ComponentType } from 'react'
import {
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Circle,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react'

/**
 * Catalogue mapping the backend icon keys to their lucide-react components.
 * Unknown keys fall back to a neutral circle so the sidebar never breaks.
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */

export type IconComponent = ComponentType<{ className?: string }>

const ICON_CATALOGUE: Record<string, IconComponent> = {
  layout_dashboard: LayoutDashboard,
  users: Users,
  calendar_days: CalendarDays,
  calendar_check_2: CalendarCheck2,
  clipboard_list: ClipboardList,
  settings: Settings,
  shield_check: ShieldCheck,
  sliders_horizontal: SlidersHorizontal,
  graduation_cap: GraduationCap,
}

export const FALLBACK_ICON: IconComponent = Circle

/**
 * Resolves an icon key to a component, falling back when unknown.
 */
export function iconFromKey(key: string | null | undefined): IconComponent {
  return (key !== null && key !== undefined && key in ICON_CATALOGUE)
    ? ICON_CATALOGUE[key]
    : FALLBACK_ICON
}