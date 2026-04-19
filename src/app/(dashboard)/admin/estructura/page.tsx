import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Building2, MapPin, Briefcase, Users, Plus } from 'lucide-react'
import type { RoleType } from '@prisma/client'

export default async function EstructuraPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  const isSuperadmin = (session.user as any).isSuperadmin
  if (!membership && !isSuperadmin) redirect('/login')

  const companyId = membership!.companyId

  const [clinics, departments, teams] = await Promise.all([
    prisma.clinic.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { memberships: true, channels: true } } },
    }),
    prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        clinic: { select: { name: true } },
        _count: { select: { memberships: true } },
      },
    }),
    prisma.team.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { memberships: true } } },
    }),
  ])

  const canManage = isSuperadmin || hasPermission(membership!.role as RoleType, 'clinic:create')

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estructura organizativa</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Gestiona clínicas, sedes, departamentos y equipos
        </p>
      </div>

      {/* Clinics */}
      <SectionCard
        title="Clínicas y sedes"
        subtitle={`${clinics.length} sede${clinics.length !== 1 ? 's' : ''}`}
        action={
          canManage ? (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </button>
          ) : null
        }
      >
        {clinics.length === 0 ? (
          <EmptyState icon={MapPin} title="Sin clínicas" size="sm" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="p-3.5 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-accent-50">
                    <MapPin className="w-3.5 h-3.5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{clinic.name}</p>
                    {clinic.city && (
                      <p className="text-xs text-gray-400">{clinic.city}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{clinic._count.memberships} personas</span>
                  <span className="text-gray-200">·</span>
                  <span>{clinic._count.channels} canales</span>
                  <span
                    className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      clinic.isActive ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'
                    }`}
                  >
                    {clinic.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Departments */}
      <SectionCard
        title="Departamentos"
        subtitle={`${departments.length} departamento${departments.length !== 1 ? 's' : ''}`}
      >
        {departments.length === 0 ? (
          <EmptyState icon={Briefcase} title="Sin departamentos" size="sm" />
        ) : (
          <div className="divide-y divide-gray-50 mt-1">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{dept.name}</p>
                  {dept.clinic && (
                    <p className="text-xs text-gray-400 mt-0.5">{dept.clinic.name}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {dept._count.memberships} miembro{dept._count.memberships !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Teams */}
      <SectionCard
        title="Equipos"
        subtitle={`${teams.length} equipo${teams.length !== 1 ? 's' : ''}`}
      >
        {teams.length === 0 ? (
          <EmptyState icon={Users} title="Sin equipos" size="sm" />
        ) : (
          <div className="divide-y divide-gray-50 mt-1">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium text-gray-800">{team.name}</p>
                <span className="text-xs text-gray-500">
                  {team._count.memberships} miembro{team._count.memberships !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
