'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Settings,
  Plus,
  ChevronDown,
  Circle,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { getInitials } from '@/lib/utils/format'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/canales': 'Canales',
  '/mensajes': 'Mensajes directos',
  '/anuncios': 'Anuncios',
  '/directorio': 'Directorio',
  '/archivos': 'Archivos',
  '/notificaciones': 'Notificaciones',
  '/perfil': 'Mi perfil',
  '/admin/usuarios': 'Gestión de usuarios',
  '/admin/roles': 'Roles y permisos',
  '/admin/estructura': 'Estructura organizativa',
  '/admin/invitaciones': 'Invitaciones',
  '/admin/auditoria': 'Auditoría',
  '/admin/metricas': 'Métricas',
  '/admin/configuracion': 'Configuración',
}

interface TopbarProps {
  user: {
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    jobTitle?: string | null
    avatarUrl?: string | null
  }
  unreadNotifications?: number
  onMobileMenuOpen?: () => void
}

export function Topbar({ user, unreadNotifications = 0, onMobileMenuOpen }: TopbarProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
  )?.[1] ?? 'Nexora'

  const initials = getInitials(user.name, user.firstName, user.lastName)

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name ?? user.email ?? 'Usuario'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
        style={{ minWidth: 200 }}
      >
        <Search className="w-4 h-4" />
        <span className="text-[12px]">Buscar en Nexora...</span>
        <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </span>
      </button>

      {/* New message button */}
      <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">Nuevo</span>
      </button>

      {/* Notifications */}
      <Link href="/notificaciones">
        <button className="relative p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          )}
        </button>
      </Link>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-200" />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ background: '#0d9488' }}
            >
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{displayName}</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {user.jobTitle ?? user.email}
            </p>
          </div>
          <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-card-hover py-1 z-50 min-w-[200px] animate-fade-in">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/perfil"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Mi perfil
                </Link>
                <Link
                  href="/admin/configuracion"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Configuración
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
