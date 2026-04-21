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
    if (!membership || !hasPermission(membership.role as RoleType, 'clinic:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const clinic = await prisma.clinic.findUnique({ where: { id } })
  if (!clinic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.clinic.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
