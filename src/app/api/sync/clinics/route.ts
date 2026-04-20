// GET /api/sync/clinics — returns all active clinics for Hub import
// POST /api/sync/clinics — upsert clinics pushed from Hub
// Auth: Bearer HUB_JWT_SECRET
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.HUB_JWT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(clinics.map((c) => ({ id: c.id, name: c.name, active: true })))
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.HUB_JWT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({})) as {
    company_slug?: string; clinics?: { id: string; name: string; active?: boolean }[]
  }
  if (!body.company_slug || !Array.isArray(body.clinics)) {
    return NextResponse.json({ error: 'company_slug and clinics[] required' }, { status: 400 })
  }
  const company = await prisma.company.findUnique({ where: { slug: body.company_slug } })
  if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 })

  for (const c of body.clinics) {
    await prisma.clinic.upsert({
      where: { id: c.id },
      update: { name: c.name, isActive: c.active !== false },
      create: { id: c.id, name: c.name, companyId: company.id, isActive: c.active !== false },
    })
  }
  return NextResponse.json({ ok: true, count: body.clinics.length })
}
