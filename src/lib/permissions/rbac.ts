import type { RoleType } from '@prisma/client'

// ============================================================
// NEXORA RBAC — Permission Matrix
// ============================================================

export type Permission =
  // Channel permissions
  | 'channel:create'
  | 'channel:update'
  | 'channel:delete'
  | 'channel:archive'
  | 'channel:manage_members'
  // Message permissions
  | 'message:send'
  | 'message:edit_own'
  | 'message:delete_own'
  | 'message:delete_any'
  | 'message:pin'
  | 'message:react'
  // Announcement permissions
  | 'announcement:create'
  | 'announcement:update'
  | 'announcement:delete'
  | 'announcement:publish'
  | 'announcement:read'
  // File permissions
  | 'file:upload'
  | 'file:download'
  | 'file:delete_own'
  | 'file:delete_any'
  // User management
  | 'user:invite'
  | 'user:update'
  | 'user:deactivate'
  | 'user:block'
  | 'user:change_role'
  // Org structure
  | 'clinic:create'
  | 'clinic:update'
  | 'clinic:delete'
  | 'department:create'
  | 'department:update'
  | 'department:delete'
  // Admin
  | 'audit:read'
  | 'metrics:read'
  | 'settings:read'
  | 'settings:update'
  // Superadmin only
  | 'company:create'
  | 'company:update'
  | 'company:delete'
  | 'user:impersonate'

const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  SUPERADMIN: [
    'channel:create', 'channel:update', 'channel:delete', 'channel:archive', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:delete_any', 'message:pin', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:delete', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own', 'file:delete_any',
    'user:invite', 'user:update', 'user:deactivate', 'user:block', 'user:change_role',
    'clinic:create', 'clinic:update', 'clinic:delete',
    'department:create', 'department:update', 'department:delete',
    'audit:read', 'metrics:read', 'settings:read', 'settings:update',
    'company:create', 'company:update', 'company:delete', 'user:impersonate',
  ],

  ADMIN: [
    'channel:create', 'channel:update', 'channel:delete', 'channel:archive', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:delete_any', 'message:pin', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:delete', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own', 'file:delete_any',
    'user:invite', 'user:update', 'user:deactivate', 'user:block', 'user:change_role',
    'clinic:create', 'clinic:update', 'clinic:delete',
    'department:create', 'department:update', 'department:delete',
    'audit:read', 'metrics:read', 'settings:read', 'settings:update',
  ],

  DIRECCION_GENERAL: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:delete_any', 'message:pin', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'user:invite', 'metrics:read',
  ],

  DIRECCION_CLINICA: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:pin', 'message:react',
    'announcement:create', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'metrics:read',
  ],

  RRHH: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'user:invite',
  ],

  ODONTOLOGO: [
    'message:send', 'message:edit_own', 'message:delete_own', 'message:pin', 'message:react',
    'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
  ],

  AUXILIAR: [
    'message:send', 'message:edit_own', 'message:delete_own', 'message:react',
    'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
  ],
}

export function hasPermission(role: RoleType, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: RoleType, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: RoleType, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export function getPermissions(role: RoleType): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

// Role hierarchy for comparison
const ROLE_LEVEL: Record<RoleType, number> = {
  SUPERADMIN:        100,
  ADMIN:              90,
  DIRECCION_GENERAL:  80,
  DIRECCION_CLINICA:  70,
  RRHH:               60,
  ODONTOLOGO:         30,
  AUXILIAR:           20,
}

export function isRoleAtLeast(role: RoleType, minRole: RoleType): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole]
}

export function canManageUser(managerRole: RoleType, targetRole: RoleType): boolean {
  return ROLE_LEVEL[managerRole] > ROLE_LEVEL[targetRole]
}

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPERADMIN:        'Superadmin',
  ADMIN:             'Administrador',
  DIRECCION_GENERAL: 'Dirección General',
  DIRECCION_CLINICA: 'Dirección Clínica',
  RRHH:              'RRHH',
  ODONTOLOGO:        'Odontólogo',
  AUXILIAR:          'Auxiliar',
}

export const ROLE_COLORS: Record<RoleType, { bg: string; text: string; border: string }> = {
  SUPERADMIN:        { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  ADMIN:             { bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200' },
  DIRECCION_GENERAL: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  DIRECCION_CLINICA: { bg: 'bg-accent-50',  text: 'text-accent-700',  border: 'border-accent-200' },
  RRHH:              { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  ODONTOLOGO:        { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  AUXILIAR:          { bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200' },
}
