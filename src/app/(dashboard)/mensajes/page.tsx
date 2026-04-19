import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { MessageSquare, Plus } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { PresenceDot } from '@/components/common/PresenceDot'
import { EmptyState } from '@/components/common/EmptyState'
import { formatRelativeTime, truncate } from '@/lib/utils/format'

export default async function MensajesPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    select: { companyId: true },
  })

  if (!membership) redirect('/login')

  const conversations = await prisma.directConversation.findMany({
    where: {
      companyId: membership.companyId,
      members: { some: { userId: userId } },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              jobTitle: true,
              presence: { select: { status: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          sender: { select: { firstName: true, name: true } },
        },
      },
    },
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes directos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo mensaje</span>
        </button>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Sin conversaciones"
          description="Inicia un mensaje directo con cualquier persona del directorio."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card divide-y divide-gray-50">
          {conversations.map((conv) => {
            const otherMembers = conv.members.filter((m) => m.userId !== userId)
            const displayMembers = conv.isGroup
              ? conv.members
              : otherMembers

            const name = conv.isGroup
              ? conv.name ?? `Grupo (${conv.members.length})`
              : otherMembers[0]
                ? otherMembers[0].user.firstName && otherMembers[0].user.lastName
                  ? `${otherMembers[0].user.firstName} ${otherMembers[0].user.lastName}`
                  : otherMembers[0].user.name
                : 'Conversación'

            const lastMsg = conv.messages[0]
            const presenceStatus =
              !conv.isGroup && otherMembers[0]
                ? (otherMembers[0].user.presence?.status ?? 'OFFLINE')
                : null

            return (
              <Link key={conv.id} href={`/mensajes/${conv.id}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {!conv.isGroup && otherMembers[0] ? (
                      <>
                        <Avatar
                          name={otherMembers[0].user.name}
                          firstName={otherMembers[0].user.firstName}
                          lastName={otherMembers[0].user.lastName}
                          avatarUrl={otherMembers[0].user.avatarUrl}
                          size="md"
                        />
                        {presenceStatus && (
                          <PresenceDot
                            status={presenceStatus as any}
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-brand-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    {lastMsg ? (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {lastMsg.sender.firstName ?? lastMsg.sender.name}:{' '}
                        {truncate(lastMsg.content, 60)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sin mensajes todavía</p>
                    )}
                  </div>

                  {/* Time */}
                  {lastMsg && (
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatRelativeTime(lastMsg.createdAt)}
                    </span>
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
