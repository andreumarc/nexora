import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function mapRole(role?: string): 'SUPERADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE' {
  if (role === 'superadmin') return 'SUPERADMIN'
  if (role === 'admin') return 'COMPANY_ADMIN'
  return 'EMPLOYEE'
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.JWT_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, name, role, company_slug } = body as {
    email?: string; name?: string; role?: string; company_slug?: string
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
          await prisma.membership.create({ data: { userId: user.id, companyId: company.id, role: 'EMPLOYEE', isActive: true } })
        }
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true })
}
