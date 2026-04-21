import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type AppRole = 'SUPERADMIN' | 'ADMIN' | 'DIRECCION_GENERAL' | 'DIRECCION_CLINICA' | 'RRHH' | 'ODONTOLOGO' | 'AUXILIAR'

function mapRole(role?: string): AppRole {
  if (role === 'superadmin')        return 'SUPERADMIN'
  if (role === 'admin')             return 'ADMIN'
  if (role === 'direccion_general') return 'DIRECCION_GENERAL'
  if (role === 'direccion_clinica') return 'DIRECCION_CLINICA'
  if (role === 'rrhh')              return 'RRHH'
  if (role === 'odontologo')        return 'ODONTOLOGO'
  return 'AUXILIAR'
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.JWT_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, name, role, company_slug, clinic_ids } = body as {
    email?: string; name?: string; role?: string; company_slug?: string
    clinic_ids?: string[] | 'ALL'
  }
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const user = await prisma.user.upsert({
    where:  { email },
    update: { name: name ?? undefined },
    create: { email, name: name ?? null, isActive: true, hashedPassword: null, role: mapRole(role) },
  })

  if (company_slug) {
    try {
      const company = await prisma.company.findUnique({ where: { slug: company_slug } })
      if (company) {
        const existing = await prisma.membership.findFirst({ where: { userId: user.id, companyId: company.id } })
        if (!existing) {
          await prisma.membership.create({ data: { userId: user.id, companyId: company.id, role: mapRole(role), isActive: true } })
        }
      }
    } catch { /* non-fatal */ }
  }

  // Set clinic access
  if (Array.isArray(clinic_ids)) {
    // Replace clinic memberships for this user
    await prisma.membership.deleteMany({
      where: { userId: user.id, clinicId: { not: null } },
    })
    if (clinic_ids.length > 0 && company_slug) {
      const company = await prisma.company.findUnique({ where: { slug: company_slug } })
      if (company) {
        const validClinics = await prisma.clinic.findMany({
          where: { id: { in: clinic_ids }, companyId: company.id, isActive: true },
          select: { id: true },
        })
        if (validClinics.length > 0) {
          await prisma.membership.createMany({
            data: validClinics.map((c) => ({ userId: user.id, companyId: company.id, clinicId: c.id, role: mapRole(role), isActive: true })),
            skipDuplicates: true,
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
