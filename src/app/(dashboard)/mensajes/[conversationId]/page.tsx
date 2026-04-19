import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { DmView } from '@/components/channels/DmView'

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    select: { companyId: true },
  })
  if (!membership) redirect('/login')

  const conversation = await prisma.directConversation.findFirst({
    where: {
      id: conversationId,
      companyId: membership.companyId,
      members: { some: { userId } },
    },
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
            },
          },
        },
      },
    },
  })

  if (!conversation) notFound()

  const messages = await prisma.message.findMany({
    where: { conversationId, parentId: null },
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
        select: { id: true, name: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true },
      },
      reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } },
      attachments: {
        select: { id: true, fileName: true, fileSize: true, mimeType: true, publicUrl: true, storageKey: true },
      },
      _count: { select: { replies: true } },
    },
  })

  const otherMembers = conversation.members.filter((m) => m.userId !== userId)
  const title = conversation.isGroup
    ? conversation.name ?? `Grupo (${conversation.members.length})`
    : otherMembers[0]
      ? otherMembers[0].user.firstName && otherMembers[0].user.lastName
        ? `${otherMembers[0].user.firstName} ${otherMembers[0].user.lastName}`
        : otherMembers[0].user.name ?? 'Conversación'
      : 'Conversación'

  return (
    <DmView
      conversationId={conversationId}
      title={title}
      isGroup={conversation.isGroup}
      members={conversation.members.map((m) => m.user)}
      initialMessages={messages.reverse() as any}
      currentUserId={userId}
    />
  )
}
