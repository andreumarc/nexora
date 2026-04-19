import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Hash, Lock, Megaphone, Wrench } from 'lucide-react'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { hasPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'
import { CreateChannelButton } from '@/components/modals/CreateChannelModal'

const TYPE_ICONS = {
  PUBLIC: Hash,
  PRIVATE: Lock,
  ANNOUNCEMENT: Megaphone,
  OPERATIONAL: Wrench,
}

const TYPE_LABELS = {
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
  ANNOUNCEMENT: 'Anuncios',
  OPERATIONAL: 'Operativo',
}

export default async function CanalesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership) redirect('/login')

  const channels = await prisma.channel.findMany({
    where: {
      companyId: membership.companyId,
      deletedAt: null,
      isArchived: false,
      OR: [
        { type: { not: 'PRIVATE' } },
        {
          members: {
            some: { userId: session.user.id },
          },
        },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { name: 'asc' }],
    include: {
      clinic: { select: { name: true, code: true } },
      _count: { select: { members: true, messages: true } },
    },
  })

  const canCreate = hasPermission(membership.role as RoleType, 'channel:create')

  const grouped = channels.reduce<Record<string, typeof channels>>(
    (acc, ch) => {
      const key = ch.clinicId ? `Clínica: ${ch.clinic?.name}` : 'Corporativos'
      if (!acc[key]) acc[key] = []
      acc[key].push(ch)
      return acc
    },
    {}
  )

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canales</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {channels.length} canal{channels.length !== 1 ? 'es' : ''} disponible{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && <CreateChannelButton />}
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={Hash}
          title="Sin canales disponibles"
          description="Aún no hay canales en tu empresa. Los administradores pueden crear canales corporativos y por clínica."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupChannels]) => (
            <SectionCard key={group} title={group}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                {groupChannels.map((channel) => {
                  const Icon = TYPE_ICONS[channel.type as keyof typeof TYPE_ICONS] ?? Hash
                  return (
                    <Link key={channel.id} href={`/canales/${channel.id}`}>
                      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all duration-150 cursor-pointer group">
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-brand-100 transition-colors flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-500 group-hover:text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {channel.name}
                            </span>
                            {channel.isPinned && <span className="text-[10px]">📌</span>}
                          </div>
                          {channel.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {channel.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-gray-400">
                              {channel._count.members} miembro{channel._count.members !== 1 ? 's' : ''}
                            </span>
                            <span className="text-gray-200">·</span>
                            <span className="text-[10px] text-gray-400">
                              {TYPE_LABELS[channel.type as keyof typeof TYPE_LABELS]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  )
}
