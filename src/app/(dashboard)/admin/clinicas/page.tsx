import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { CreateClinicButton } from '@/components/modals/CreateClinicModal'
import { ClinicasTable, type ClinicaItem } from '@/components/admin/ClinicasTable'
import type { RoleType } from '@prisma/client'

export default async function AdminClinicasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const isSuperadmin = (session.user as any).isSuperadmin

  let clinics: ClinicaItem[]
  let canCreate = false

  const clinicSelect = {
    where: { deletedAt: null as Date | null },
    orderBy: { createdAt: 'desc' as const },
    include: {
      company: { select: { name: true } },
      _count: { select: { memberships: true, channels: true } },
    },
  }

  if (isSuperadmin) {
    clinics = await prisma.clinic.findMany(clinicSelect)
    canCreate = true
  } else {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { companyId: true, role: true },
    })
    if (!membership) redirect('/')
    canCreate = hasPermission(membership.role as RoleType, 'clinic:create')
    clinics = await prisma.clinic.findMany({
      ...clinicSelect,
      where: { companyId: membership.companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    })
  }

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

      <ClinicasTable clinics={clinics} showEmpresa={isSuperadmin} />
    </div>
  )
}
