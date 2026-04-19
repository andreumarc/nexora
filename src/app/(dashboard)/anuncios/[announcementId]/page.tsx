import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Avatar } from '@/components/common/Avatar'
import { formatDateLong, formatRelativeTime } from '@/lib/utils/format'
import { ArrowLeft, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const PRIORITY_CONFIG = {
  URGENT: { icon: AlertCircle, label: 'Urgente', badge: 'text-red-700 bg-red-100 border-red-200' },
  HIGH: { icon: AlertTriangle, label: 'Importante', badge: 'text-amber-700 bg-amber-100 border-amber-200' },
  NORMAL: { icon: Info, label: 'Normal', badge: 'text-brand-700 bg-brand-50 border-brand-200' },
  LOW: { icon: Info, label: 'Informativo', badge: 'text-gray-600 bg-gray-100 border-gray-200' },
}

interface PageProps {
  params: Promise<{ announcementId: string }>
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { announcementId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    select: { companyId: true },
  })
  if (!membership) redirect('/login')

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, companyId: membership.companyId, deletedAt: null },
    include: {
      createdBy: {
        select: { name: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true },
      },
      reads: {
        where: { userId },
        select: { readAt: true, confirmedAt: true },
        take: 1,
      },
      _count: { select: { reads: true } },
    },
  })

  if (!announcement) notFound()

  // Mark as read automatically
  if (announcement.reads.length === 0) {
    await prisma.announcementRead.create({
      data: { announcementId: announcement.id, userId, readAt: new Date() },
    }).catch(() => {})
  }

  const config = PRIORITY_CONFIG[announcement.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.NORMAL
  const Icon = config.icon
  const isRead = announcement.reads.length > 0
  const isConfirmed = announcement.reads[0]?.confirmedAt != null

  const authorName = announcement.createdBy.firstName && announcement.createdBy.lastName
    ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`
    : announcement.createdBy.name ?? 'Administrador'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
      <Link href="/anuncios" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver a anuncios
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', config.badge)}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          {isRead ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Leído
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-4 h-4" />
              Sin leer
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{announcement.title}</h1>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={announcement.createdBy.name}
                firstName={announcement.createdBy.firstName}
                lastName={announcement.createdBy.lastName}
                avatarUrl={announcement.createdBy.avatarUrl}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{authorName}</p>
                <p className="text-xs text-gray-400">
                  {announcement.publishedAt
                    ? `Publicado ${formatRelativeTime(announcement.publishedAt)}`
                    : formatDateLong(announcement.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{announcement._count.reads} lectura{announcement._count.reads !== 1 ? 's' : ''}</p>
          </div>

          {announcement.requiresRead && !isConfirmed && (
            <ConfirmReadButton announcementId={announcement.id} />
          )}
          {isConfirmed && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Lectura confirmada correctamente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmReadButton({ announcementId }: { announcementId: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { auth } = await import('@/lib/auth/auth')
        const { prisma } = await import('@/lib/db/prisma')
        const session = await auth()
        if (!session?.user?.id) return
        await prisma.announcementRead.upsert({
          where: { announcementId_userId: { announcementId, userId: session.user.id } },
          update: { confirmedAt: new Date() },
          create: { announcementId, userId: session.user.id, readAt: new Date(), confirmedAt: new Date() },
        })
      }}
      className="mt-4"
    >
      <button
        type="submit"
        className="w-full sm:w-auto px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        ✓ Confirmar lectura
      </button>
    </form>
  )
}
