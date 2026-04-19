import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionCard } from '@/components/common/SectionCard'
import { KpiCard } from '@/components/common/KpiCard'
import { formatDate } from '@/lib/utils/format'
import { CreateClinicButton } from '@/components/modals/CreateClinicModal'
import { hasPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'

export default async function AdminClinicasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const isSuperadmin = (session.user as any).isSuperadmin

  let clinics: any[] = []
  let canCreate = false

  if (isSuperadmin) {
    clinics = await prisma.clinic.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } },
        _count: { select: { memberships: true, channels: true } },
      },
    })
    canCreate = true
  } else {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { companyId: true, role: true },
    })
    if (!membership) redirect('/')
    canCreate = hasPermission(membership.role as RoleType, 'clinic:create')
    clinics = await prisma.clinic.findMany({
      where: { companyId: membership.companyId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        company: { select: { name: true } },
        _count: { select: { memberships: true, channels: true } },
      },
    })
  }

  const active = clinics.filter(c => c.isActive).length

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clínicas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {clinics.length} clínica{clinics.length !== 1 ? 's' : ''} registrada{clinics.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && <CreateClinicButton />}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total clínicas" value={clinics.length} color="blue" />
        <KpiCard label="Activas" value={active} color="green" />
        <KpiCard label="Inactivas" value={clinics.length - active} color="neutral" />
      </div>

      {/* Table */}
      <SectionCard title="Listado de clínicas">
        {clinics.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Sin clínicas"
            description="Crea la primera clínica para comenzar."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Clínica</th>
                  {isSuperadmin && <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">Empresa</th>}
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden md:table-cell">Código</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Ciudad</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Usuarios</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden xl:table-cell">Creada</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clinics.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-accent-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          {c.address && <p className="text-xs text-gray-400">{c.address}</p>}
                        </div>
                      </div>
                    </td>
                    {isSuperadmin && (
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-600">{c.company?.name ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.code ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{c.city ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{c._count.memberships}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(c.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactiva
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
