import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Megaphone, AlertCircle, Info, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { formatRelativeTime } from '@/lib/utils/format'
import { hasPermission } from '@/lib/permissions/rbac'
import { cn } from '@/lib/utils/cn'
import type { RoleType } from '@prisma/client'

const PRIORITY_CONFIG = {
  URGENT: {
    icon: AlertCircle,
    label: 'Urgente',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'text-red-700 bg-red-100',
    dot: 'bg-red-500',
  },
  HIGH: {
    icon: AlertTriangle,
    label: 'Importante',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'text-amber-700 bg-amber-100',
    dot: 'bg-amber-500',
  },
  NORMAL: {
    icon: Info,
    label: 'Normal',
    bg: 'bg-white',
    border: 'border-gray-100',
    badge: 'text-brand-700 bg-brand-50',
    dot: 'bg-brand-400',
  },
  LOW: {
    icon: Info,
    label: 'Informativo',
    bg: 'bg-white',
    border: 'border-gray-100',
    badge: 'text-gray-600 bg-gray-100',
    dot: 'bg-gray-300',
  },
}

export default async function AnunciosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership) redirect('/login')

  const announcements = await prisma.announcement.findMany({
    where: {
      companyId: membership.companyId,
      isPublished: true,
      deletedAt: null,
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          jobTitle: true,
        },
      },
      reads: {
        where: { userId: session.user.id },
        select: { readAt: true, confirmedAt: true },
        take: 1,
      },
      _count: { select: { reads: true } },
    },
  })

  const canCreate = hasPermission(membership.role as RoleType, 'announcement:create')

  const pinned = announcements.filter((a) => a.isPinned)
  const regular = announcements.filter((a) => !a.isPinned)

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anuncios</h1>
          <p className="mt-0.5 text-sm text-gray-500">Comunicaciones corporativas internas</p>
        </div>
        {canCreate && (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo anuncio</span>
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin anuncios publicados"
          description="Los comunicados corporativos aparecerán aquí cuando se publiquen."
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                📌 Fijados
              </p>
              <div className="space-y-3">
                {pinned.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} userId={session.user.id!} />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Todos los anuncios
                </p>
              )}
              <div className="space-y-3">
                {regular.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} userId={session.user.id!} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ announcement: a, userId }: { announcement: any; userId: string }) {
  const config = PRIORITY_CONFIG[a.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.NORMAL
  const PriorityIcon = config.icon
  const userRead = a.reads[0]
  const hasRead = !!userRead
  const hasConfirmed = !!userRead?.confirmedAt

  const displayName =
    a.createdBy.firstName && a.createdBy.lastName
      ? `${a.createdBy.firstName} ${a.createdBy.lastName}`
      : a.createdBy.name

  return (
    <Link href={`/anuncios/${a.id}`}>
      <div
        className={cn(
          'rounded-xl border p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
          config.bg,
          config.border
        )}
      >
        <div className="flex items-start gap-3">
          {/* Priority indicator */}
          <div className={cn('flex-shrink-0 p-2 rounded-lg', config.badge.replace('text-', 'bg-').split(' ')[0])}>
            <PriorityIcon className="w-4 h-4" style={{ color: 'currentColor' }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 leading-snug">{a.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', config.badge)}>
                  {config.label}
                </span>
                {hasRead ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Leído</span>
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Content preview */}
            <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">{a.content}</p>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Avatar
                  name={a.createdBy.name}
                  firstName={a.createdBy.firstName}
                  lastName={a.createdBy.lastName}
                  avatarUrl={a.createdBy.avatarUrl}
                  size="xs"
                />
                <span className="text-xs text-gray-500">{displayName}</span>
              </div>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">
                {a.publishedAt ? formatRelativeTime(a.publishedAt) : ''}
              </span>
              {a.requiresRead && !hasConfirmed && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs font-medium text-amber-600">
                    ⚠️ Requiere confirmación de lectura
                  </span>
                </>
              )}
              {a.requiresRead && hasConfirmed && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs font-medium text-green-600">✓ Confirmado</span>
                </>
              )}
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">
                {a._count.reads} lectura{a._count.reads !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
