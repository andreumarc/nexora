import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Avatar } from '@/components/common/Avatar'
import { SectionCard } from '@/components/common/SectionCard'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions/rbac'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import { Mail, Phone, Briefcase, MapPin, Calendar } from 'lucide-react'
import type { RoleType } from '@prisma/client'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          company: { select: { name: true } },
          clinic: { select: { name: true } },
          department: { select: { name: true } },
        },
        take: 1,
      },
      presence: true,
    },
  })

  if (!user) redirect('/login')

  const membership = user.memberships[0]
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name ?? user.email

  const roleColors = membership ? ROLE_COLORS[membership.role as RoleType] : null

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>

      {/* Profile card */}
      <SectionCard>
        <div className="flex items-start gap-5">
          <Avatar
            name={user.name}
            firstName={user.firstName}
            lastName={user.lastName}
            avatarUrl={user.avatarUrl}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            {user.jobTitle && (
              <p className="text-sm text-gray-500 mt-0.5">{user.jobTitle}</p>
            )}
            {membership && roleColors && (
              <span
                className={cn(
                  'mt-2 inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border',
                  roleColors.bg,
                  roleColors.text,
                  roleColors.border
                )}
              >
                {ROLE_LABELS[membership.role as RoleType]}
              </span>
            )}
          </div>
          <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            Editar
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{user.phone}</span>
            </div>
          )}
          {membership?.company && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{membership.company.name}</span>
            </div>
          )}
          {membership?.clinic && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{membership.clinic.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Desde {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
