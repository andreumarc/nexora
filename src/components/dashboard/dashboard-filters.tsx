'use client'
/**
 * DashboardFilters — global filter bar for Nexora dashboard.
 * URL params: period, dateFrom, dateTo, companyId, clinicId.
 * Role gating:
 *   - Empresa (Company) selector: only for superadmins.
 *   - Clínica selector: shown whenever the effective company has clinics
 *     the user can see (superadmins: all; others: via memberships).
 * Visible to all roles.
 */
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { SlidersHorizontal } from 'lucide-react'

type Company = { id: string; name: string }
type Clinic  = { id: string; name: string; companyId: string }
type Period = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom'

const LABELS: Record<Period, string> = {
  today: 'Hoy', yesterday: 'Ayer', '7days': '7 días', '30days': '30 días',
  this_month: 'Este mes', last_month: 'Mes anterior', custom: 'Personalizado',
}
const PERIODS: Period[] = ['today', 'yesterday', '7days', '30days', 'this_month', 'last_month']

function fmt(d: Date) { return d.toISOString().slice(0, 10) }
function getRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const firstOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const yesterday      = new Date(now); yesterday.setDate(now.getDate() - 1)
  const lastMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthLast  = new Date(now.getFullYear(), now.getMonth(), 0)
  const d7  = new Date(now); d7.setDate(now.getDate() - 7)
  const d30 = new Date(now); d30.setDate(now.getDate() - 30)
  const map: Record<Period, { from: string; to: string }> = {
    today:      { from: fmt(now), to: fmt(now) },
    yesterday:  { from: fmt(yesterday), to: fmt(yesterday) },
    '7days':    { from: fmt(d7), to: fmt(now) },
    '30days':   { from: fmt(d30), to: fmt(now) },
    this_month: { from: fmt(firstOfMonth), to: fmt(lastOfMonth) },
    last_month: { from: fmt(lastMonthFirst), to: fmt(lastMonthLast) },
    custom:     { from: '', to: '' },
  }
  return map[period]
}

export function DashboardFilters({ isSuperadmin = false }: { isSuperadmin?: boolean }) {
  const router   = useRouter()
  const sp       = useSearchParams()
  const pathname = usePathname()
  const [companies, setCompanies] = useState<Company[]>([])
  const [clinics, setClinics]     = useState<Clinic[]>([])

  useEffect(() => {
    fetch('/api/filters/context')
      .then((r) => r.ok ? r.json() : { companies: [], clinics: [] })
      .then((d) => { setCompanies(d.companies ?? []); setClinics(d.clinics ?? []) })
      .catch(() => {})
  }, [])

  const period    = (sp.get('period') as Period) ?? 'this_month'
  const companyId = sp.get('companyId') ?? ''
  const clinicId  = sp.get('clinicId')  ?? ''
  const dateFrom  = sp.get('dateFrom')  ?? ''
  const dateTo    = sp.get('dateTo')    ?? ''

  const nav = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k))
    router.push(`${pathname}?${params.toString()}`)
    // Force the Server Component (page.tsx) to re-execute with the new
    // searchParams — without this, Next.js Router Cache may serve the
    // previous render and KPIs/date-filtered data won't refresh.
    router.refresh()
  }, [router, sp, pathname])

  function selectPeriod(p: Period) {
    if (p === 'custom') { nav({ period: p }); return }
    const { from, to } = getRange(p)
    nav({ period: p, dateFrom: from, dateTo: to })
  }

  const effectiveClinics = clinics.filter(
    (c) => !companyId || c.companyId === companyId,
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 text-violet-700 shrink-0">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
      </div>
      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map(p => (
          <button key={p} onClick={() => selectPeriod(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${period === p ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {LABELS[p]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Desde</span>
        <input type="date" value={dateFrom} onChange={e => nav({ period: 'custom', dateFrom: e.target.value, dateTo })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400" />
        <span className="text-xs text-gray-500">hasta</span>
        <input type="date" value={dateTo} onChange={e => nav({ period: 'custom', dateFrom, dateTo: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400" />
      </div>

      {/* Empresa — superadmin only */}
      {isSuperadmin && companies.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Empresa</span>
            <select value={companyId}
              onChange={e => nav({ companyId: e.target.value, clinicId: '' })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white">
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}

      {effectiveClinics.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Clínica</span>
            <select value={clinicId} onChange={e => nav({ clinicId: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white">
              <option value="">Todas las clínicas</option>
              {effectiveClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
