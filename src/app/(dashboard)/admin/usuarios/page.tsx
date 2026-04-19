import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions/rbac'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Users, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react'
import type { RoleType } from '@prisma/client'
import { InviteUserButton } from '@/components/modals/InviteUserModal'

export default async function AdminUsuariosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  const isSuperadmin = (session.user as any).isSuperadmin

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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Activos',
            value: members.filter((m) => m.user.isActive && !m.user.isBlocked).length,
            color: 'text-green-700',
            bg: 'bg-green-50',
          },
          {
            label: 'Bloqueados',
            value: members.filter((m) => m.user.isBlocked).length,
            color: 'text-red-700',
            bg: 'bg-red-50',
          },
          {
            label: 'Inactivos',
            value: members.filter((m) => !m.user.isActive).length,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios"
            description="Invite usuarios a esta empresa para empezar."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Usuario</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">Rol</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden md:table-cell">Clínica / Dept.</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Último acceso</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => {
                  const user = m.user
                  const displayName =
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.name ?? user.email
                  const roleColors = ROLE_COLORS[m.role as RoleType]

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
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
                          {ROLE_LABELS[m.role as RoleType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-500">
                          {m.clinic?.name ?? m.department?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Nunca'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlocked ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <XCircle className="w-3.5 h-3.5" />
                            Bloqueado
                          </span>
                        ) : user.isActive ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Inactivo</span>
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
