import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasAnyPermission } from '@/lib/permissions/rbac'
import type { RoleType } from '@prisma/client'

const ADMIN_PERMISSIONS = [
  'user:invite',
  'audit:read',
  'metrics:read',
  'settings:read',
  'clinic:create',
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const isSuperadmin = (session.user as any).isSuperadmin
  if (isSuperadmin) return <>{children}</>

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { role: true },
  })

  if (!membership) redirect('/login')

  const hasAccess = hasAnyPermission(membership.role as RoleType, ADMIN_PERMISSIONS as any)
  if (!hasAccess) redirect('/dashboard')

  return <>{children}</>
}
