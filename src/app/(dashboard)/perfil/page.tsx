import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { ProfileTabs } from './_components/ProfileTabs'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          company: { select: { id: true, name: true } },
          clinic: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!user) redirect('/login')

  return (
    <ProfileTabs
      user={{
        id: user.id,
        name: user.name ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        email: user.email,
        phone: user.phone ?? null,
        jobTitle: user.jobTitle ?? null,
        isSuperadmin: user.isSuperadmin,
        memberships: user.memberships.map(m => ({
          id: m.id,
          role: m.role,
          isActive: m.isActive,
          company: m.company,
          clinic: m.clinic ?? null,
        })),
      }}
    />
  )
}
