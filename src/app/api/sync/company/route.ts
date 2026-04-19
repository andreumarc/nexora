import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.JWT_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { slug, name, active, taxId, email, phone, address } = body as {
    slug?: string
    name?: string
    active?: boolean
    taxId?: string
    email?: string
    phone?: string
    address?: string
  }

  if (!slug || !name) {
    return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
  }

  await prisma.company.upsert({
    where: { slug },
    update: {
      name,
      isActive: active ?? true,
    },
    create: {
      slug,
      name,
      isActive: active ?? true,
      logoUrl: null,
      domain: null,
    },
  })

  return NextResponse.json({ ok: true })
}
