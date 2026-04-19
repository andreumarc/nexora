import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Users, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { PresenceDot, PRESENCE_LABELS } from '@/components/common/PresenceDot'
import { EmptyState } from '@/components/common/EmptyState'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions/rbac'
import { cn } from '@/lib/utils/cn'
import type { RoleType } from '@prisma/client'

export default async function DirectorioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership) redirect('/login')

  const members = await prisma.membership.findMany({
    where: { companyId: membership.companyId, isActive: true },
    orderBy: [{ role: 'asc' }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          jobTitle: true,
          email: true,
          phone: true,
          isActive: true,
          isBlocked: true,
          presence: {
            select: { status: true, statusText: true },
          },
        },
      },
      clinic: { select: { name: true } },
      department: { select: { name: true } },
    },
  })

  const activeMembersCount = members.filter((m) => !m.user.isBlocked && m.user.isActive).length

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Directorio interno</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {activeMembersCount} persona{activeMembersCount !== 1 ? 's' : ''} en la organización
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description="No hay personas en el directorio todavía."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m) => {
            const user = m.user
            if (!user.isActive) return null

            const displayName =
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.name ?? user.email

            const roleColors = ROLE_COLORS[m.role as RoleType]
            const presenceStatus = user.presence?.status ?? 'OFFLINE'

            return (
              <Link key={m.id} href={`/directorio/${user.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 p-4 cursor-pointer">
                  {/* Avatar + presence */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <Avatar
                        name={user.name}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        avatarUrl={user.avatarUrl}
                        size="lg"
                      />
                      <PresenceDot
                        status={presenceStatus as any}
                        size="md"
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>

                    <p className="text-sm font-semibold text-gray-900 truncate w-full">
                      {displayName}
                    </p>

                    {user.jobTitle && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate w-full">{user.jobTitle}</p>
                    )}

                    {/* Role badge */}
                    <span
                      className={cn(
                        'mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        roleColors.bg,
                        roleColors.text,
                        roleColors.border
                      )}
                    >
                      {ROLE_LABELS[m.role as RoleType]}
                    </span>

                    {/* Clinic / dept */}
                    {(m.clinic || m.department) && (
                      <p className="mt-1 text-[10px] text-gray-400 truncate w-full">
                        {m.clinic?.name ?? m.department?.name}
                      </p>
                    )}

                    {/* Presence */}
                    <p className="mt-1.5 text-[10px] text-gray-400">
                      {PRESENCE_LABELS[presenceStatus as keyof typeof PRESENCE_LABELS]}
                    </p>
                  </div>

                  {/* Quick actions */}
                  {user.id !== session.user.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
                      <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:text-brand-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enviar mensaje
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
