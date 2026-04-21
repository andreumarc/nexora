import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const isSuperadmin = (session.user as any).isSuperadmin

  if (!isSuperadmin) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { role: true },
    })
    if (!membership || !hasPermission(membership.role as RoleType, 'user:deactivate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const target = await prisma.membership.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.membership.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
