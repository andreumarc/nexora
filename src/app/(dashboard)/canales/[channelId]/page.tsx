import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { ChannelView } from '@/components/channels/ChannelView'
import { hasPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'

interface PageProps {
  params: Promise<{ channelId: string }>
}

export default async function ChannelPage({ params }: PageProps) {
  const { channelId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership) redirect('/login')

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      companyId: membership.companyId,
      deletedAt: null,
    },
    include: {
      clinic: { select: { name: true, code: true } },
      members: {
        where: { userId: session.user.id },
        take: 1,
      },
      _count: { select: { members: true } },
    },
  })

  if (!channel) notFound()

  // Private channel access check
  if (channel.type === 'PRIVATE' && channel.members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-700">Canal privado</p>
          <p className="mt-1 text-sm text-gray-400">
            No tienes acceso a este canal. Solicita al administrador que te añada.
          </p>
        </div>
      </div>
    )
  }

  // Initial messages
  const messages = await prisma.message.findMany({
    where: { channelId, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      content: true,
      type: true,
      isPinned: true,
      isDeleted: true,
      editedAt: true,
      createdAt: true,
      updatedAt: true,
      parentId: true,
      sender: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          jobTitle: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
          user: { select: { name: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          publicUrl: true,
          storageKey: true,
        },
      },
      _count: { select: { replies: true } },
    },
  })

  const pinnedMessages = await prisma.message.findMany({
    where: { channelId, isPinned: true, isDeleted: false },
    orderBy: { pinnedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      content: true,
      sender: { select: { firstName: true, lastName: true, name: true } },
      pinnedAt: true,
    },
  })

  const canPin = hasPermission(membership.role as RoleType, 'message:pin')
  const canDeleteAny = hasPermission(membership.role as RoleType, 'message:delete_any')
  const canSend = !channel.isReadOnly && !channel.isArchived &&
    hasPermission(membership.role as RoleType, 'message:send')

  return (
    <ChannelView
      channel={{
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isReadOnly: channel.isReadOnly,
        isArchived: channel.isArchived,
        isOperational: channel.isOperational,
        clinic: channel.clinic,
        memberCount: channel._count.members,
      }}
      initialMessages={messages.reverse() as any}
      pinnedMessages={pinnedMessages as any}
      currentUserId={session.user.id}
      canPin={canPin}
      canDeleteAny={canDeleteAny}
      canSend={canSend}
    />
  )
}
