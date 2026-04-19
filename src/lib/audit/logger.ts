import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'user.blocked'
  | 'user.role_changed'
  | 'user.impersonated'
  | 'invitation.sent'
  | 'invitation.accepted'
  | 'invitation.cancelled'
  | 'channel.created'
  | 'channel.updated'
  | 'channel.deleted'
  | 'channel.archived'
  | 'message.deleted'
  | 'message.pinned'
  | 'announcement.created'
  | 'announcement.published'
  | 'announcement.deleted'
  | 'file.uploaded'
  | 'file.downloaded'
  | 'file.deleted'
  | 'clinic.created'
  | 'clinic.updated'
  | 'clinic.deleted'
  | 'settings.updated'

interface AuditLogParams {
  companyId?: string
  userId?: string
  impersonatorId?: string
  action: AuditAction
  resource?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        impersonatorId: params.impersonatorId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch {
    // Audit failures must not break the main flow
  }
}
