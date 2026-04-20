import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      jobTitle: true,
      isActive: true,
      isBlocked: true,
      onboardingCompleted: true,
      isSuperadmin: true,
      memberships: {
        where: { isActive: true },
        select: {
          role: true,
          company: { select: { id: true, name: true } },
        },
        take: 1,
      },
      notifications: {
        where: { isRead: false },
        select: { id: true },
      },
    },
  })

  if (!user || !user.isActive || user.isBlocked) redirect('/login')

  if (!user.onboardingCompleted && !user.isSuperadmin) redirect('/onboarding')

  const companyName = user.memberships[0]?.company?.name ?? 'Nexora'
  const unreadNotifications = user.notifications.length

  const role = user.memberships[0]?.role ?? null

  return (
    <AppShell
      user={{
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
      }}
      companyName={companyName}
      unreadNotifications={unreadNotifications}
      isSuperadmin={user.isSuperadmin}
      role={role}
    >
      <DashboardFilters isSuperadmin={user.isSuperadmin} />
      {children}
    </AppShell>
  )
}
