// GET /api/sync/users — Hub pull: list users for company (or all)
// Auth: Bearer JWT_SECRET (or HUB_JWT_SECRET — both accepted)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROLE_MAP: Record<string, string> = {
  SUPERADMIN:    'superadmin',
  COMPANY_ADMIN: 'admin',
  MANAGER:       'dirección',
  HR:            'rrhh',
  EMPLOYEE:      'empleado',
}

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const a = process.env.JWT_SECRET     ? `Bearer ${process.env.JWT_SECRET}`     : null
  const b = process.env.HUB_JWT_SECRET ? `Bearer ${process.env.HUB_JWT_SECRET}` : null
  return Boolean((a && auth === a) || (b && auth === b))
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companySlug = req.nextUrl.searchParams.get('company_id')
  const where = companySlug
    ? { isActive: true, company: { slug: companySlug.toLowerCase() } }
    : { isActive: true }

  const memberships = await prisma.membership.findMany({
    where,
    include: {
      user:    { select: { email: true, name: true, firstName: true, lastName: true, isActive: true } },
      company: { select: { slug: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const seen = new Set<string>()
  const out = memberships
    .filter((m) => m.user?.email && !seen.has(m.user.email) && seen.add(m.user.email))
    .map((m) => ({
      email:        m.user.email.toLowerCase(),
      name:         m.user.name || [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim() || m.user.email,
      role:         ROLE_MAP[m.role] ?? 'empleado',
      company_slug: m.company?.slug ?? null,
      active:       m.user.isActive && m.isActive,
    }))

  return NextResponse.json(out)
}
