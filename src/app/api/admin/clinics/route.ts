import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'

export async function GET() {
  const session = await auth()
  const isSuperadmin = (session?.user as any)?.isSuperadmin

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isSuperadmin) {
    const clinics = await prisma.clinic.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } },
        _count: { select: { memberships: true } },
      },
    })
    return NextResponse.json(clinics)
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  if (!membership || !hasPermission(membership.role as RoleType, 'clinic:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clinics = await prisma.clinic.findMany({
    where: { companyId: membership.companyId, deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { memberships: true } } },
  })

  return NextResponse.json(clinics)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isSuperadmin = (session.user as any).isSuperadmin
  const body = await req.json()
  const { companyId, name, code, address, city, phone, email } = body

  if (!name || !companyId) {
    return NextResponse.json({ error: 'Nombre y empresa son requeridos' }, { status: 400 })
  }

  if (!isSuperadmin) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, companyId, isActive: true },
      select: { role: true },
    })
    if (!membership || !hasPermission(membership.role as RoleType, 'clinic:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const clinic = await prisma.clinic.create({
    data: { companyId, name, code: code || null, address: address || null, city: city || null, phone: phone || null, email: email || null },
  })

  return NextResponse.json(clinic, { status: 201 })
}
