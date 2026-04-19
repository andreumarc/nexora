import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  jobTitle: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  onboardingCompleted: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { firstName, lastName, ...rest } = parsed.data

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...rest,
      ...(firstName ? { firstName, name: `${firstName} ${lastName ?? ''}`.trim() } : {}),
      ...(lastName ? { lastName } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      phone: true,
      onboardingCompleted: true,
    },
  })

  return NextResponse.json(updated)
}
