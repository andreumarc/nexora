import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateCompanyButton } from '@/components/modals/CreateCompanyModal'
import { EmpresasTable } from '@/components/admin/EmpresasTable'

export default async function AdminEmpresasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!(session.user as any).isSuperadmin) redirect('/')

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clinics: true, memberships: true } },
    },
  })

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

      <EmpresasTable companies={companies} />
    </div>
  )
}
