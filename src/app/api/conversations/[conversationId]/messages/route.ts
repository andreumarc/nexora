import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getTenantContext } from '@/lib/tenant/isolation'
import { z } from 'zod'

const sendSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().optional().nullable(),
})

const MESSAGE_SELECT = {
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
  reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } },
  attachments: {
    select: { id: true, fileName: true, fileSize: true, mimeType: true, publicUrl: true, storageKey: true },
  },
  _count: { select: { replies: true } },
} as const

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversation = await prisma.directConversation.findFirst({
    where: {
      id: conversationId,
      companyId: ctx.companyId,
      members: { some: { userId: ctx.userId } },
    },
  })

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

  const messages = await prisma.message.findMany({
    where: { conversationId, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: MESSAGE_SELECT,
  })

  return NextResponse.json({ messages: messages.reverse(), nextCursor: messages[0]?.id ?? null })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversation = await prisma.directConversation.findFirst({
    where: {
      id: conversationId,
      companyId: ctx.companyId,
      members: { some: { userId: ctx.userId } },
    },
  })

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: ctx.userId,
      content: parsed.data.content,
      type: 'TEXT',
      parentId: parsed.data.parentId,
    },
    select: MESSAGE_SELECT,
  })

  return NextResponse.json(message, { status: 201 })
}
