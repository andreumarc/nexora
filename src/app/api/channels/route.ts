import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getTenantContext } from '@/lib/tenant/isolation'
import { hasPermission } from '@/lib/permissions/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'
import type { RoleType } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(2).max(80).regex(/^[a-z0-9-áéíóúñü\s]+$/i, 'Solo letras, números y guiones'),
  description: z.string().max(500).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT', 'OPERATIONAL']).default('PUBLIC'),
  clinicId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  isReadOnly: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channels = await prisma.channel.findMany({
    where: {
      companyId: ctx.companyId,
      deletedAt: null,
      OR: [
        { type: { not: 'PRIVATE' } },
        { members: { some: { userId: ctx.userId } } },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { name: 'asc' }],
    include: {
      clinic: { select: { name: true, code: true } },
      _count: { select: { members: true, messages: true } },
    },
  })

  return NextResponse.json({ channels })
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role as RoleType, 'channel:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const slug = parsed.data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  const existing = await prisma.channel.findFirst({
    where: { companyId: ctx.companyId, slug },
  })

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un canal con ese nombre' }, { status: 409 })
  }

  const channel = await prisma.channel.create({
    data: {
      companyId: ctx.companyId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      type: parsed.data.type,
      clinicId: parsed.data.clinicId,
      departmentId: parsed.data.departmentId,
      isReadOnly: parsed.data.isReadOnly,
      createdById: ctx.userId,
    },
  })

  // Add creator as admin member
  await prisma.channelMember.create({
    data: { channelId: channel.id, userId: ctx.userId, role: 'admin' },
  })

  await createAuditLog({
    companyId: ctx.companyId,
    userId: ctx.userId,
    action: 'channel.created',
    resource: 'Channel',
    resourceId: channel.id,
    metadata: { name: channel.name, type: channel.type },
  })

  return NextResponse.json(channel, { status: 201 })
}
