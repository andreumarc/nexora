import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db/prisma'

// Audit 2026-05 [C-4 / C-6]: roles allowed via /sync/user. `superadmin` is
// rejected — escalation must come from the admin UI, not server-to-server sync.
type AppRole = 'ADMIN' | 'DIRECCION_GENERAL' | 'DIRECCION_CLINICA' | 'RRHH' | 'ODONTOLOGO' | 'AUXILIAR'

function mapRole(role?: string): AppRole {
  if (role === 'admin')             return 'ADMIN'
  if (role === 'direccion_general') return 'DIRECCION_GENERAL'
  if (role === 'direccion_clinica') return 'DIRECCION_CLINICA'
  if (role === 'rrhh')              return 'RRHH'
  if (role === 'odontologo')        return 'ODONTOLOGO'
  return 'AUXILIAR'
}

function bearerOk(authHeader: string | null, secret: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  if (token.length !== secret.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.HUB_JWT_SECRET ?? ''
  if (!secret) return NextResponse.json({ error: 'HUB_JWT_SECRET not configured' }, { status: 500 })
  if (!bearerOk(authHeader, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, name, role, company_slug, clinic_ids, password, password_hash, active } = body as {
    email?: string; name?: string; role?: string; company_slug?: string
    clinic_ids?: string[] | 'ALL'; password?: string; password_hash?: string; active?: boolean
  }
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  // Hard-reject any attempt to assign superadmin via sync.
  if (typeof role === 'string' && role.toLowerCase() === 'superadmin') {
    return NextResponse.json({ error: 'role superadmin not assignable via sync' }, { status: 403 })
  }

  const mappedRole = mapRole(role)
  // isSuperadmin must NEVER be flipped on by sync.
  // Resolver hash: plaintext > forwarded bcrypt hash desde el Hub.
  // Hub y nexora usan bcryptjs → los hashes son intercambiables. Sin esto,
  // los usuarios sincronizados sin password plaintext quedaban fuera.
  async function resolveHash(): Promise<string | null> {
    if (password) return bcrypt.hash(password, 12)
    if (password_hash && /^\$2[aby]\$/.test(password_hash)) return password_hash
    return null
  }
  const hashedPassword = await resolveHash()

  // Split Hub-provided name into firstName/lastName so the dashboard does not
  // bounce hub-synced users into /onboarding (gate at (dashboard)/layout.tsx).
  const trimmedName = (name ?? '').trim()
  const [firstNamePart, ...restName] = trimmedName.split(/\s+/)
  const firstName = firstNamePart || null
  const lastName = restName.join(' ') || null

  const user = await prisma.user.upsert({
    where:  { email },
    // Audit 2026-05 [C-4]: do NOT touch `isSuperadmin` from a sync payload.
    update: {
      name: trimmedName || undefined,
      ...(firstName ? { firstName } : {}),
      ...(lastName  ? { lastName }  : {}),
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
      isSuperadmin: false,
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
