import type { RoleType } from '@prisma/client'

// ============================================================
// NEXORA — Centralized Permission Matrix (canonical)
// ============================================================
// Single source of truth for UI/route role checks.
// For fine-grained RBAC (channel/message/file ops), see
// ./permissions/rbac.ts. Keep both files aligned.

export type PermissionKey =
  | 'dashboard:view'
  | 'messages:read'
  | 'messages:send'
  | 'channels:create'
  | 'dm:send'
  | 'files:share'
  | 'analytics:view'
  | 'users:manage'

const MATRIX: Record<PermissionKey, RoleType[]> = {
  'dashboard:view':   ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH', 'ODONTOLOGO', 'AUXILIAR'],
  'messages:read':    ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH', 'ODONTOLOGO', 'AUXILIAR'],
  'messages:send':    ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH', 'ODONTOLOGO', 'AUXILIAR'],
  'channels:create':  ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH'],
  'dm:send':          ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH', 'ODONTOLOGO', 'AUXILIAR'],
  'files:share':      ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH', 'ODONTOLOGO', 'AUXILIAR'],
  'analytics:view':   ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH'],
  'users:manage':     ['SUPERADMIN', 'ADMIN', 'DIRECCION_GENERAL', 'DIRECCION_CLINICA', 'RRHH'],
}

export function hasPermission(role: RoleType | null | undefined, perm: PermissionKey): boolean {
  if (!role) return false
  return MATRIX[perm]?.includes(role) ?? false
}

export function rolesWithPermission(perm: PermissionKey): RoleType[] {
  return MATRIX[perm] ?? []
}
