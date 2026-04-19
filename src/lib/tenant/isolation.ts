import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'
import type { RoleType } from '@prisma/client'

export interface TenantContext {
  userId: string
  companyId: string
  role: RoleType
  clinicId: string | null
  departmentId: string | null
  isSuperadmin: boolean
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = session.user as any

  if (user.isSuperadmin) {
    return {
      userId: session.user.id,
      companyId: '',
      role: 'SUPERADMIN' as RoleType,
      clinicId: null,
      departmentId: null,
      isSuperadmin: true,
    }
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      company: { isActive: true, deletedAt: null },
    },
    select: {
      companyId: true,
      role: true,
      clinicId: true,
      departmentId: true,
    },
  })

  if (!membership) return null

  return {
    userId: session.user.id,
    companyId: membership.companyId,
    role: membership.role,
    clinicId: membership.clinicId,
    departmentId: membership.departmentId,
    isSuperadmin: false,
  }
}

// Validates that a resource belongs to the tenant
export async function assertCompanyAccess(
  ctx: TenantContext,
  resourceCompanyId: string
): Promise<void> {
  if (ctx.isSuperadmin) return
  if (ctx.companyId !== resourceCompanyId) {
    throw new Error('FORBIDDEN: cross-tenant access attempt')
  }
}

// Checks that a user belongs to the requesting company
export async function assertUserInCompany(
  companyId: string,
  userId: string
): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: { userId, companyId, isActive: true },
  })
  return membership !== null
}
