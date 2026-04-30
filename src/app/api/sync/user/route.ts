import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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
  const secret = process.env.HUB_JWT_SECRET ?? process.env.JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'HUB_JWT_SECRET not configured' }, { status: 500 })
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, name, role, company_slug, clinic_ids, password, active } = body as {
    email?: string; name?: string; role?: string; company_slug?: string
    clinic_ids?: string[] | 'ALL'; password?: string; active?: boolean
  }
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const mappedRole = mapRole(role)
  const isSuperadmin = mappedRole === 'SUPERADMIN'
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null

  // Split Hub-provided name into firstName/lastName so the dashboard does not
  // bounce hub-synced users into /onboarding (gate at (dashboard)/layout.tsx).
  const trimmedName = (name ?? '').trim()
  const [firstNamePart, ...restName] = trimmedName.split(/\s+/)
  const firstName = firstNamePart || null
  const lastName = restName.join(' ') || null

  const user = await prisma.user.upsert({
    where:  { email },
    update: {
      name: trimmedName || undefined,
      ...(firstName ? { firstName } : {}),
      ...(lastName  ? { lastName }  : {}),
      isSuperadmin,
      onboardingCompleted: true,
      ...(active !== undefined ? { isActive: active } : {}),
      ...(hashedPassword ? { hashedPassword } : {}),
    },
    create: {
      email,
      name: trimmedName || null,
      firstName,
      lastName,
      isActive: active !== false,
      isSuperadmin,
      onboardingCompleted: true,
      hashedPassword,
    },
  })

  // Membership: 1 row per (userId, companyId). clinicId=null means company-wide access.
  if (company_slug) {
    const company = await prisma.company.findUnique({ where: { slug: company_slug } })
    if (company) {
      // Decide primary clinicId for this membership:
      //  - 'ALL' or multiple: null (company-wide)
      //  - single specific id: that id (validated against company)
      let primaryClinicId: string | null = null
      if (Array.isArray(clinic_ids) && clinic_ids.length === 1) {
        const c = await prisma.clinic.findFirst({
          where: { id: clinic_ids[0], companyId: company.id, isActive: true },
          select: { id: true },
        })
        primaryClinicId = c?.id ?? null
      }

      await prisma.membership.upsert({
        where:  { userId_companyId: { userId: user.id, companyId: company.id } },
        update: { role: mappedRole, clinicId: primaryClinicId, isActive: true },
        create: { userId: user.id, companyId: company.id, clinicId: primaryClinicId, role: mappedRole, isActive: true },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
