import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Bell, CheckCheck, Megaphone, MessageSquare, AtSign } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

const TYPE_CONFIG = {
  MENTION: { icon: AtSign, label: 'Mención', color: 'text-brand-600 bg-brand-50' },
  DIRECT_MESSAGE: { icon: MessageSquare, label: 'Mensaje directo', color: 'text-accent-600 bg-accent-50' },
  CHANNEL_MESSAGE: { icon: MessageSquare, label: 'Canal', color: 'text-blue-600 bg-blue-50' },
  ANNOUNCEMENT: { icon: Megaphone, label: 'Anuncio', color: 'text-amber-600 bg-amber-50' },
  INVITATION: { icon: Bell, label: 'Invitación', color: 'text-green-600 bg-green-50' },
  SYSTEM: { icon: Bell, label: 'Sistema', color: 'text-gray-600 bg-gray-100' },
}

export default async function NotificacionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} no leída${unreadCount !== 1 ? 's' : ''}` : 'Todo al día'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CheckCheck className="w-4 h-4" />
            Marcar todo como leído
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin notificaciones"
          description="Aquí aparecerán tus menciones, mensajes directos y comunicados importantes."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card divide-y divide-gray-50">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.SYSTEM
            const Icon = config.icon

            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 p-4 transition-colors',
                  !n.isRead ? 'bg-brand-50/40' : 'hover:bg-gray-50'
                )}
              >
                <div className={cn('p-2 rounded-lg flex-shrink-0', config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
