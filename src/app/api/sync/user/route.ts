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

  const body = await req.json()
  const { email, name, role } = body as { email?: string; name?: string; role?: string }

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const mappedRole = mapRole(role)

  await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: {
      email,
      name: name ?? null,
      isActive: true,
      hashedPassword: null,
      role: mappedRole,
    },
  })

  return NextResponse.json({ ok: true })
}
