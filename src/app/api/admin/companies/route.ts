import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!(session?.user as any)?.isSuperadmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clinics: true, memberships: true } },
    },
  })

  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!(session?.user as any)?.isSuperadmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, domain } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
  }

  const existing = await prisma.company.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una empresa con ese slug' }, { status: 409 })
  }

  const company = await prisma.company.create({
    data: { name, slug, domain: domain ?? null },
  })

  return NextResponse.json(company, { status: 201 })
}
