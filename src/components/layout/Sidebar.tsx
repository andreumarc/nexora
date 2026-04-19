'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Hash,
  Megaphone,
  Users,
  Folder,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Building2,
  X,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ImpulsoDent Design System — exact values
const SIDEBAR_BG = '#0b1929'
const ACTIVE_BG = '#22c55e'
const ACTIVE_TEXT = '#ffffff'
const INACTIVE_TEXT = '#8ba8c0'
const GROUP_LABEL = '#3d5a75'
const HOVER_BG = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.08)'
const LOGO_ICON_BG = '#0d9488'

const STORAGE_KEY = 'nexora-sidebar-collapsed'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Inicio', href: '/', icon: LayoutDashboard },
      { label: 'Canales', href: '/canales', icon: Hash },
      { label: 'Mensajes directos', href: '/mensajes', icon: MessageSquare },
      { label: 'Anuncios', href: '/anuncios', icon: Megaphone },
    ],
  },
  {
    title: 'Organización',
    items: [
      { label: 'Directorio', href: '/directorio', icon: Users },
      { label: 'Archivos', href: '/archivos', icon: Folder },
      { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
      { label: 'Estructura', href: '/admin/estructura', icon: Building2 },
      { label: 'Métricas', href: '/admin/metricas', icon: BarChart3 },
      { label: 'Auditoría', href: '/admin/auditoria', icon: ShieldCheck },
      { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ],
  },
]

interface SidebarProps {
  companyName?: string
  unreadNotifications?: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ companyName = 'Nexora', unreadNotifications = 0, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <aside
      style={{ background: SIDEBAR_BG, width: collapsed ? 64 : 256 }}
      className="flex flex-col h-full flex-shrink-0 transition-all duration-200 overflow-hidden"
    >
      {/* Logo */}
      <div
        className="flex items-center px-3 py-5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: LOGO_ICON_BG }}
        >
          <MessageCircle style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        {!collapsed && (
          <div className="ml-2.5 min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">Nexora</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: GROUP_LABEL }}>
              {companyName}
            </p>
          </div>
        )}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 lg:hidden"
            style={{ color: INACTIVE_TEXT }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto sidebar-scroll space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p
                className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: GROUP_LABEL }}
              >
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                const isHovered = hovered === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onMobileClose}
                      style={{
                        background: active ? ACTIVE_BG : isHovered ? HOVER_BG : 'transparent',
                        color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
                      onMouseEnter={() => setHovered(item.href)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <Icon
                        style={{
                          width: 18,
                          height: 18,
                          color: active ? '#fff' : INACTIVE_TEXT,
                          flexShrink: 0,
                        }}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                          {active && (
                            <ChevronRight
                              style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.7)' }}
                            />
                          )}
                        </>
                      )}
                      {collapsed && item.badge && item.badge > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center gap-2 w-full px-4 py-3 text-sm font-medium transition-colors duration-150"
          style={{ color: INACTIVE_TEXT }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = INACTIVE_TEXT)}
        >
          {collapsed ? (
            <ChevronRight style={{ width: 16, height: 16 }} />
          ) : (
            <>
              <ChevronLeft style={{ width: 16, height: 16 }} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative flex" style={{ width: 256 }}>
            <aside
              style={{ background: SIDEBAR_BG, width: 256 }}
              className="flex flex-col h-full"
            >
              {sidebarContent.props.children}
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
