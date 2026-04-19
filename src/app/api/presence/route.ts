import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const presenceSchema = z.object({
  status: z.enum(['ONLINE', 'AWAY', 'BUSY', 'OFFLINE']),
  statusText: z.string().max(100).optional().nullable(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = presenceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const presence = await prisma.userPresence.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      status: parsed.data.status,
      statusText: parsed.data.statusText ?? null,
      lastSeenAt: new Date(),
    },
    update: {
      status: parsed.data.status,
      statusText: parsed.data.statusText ?? null,
      lastSeenAt: new Date(),
    },
  })

  // Also update lastActiveAt
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActiveAt: new Date() },
  })

  return NextResponse.json(presence)
}
