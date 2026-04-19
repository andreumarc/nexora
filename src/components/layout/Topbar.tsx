'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, Menu, LogOut, User, Settings, Plus, ChevronDown, Building2, Hash, MessageSquare, UserPlus, MapPin } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { getInitials } from '@/lib/utils/format'
import { CreateChannelButton } from '@/components/modals/CreateChannelModal'
import { InviteUserButton } from '@/components/modals/InviteUserModal'
import { CreateCompanyButton } from '@/components/modals/CreateCompanyModal'
import { CreateClinicButton } from '@/components/modals/CreateClinicModal'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/canales': 'Canales',
  '/mensajes': 'Mensajes directos',
  '/anuncios': 'Anuncios',
  '/directorio': 'Directorio',
  '/archivos': 'Archivos',
  '/notificaciones': 'Notificaciones',
  '/perfil': 'Mi perfil',
  '/admin/usuarios': 'Gestión de usuarios',
  '/admin/estructura': 'Estructura organizativa',
  '/admin/empresas': 'Empresas',
  '/admin/clinicas': 'Clínicas',
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
  isSuperadmin?: boolean
  role?: string | null
}

const ADMIN_ROLES = ['SUPERADMIN', 'COMPANY_ADMIN', 'DIRECTOR_GENERAL', 'DIRECTOR_OPERATIONS', 'HR_MANAGER', 'CLINIC_DIRECTOR']

export function Topbar({ user, unreadNotifications = 0, onMobileMenuOpen, isSuperadmin = false, role }: TopbarProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const nuevoRef = useRef<HTMLDivElement>(null)

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || (path !== '/' && pathname.startsWith(path))
  )?.[1] ?? 'Nexora'

  const initials = getInitials(user.name, user.firstName, user.lastName)
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name ?? user.email ?? 'Usuario'

  const isAdmin = isSuperadmin || (role && ADMIN_ROLES.includes(role))
  const canInvite = isSuperadmin || (role && ['COMPANY_ADMIN', 'DIRECTOR_GENERAL', 'HR_MANAGER'].includes(role))
  const canCreateChannel = isSuperadmin || (role && ADMIN_ROLES.includes(role))

  // Close nuevo dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (nuevoRef.current && !nuevoRef.current.contains(e.target as Node)) {
        setNuevoOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 z-30">
      {/* Mobile menu */}
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
      <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors" style={{ minWidth: 200 }}>
        <Search className="w-4 h-4" />
        <span className="text-[12px]">Buscar en Nexora...</span>
        <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono">⌘K</span>
      </button>

      {/* + Nuevo dropdown */}
      <div className="relative" ref={nuevoRef}>
        <button
          onClick={() => setNuevoOpen(!nuevoOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Nuevo</span>
          <ChevronDown className="w-3.5 h-3.5 hidden md:block" />
        </button>

        {nuevoOpen && (
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-card-hover py-1.5 z-50 min-w-[200px] animate-fade-in">
            {isSuperadmin && (
              <>
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Plataforma</p>
                </div>
                <NuevoItem icon={Building2} label="Nueva empresa" onClick={() => { setNuevoOpen(false) }} modal={<CreateCompanyButton inline />} />
                <NuevoItem icon={MapPin} label="Nueva clínica" onClick={() => { setNuevoOpen(false) }} modal={<CreateClinicButton inline />} />
                <div className="my-1 border-t border-gray-100" />
              </>
            )}
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comunicación</p>
            </div>
            {canInvite && (
              <div onClick={() => setNuevoOpen(false)}>
                <InviteUserItem />
              </div>
            )}
            {canCreateChannel && (
              <div onClick={() => setNuevoOpen(false)}>
                <CreateChannelItem />
              </div>
            )}
            <Link
              href="/mensajes"
              onClick={() => setNuevoOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Nuevo mensaje directo
            </Link>
          </div>
        )}
      </div>

      {/* Notifications */}
      <Link href="/notificaciones">
        <button className="relative p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          )}
        </button>
      </Link>

      <div className="h-8 w-px bg-gray-200" />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ background: '#0d9488' }}>
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{displayName}</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {isSuperadmin ? 'Superadministrador' : user.jobTitle ?? user.email}
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
                <Link href="/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  Mi perfil
                </Link>
                <Link href="/admin/configuracion" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Configuración
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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

function NuevoItem({ icon: Icon, label, onClick, modal }: { icon: any; label: string; onClick: () => void; modal?: React.ReactNode }) {
  if (modal) return <div className="px-1">{modal}</div>
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </button>
  )
}

function InviteUserItem() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [loading, setLoading] = useState(false)
  const { toast } = require('sonner')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Invitación enviada.')
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <UserPlus className="w-4 h-4 text-gray-400" />
        Invitar usuario
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in p-6 space-y-4">
            <h2 className="text-lg font-semibold">Invitar usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                {[['EMPLOYEE','Empleado'],['RECEPTIONIST','Recepcionista'],['HR_MANAGER','RRHH'],['CLINIC_DIRECTOR','Dir. clínica'],['DIRECTOR_GENERAL','Dir. general'],['COMPANY_ADMIN','Admin empresa']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60">{loading ? 'Enviando...' : 'Enviar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function CreateChannelItem() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { useRouter } = require('next/navigation')
  const router = useRouter()
  const { toast } = require('sonner')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, '-'), type: 'PUBLIC' }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const ch = await res.json()
      toast.success(`Canal #${name} creado.`)
      router.push(`/canales/${ch.id}`)
      router.refresh()
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <Hash className="w-4 h-4 text-gray-400" />
        Nuevo canal
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in p-6 space-y-4">
            <h2 className="text-lg font-semibold">Nuevo canal</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="nombre-del-canal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60">{loading ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
