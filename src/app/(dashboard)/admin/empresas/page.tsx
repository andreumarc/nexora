import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Building2, CheckCircle2, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionCard } from '@/components/common/SectionCard'
import { KpiCard } from '@/components/common/KpiCard'
import { formatDate } from '@/lib/utils/format'
import { CreateCompanyButton } from '@/components/modals/CreateCompanyModal'

export default async function AdminEmpresasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!(session.user as any).isSuperadmin) redirect('/')

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clinics: true, memberships: true, channels: true } },
    },
  })

  const active = companies.filter(c => c.isActive).length
  const inactive = companies.length - active

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} registrada{companies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateCompanyButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total empresas" value={companies.length} color="blue" />
        <KpiCard label="Activas" value={active} color="green" />
        <KpiCard label="Inactivas" value={inactive} color="neutral" />
      </div>

      {/* Table */}
      <SectionCard title="Listado de empresas">
        {companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Sin empresas"
            description="Crea la primera empresa para comenzar."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Empresa</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">Slug</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden md:table-cell">Dominio</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Clínicas</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Usuarios</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden xl:table-cell">Creada</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-brand-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.slug}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{c.domain ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-700 font-medium">{c._count.clinics}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-700 font-medium">{c._count.memberships}</span>
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
