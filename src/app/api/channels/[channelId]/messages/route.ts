import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { getTenantContext, assertCompanyAccess } from '@/lib/tenant/isolation'
import { hasPermission } from '@/lib/permissions/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'
import type { RoleType } from '@prisma/client'

const sendSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, companyId: ctx.companyId, deletedAt: null },
  })

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  await assertCompanyAccess(ctx, channel.companyId)

  const messages = await prisma.message.findMany({
    where: { channelId, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
        select: { emoji: true, userId: true, user: { select: { name: true } } },
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

  return NextResponse.json({ messages: messages.reverse(), nextCursor: messages[0]?.id ?? null })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role as RoleType, 'message:send')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, companyId: ctx.companyId, deletedAt: null },
  })

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  if (channel.isReadOnly || channel.isArchived) {
    return NextResponse.json({ error: 'Channel is read-only' }, { status: 403 })
  }

  await assertCompanyAccess(ctx, channel.companyId)

  const message = await prisma.message.create({
    data: {
      channelId,
      senderId: ctx.userId,
      content: parsed.data.content,
      type: 'TEXT',
      parentId: parsed.data.parentId,
    },
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
      reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } },
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

  return NextResponse.json(message, { status: 201 })
}
