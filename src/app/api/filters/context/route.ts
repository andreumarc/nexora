// GET /api/filters/context — returns {companies, clinics} scoped by caller role
// - isSuperadmin → all active companies + clinics
// - others       → only companies/clinics they are members of
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ companies: [], clinics: [] }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperadmin: true },
  })

  if (user?.isSuperadmin) {
    const [companies, clinics] = await Promise.all([
      prisma.company.findMany({
        where:   { deletedAt: null, isActive: true },
        select:  { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.clinic.findMany({
        where:   { deletedAt: null, isActive: true },
        select:  { id: true, name: true, companyId: true },
        orderBy: { name: 'asc' },
      }),
    ])
    return NextResponse.json({ companies, clinics })
  }

  // Non-superadmin: scope via memberships
  const memberships = await prisma.membership.findMany({
    where:   { userId: session.user.id, isActive: true },
    select: {
      company: { select: { id: true, name: true, isActive: true, deletedAt: true } },
      clinic:  { select: { id: true, name: true, companyId: true, isActive: true, deletedAt: true } },
    },
  })

  const companyMap = new Map<string, { id: string; name: string }>()
  const clinicMap  = new Map<string, { id: string; name: string; companyId: string }>()
  for (const m of memberships) {
    if (m.company && m.company.isActive && !m.company.deletedAt) {
      companyMap.set(m.company.id, { id: m.company.id, name: m.company.name })
    }
    if (m.clinic && m.clinic.isActive && !m.clinic.deletedAt) {
      clinicMap.set(m.clinic.id, { id: m.clinic.id, name: m.clinic.name, companyId: m.clinic.companyId })
    }
  }

  return NextResponse.json({
    companies: [...companyMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    clinics:   [...clinicMap.values()].sort((a, b)  => a.name.localeCompare(b.name)),
  })
}
