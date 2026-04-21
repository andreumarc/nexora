'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions/rbac'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { RoleType } from '@prisma/client'

export interface MemberItem {
  id: string
  role: RoleType
  user: {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    jobTitle: string | null
    isActive: boolean
    isBlocked: boolean
    lastActiveAt: Date | string | null
    createdAt: Date | string
  }
  clinic: { name: string } | null
  department: { name: string } | null
}

type Tab = 'todos' | 'activos' | 'bloqueados' | 'inactivos'

const TABS: { key: Tab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'activos', label: 'Activos' },
  { key: 'bloqueados', label: 'Bloqueados' },
  { key: 'inactivos', label: 'Inactivos' },
]

function filterMembers(members: MemberItem[], tab: Tab): MemberItem[] {
  if (tab === 'activos') return members.filter(m => m.user.isActive && !m.user.isBlocked)
  if (tab === 'bloqueados') return members.filter(m => m.user.isBlocked)
  if (tab === 'inactivos') return members.filter(m => !m.user.isActive && !m.user.isBlocked)
  return members
}

function tabCount(members: MemberItem[], tab: Tab): number {
  return filterMembers(members, tab).length
}

export function MembersTable({ members }: { members: MemberItem[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const visible = filterMembers(members, activeTab)
  const allVisibleIds = visible.map(m => m.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id))

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        allVisibleIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        allVisibleIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = [...selected].filter(id => allVisibleIds.includes(id))
    if (ids.length === 0) return
    if (!confirm(`¿Desactivar ${ids.length} miembro${ids.length !== 1 ? 's' : ''}?`)) return
    setDeleting(true)
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/admin/memberships/${id}`, { method: 'DELETE' }).then(r => {
            if (!r.ok) throw new Error(`Error al desactivar ${id}`)
          })
        )
      )
      toast.success(`${ids.length} miembro${ids.length !== 1 ? 's' : ''} desactivado${ids.length !== 1 ? 's' : ''}.`)
      setSelected(new Set())
      router.refresh()
    } catch {
      toast.error('Error al desactivar los miembros seleccionados.')
    } finally {
      setDeleting(false)
    }
  }

  const selectedInView = allVisibleIds.filter(id => selected.has(id)).length

  return (
    <div className="space-y-4">
      {/* Tabs row */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const count = tabCount(members, tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelected(new Set()) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}

        {selectedInView > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar seleccionados ({selectedInView})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios"
            description="No hay usuarios en esta categoría."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/60">
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Usuario</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Rol</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Clínica / Dept.</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Último acceso</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map(m => {
                  const user = m.user
                  const displayName =
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.name ?? user.email
                  const roleColors = ROLE_COLORS[m.role]

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-gray-50/60 transition-colors',
                        selected.has(m.id) && 'bg-brand-50/40'
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleOne(m.id)}
                          className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={user.name}
                            firstName={user.firstName}
                            lastName={user.lastName}
                            avatarUrl={user.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full border',
                            roleColors.bg,
                            roleColors.text,
                            roleColors.border
                          )}
                        >
                          {ROLE_LABELS[m.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-500">
                          {m.clinic?.name ?? m.department?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : 'Nunca'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-red-700 bg-red-50">
                            Bloqueado
                          </span>
                        ) : user.isActive ? (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-green-700 bg-green-50">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
