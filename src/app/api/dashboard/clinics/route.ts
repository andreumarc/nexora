import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ clinics: [] }, { status: 401 })

  const memberships = await prisma.membership.findMany({
    where:   { userId: session.user.id, isActive: true },
    include: { clinic: { select: { id: true, name: true, isActive: true } } },
  })

  const clinics = memberships
    .filter(m => m.clinic?.isActive)
    .map(m => ({ id: m.clinic!.id, name: m.clinic!.name }))
    .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) // dedupe

  return NextResponse.json({ clinics })
}
