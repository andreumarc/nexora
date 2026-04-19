import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Avatar } from '@/components/common/Avatar'
import { PresenceDot, PRESENCE_LABELS } from '@/components/common/PresenceDot'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions/rbac'
import { formatDate } from '@/lib/utils/format'
import { ArrowLeft, Mail, Building2, Briefcase, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { RoleType } from '@prisma/client'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId: profileUserId } = await params
  const session = await auth()
  const currentUserId = session?.user?.id
  if (!currentUserId) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: currentUserId, isActive: true },
    select: { companyId: true },
  })
  if (!membership) redirect('/login')

  const profileMembership = await prisma.membership.findFirst({
    where: { userId: profileUserId, companyId: membership.companyId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          email: true,
          jobTitle: true,
          isActive: true,
          createdAt: true,
          lastActiveAt: true,
          presence: { select: { status: true, statusText: true, updatedAt: true } },
        },
      },
      clinic: { select: { name: true, code: true } },
      department: { select: { name: true } },
      company: { select: { name: true } },
    },
  })

  if (!profileMembership) notFound()

  const { user } = profileMembership
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name ?? user.email

  const presenceStatus = (user.presence?.status ?? 'OFFLINE') as keyof typeof PRESENCE_LABELS
  const roleColors = ROLE_COLORS[profileMembership.role as RoleType]
  const isOwnProfile = profileUserId === currentUserId

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto animate-fade-in">
      <Link href="/directorio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al directorio
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <Avatar
              name={user.name}
              firstName={user.firstName}
              lastName={user.lastName}
              avatarUrl={user.avatarUrl}
              size="xl"
            />
            <PresenceDot status={presenceStatus} className="absolute -bottom-0.5 -right-0.5 w-4 h-4" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            {user.jobTitle && <p className="text-sm text-gray-500 mt-0.5">{user.jobTitle}</p>}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', roleColors.bg, roleColors.text, roleColors.border)}>
                {ROLE_LABELS[profileMembership.role as RoleType]}
              </span>
              <span className="text-xs text-gray-400">{PRESENCE_LABELS[presenceStatus]}</span>
            </div>
          </div>
          {!isOwnProfile && (
            <Link
              href={`/mensajes`}
              className="flex-shrink-0 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Enviar mensaje
            </Link>
          )}
        </div>

        {/* Info */}
        <div className="px-6 py-5 space-y-4">
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Building2} label="Empresa" value={profileMembership.company.name} />
          {profileMembership.clinic && (
            <InfoRow icon={Building2} label="Clínica" value={profileMembership.clinic.name} />
          )}
          {profileMembership.department && (
            <InfoRow icon={Briefcase} label="Departamento" value={profileMembership.department.name} />
          )}
          <InfoRow icon={Calendar} label="Miembro desde" value={formatDate(user.createdAt)} />
          {user.lastActiveAt && (
            <InfoRow icon={Calendar} label="Último acceso" value={formatDate(user.lastActiveAt)} />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}
