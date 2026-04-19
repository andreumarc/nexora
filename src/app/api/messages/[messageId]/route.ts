import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getTenantContext } from '@/lib/tenant/isolation'
import { hasPermission } from '@/lib/permissions/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'
import type { RoleType } from '@prisma/client'

const editSchema = z.object({
  content: z.string().min(1).max(10000),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = editSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, channelId: true, conversationId: true, isDeleted: true },
  })

  if (!message || message.isDeleted) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const isOwn = message.senderId === ctx.userId
  if (!isOwn || !hasPermission(ctx.role as RoleType, 'message:edit_own')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: parsed.data.content,
      editedAt: new Date(),
      editedById: ctx.userId,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, isDeleted: true },
  })

  if (!message || message.isDeleted) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const isOwn = message.senderId === ctx.userId
  const canDeleteAny = hasPermission(ctx.role as RoleType, 'message:delete_any')
  const canDeleteOwn = isOwn && hasPermission(ctx.role as RoleType, 'message:delete_own')

  if (!canDeleteAny && !canDeleteOwn) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, deletedAt: new Date(), content: '' },
  })

  await createAuditLog({
    companyId: ctx.companyId,
    userId: ctx.userId,
    action: 'message.deleted',
    resource: 'Message',
    resourceId: messageId,
    metadata: { deletedBy: ctx.userId, wasOwn: isOwn },
  })

  return NextResponse.json({ success: true })
}
