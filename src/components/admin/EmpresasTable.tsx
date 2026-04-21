'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export interface EmpresaItem {
  id: string
  name: string
  slug: string
  domain: string | null
  isActive: boolean
  createdAt: Date | string
  _count: {
    clinics: number
    memberships: number
  }
}

type Tab = 'todas' | 'activas' | 'inactivas'

const TABS: { key: Tab; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'activas', label: 'Activas' },
  { key: 'inactivas', label: 'Inactivas' },
]

function filterEmpresas(items: EmpresaItem[], tab: Tab): EmpresaItem[] {
  if (tab === 'activas') return items.filter(c => c.isActive)
  if (tab === 'inactivas') return items.filter(c => !c.isActive)
  return items
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function EmpresasTable({ companies }: { companies: EmpresaItem[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('todas')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const visible = filterEmpresas(companies, activeTab)
  const allVisibleIds = visible.map(c => c.id)
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
    if (!confirm(`¿Eliminar ${ids.length} empresa${ids.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/admin/companies/${id}`, { method: 'DELETE' }).then(r => {
            if (!r.ok) throw new Error(`Error al eliminar empresa ${id}`)
          })
        )
      )
      toast.success(`${ids.length} empresa${ids.length !== 1 ? 's' : ''} eliminada${ids.length !== 1 ? 's' : ''}.`)
      setSelected(new Set())
      router.refresh()
    } catch {
      toast.error('Error al eliminar las empresas seleccionadas.')
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
          const count = filterEmpresas(companies, tab.key).length
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
            icon={Building2}
            title="Sin empresas"
            description="No hay empresas en esta categoría."
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
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Empresa</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Dominio</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Clínicas</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Usuarios</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden xl:table-cell">Alta</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map(c => (
                  <tr
                    key={c.id}
                    className={cn(
                      'hover:bg-gray-50/60 transition-colors',
                      selected.has(c.id) && 'bg-brand-50/40'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ background: '#e6eef7', color: '#003A70' }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{c.domain ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{c._count.clinics}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{c._count.memberships}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-green-700 bg-green-50">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(c.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
