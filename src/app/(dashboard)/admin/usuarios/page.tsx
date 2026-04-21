import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { InviteUserButton } from '@/components/modals/InviteUserModal'
import { MembersTable } from '@/components/admin/MembersTable'
import type { RoleType } from '@prisma/client'

export default async function AdminUsuariosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const isSuperadmin = (session.user as any).isSuperadmin

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership && !isSuperadmin) redirect('/login')

  const canManage = isSuperadmin || hasPermission(membership!.role as RoleType, 'user:invite')
  if (!canManage) redirect('/dashboard')

  const companyId = membership!.companyId

  const members = await prisma.membership.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          jobTitle: true,
          isActive: true,
          isBlocked: true,
          lastActiveAt: true,
          createdAt: true,
        },
      },
      clinic: { select: { name: true } },
      department: { select: { name: true } },
    },
  })

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} usuario{members.length !== 1 ? 's' : ''} en la empresa
          </p>
        </div>
        <InviteUserButton />
      </div>

      <MembersTable members={members} />
    </div>
  )
}
