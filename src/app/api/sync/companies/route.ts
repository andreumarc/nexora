// GET /api/sync/companies — Hub pull: list all active companies
// Auth: Bearer JWT_SECRET (or HUB_JWT_SECRET — both accepted)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const a = process.env.JWT_SECRET     ? `Bearer ${process.env.JWT_SECRET}`     : null
  const b = process.env.HUB_JWT_SECRET ? `Bearer ${process.env.HUB_JWT_SECRET}` : null
  return Boolean((a && auth === a) || (b && auth === b))
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { name: true, slug: true, isActive: true, domain: true },
    orderBy: { name: 'asc' },
  })

  const out = companies.map((c) => ({
    name:   c.name,
    slug:   c.slug,
    cif:    null,
    city:   null,
    email:  c.domain ? `info@${c.domain}` : null,
    phone:  null,
    active: c.isActive,
  }))

  return NextResponse.json(out)
}
