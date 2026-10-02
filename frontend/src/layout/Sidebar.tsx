import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, GraduationCap, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useMenus } from '@/features/system/menus'
import { iconFromKey } from '@/features/system/menus/components/menuIcons'
import type { IconComponent } from '@/features/system/menus/components/menuIcons'
import type { MenuNode } from '@/types'

/**
 * Lateral sidebar (menu) of EduSense. The tree is defined in the backend
 * (GET /v1/menus) and rendered as collapsible sections with a thin vertical
 * guide for the sub-items. On desktop a floating button in the header
 * collapses the sidebar into an icon-only rail.
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

interface RailLink {
  key: string
  path: string
  icon: IconComponent
  labelKey: string
}

interface RailToggle {
  keys: string[]
  icon: IconComponent
  labelKey: string
}

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation()
  const { menus } = useMenus()
  const location = useLocation()
  const [userOpen, setUserOpen] = useState<Record<string, boolean>>({})

  const pathActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const nodeActive = (node: MenuNode): boolean =>
    node.route !== null
      ? pathActive(node.route)
      : node.children.some(nodeActive)

  const isOpen = (node: MenuNode): boolean =>
    nodeActive(node) || (userOpen[node.key] ?? false)

  const toggleNode = (key: string): void => {
    setUserOpen((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }))
  }

  const handleRailToggle = (keys: string[]): void => {
    onToggleCollapse()
    setUserOpen((prev) => keys.reduce((acc, key) => ({ ...acc, [key]: true }), prev))
  }

  const railLinks: RailLink[] = []
  const railToggles: RailToggle[] = []

  const walkRail = (nodes: MenuNode[], ancestors: string[]): void => {
    for (const node of nodes) {
      const keys = [...ancestors, node.key]

      if (node.children.length > 0) {
        railToggles.push({ keys, icon: iconFromKey(node.icon), labelKey: node.label_key })
        walkRail(node.children, keys)
      } else if (node.route !== null) {
        railLinks.push({
          key: node.key,
          path: node.route,
          icon: iconFromKey(node.icon),
          labelKey: node.label_key,
        })
      }
    }
  }

  menus.forEach((section) => walkRail(section.children, [section.key]))

  const renderLeaf = (node: MenuNode) => {
    const Icon = iconFromKey(node.icon)

    return (
      <NavLink
        key={node.route ?? node.key}
        to={node.route ?? '/'}
        onClick={onClose}
        title={t(node.label_key, node.label_key)}
        className={({ isActive }) =>
          `ed-sb__sub-link ${isActive ? 'ed-sb__sub-link--activo' : 'ed-sb__sub-link--inactivo'}`
        }
      >
        <span className="ed-sb__sub-label">
          <Icon className="ed-sb__icono" />
          <span className="ed-sb__texto">{t(node.label_key, node.label_key)}</span>
        </span>
      </NavLink>
    )
  }

  const renderExpandable = (node: MenuNode) => {
    const Icon = iconFromKey(node.icon)
    const expanded = isOpen(node)

    return (
      <div key={node.key}>
        <button
          type="button"
          onClick={() => toggleNode(node.key)}
          aria-expanded={expanded}
          title={t(node.label_key, node.label_key)}
          className={`ed-sb__sub-link ed-sb__sub-link--expandible ${
            nodeActive(node) ? 'ed-sb__sub-link--activo' : 'ed-sb__sub-link--inactivo'
          }`}
        >
          <span className="ed-sb__sub-label">
            <Icon className="ed-sb__icono" />
            <span className="ed-sb__texto">{t(node.label_key, node.label_key)}</span>
          </span>
          <ChevronDown className={`ed-sb__expand ${expanded ? 'ed-sb__expand--abierto' : ''}`} />
        </button>

        {expanded && (
          <div className="ed-sb__sub-lista ed-sb__sub-lista--anidada">
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    )
  }

  const renderNode = (node: MenuNode) =>
    node.children.length > 0 ? renderExpandable(node) : renderLeaf(node)

  return (
    <>
      {open && (
        <div
          className="ed-sb__fondo"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`ed-sb ${open ? 'ed-sb--abierto' : 'ed-sb--cerrado'} ${collapsed ? 'ed-sb--reducido' : ''}`}
        aria-label={t('app.name')}
      >
        <div className="ed-sb__brand">
          <div className="ed-sb__logo">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className={`ed-sb__marca-text ${collapsed ? 'hidden' : ''}`}>
            <p className="ed-sb__nombre">
              {t('app.name')}
            </p>
            <p className="ed-sb__tagline">{t('app.tagline')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={t('sidebar.close')}
            className="ed-sb__cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {collapsed ? (
          <nav className="ed-sb__nav ed-sb__nav--rail">
            {railToggles.map((toggle) => (
              <button
                key={toggle.keys.join('.')}
                type="button"
                onClick={() => handleRailToggle(toggle.keys)}
                title={t(toggle.labelKey, toggle.labelKey)}
                aria-label={t(toggle.labelKey, toggle.labelKey)}
                className="ed-sb__link ed-sb__link--inactivo"
              >
                <toggle.icon className="ed-sb__icono" />
              </button>
            ))}
            {railLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                onClick={onClose}
                title={t(link.labelKey, link.labelKey)}
                aria-label={t(link.labelKey, link.labelKey)}
                className={({ isActive }) =>
                  `ed-sb__link ${isActive ? 'ed-sb__link--activo' : 'ed-sb__link--inactivo'}`
                }
              >
                <link.icon className="ed-sb__icono" />
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="ed-sb__nav">
            {menus.map((section) => (
              <div key={section.key} className="ed-sb__grupo">
                <p className="ed-sb__seccion ed-sb__seccion--estatica">
                  {t(section.label_key, section.label_key)}
                </p>

                <div className="ed-sb__sub-lista">{section.children.map(renderNode)}</div>
              </div>
            ))}
          </nav>
        )}
      </aside>
    </>
  )
}