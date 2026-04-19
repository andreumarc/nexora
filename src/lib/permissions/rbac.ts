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

  COMPANY_ADMIN: [
    'channel:create', 'channel:update', 'channel:delete', 'channel:archive', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:delete_any', 'message:pin', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:delete', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own', 'file:delete_any',
    'user:invite', 'user:update', 'user:deactivate', 'user:block', 'user:change_role',
    'clinic:create', 'clinic:update', 'clinic:delete',
    'department:create', 'department:update', 'department:delete',
    'audit:read', 'metrics:read', 'settings:read', 'settings:update',
  ],

  DIRECTOR_GENERAL: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:delete_any', 'message:pin', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'user:invite',
    'metrics:read',
  ],

  DIRECTOR_OPERATIONS: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:pin', 'message:react',
    'announcement:create', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'metrics:read',
  ],

  CLINIC_DIRECTOR: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:pin', 'message:react',
    'announcement:create', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
  ],

  HR_MANAGER: [
    'channel:create', 'channel:update', 'channel:manage_members',
    'message:send', 'message:edit_own', 'message:delete_own', 'message:react',
    'announcement:create', 'announcement:update', 'announcement:publish', 'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
    'user:invite',
  ],

  RECEPTIONIST: [
    'message:send', 'message:edit_own', 'message:delete_own', 'message:react',
    'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
  ],

  EMPLOYEE: [
    'message:send', 'message:edit_own', 'message:delete_own', 'message:react',
    'announcement:read',
    'file:upload', 'file:download', 'file:delete_own',
  ],

  GUEST: [
    'message:send', 'message:react',
    'announcement:read',
    'file:download',
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
  SUPERADMIN: 100,
  COMPANY_ADMIN: 90,
  DIRECTOR_GENERAL: 80,
  DIRECTOR_OPERATIONS: 75,
  CLINIC_DIRECTOR: 70,
  HR_MANAGER: 60,
  RECEPTIONIST: 30,
  EMPLOYEE: 20,
  GUEST: 10,
}

export function isRoleAtLeast(role: RoleType, minRole: RoleType): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole]
}

export function canManageUser(managerRole: RoleType, targetRole: RoleType): boolean {
  return ROLE_LEVEL[managerRole] > ROLE_LEVEL[targetRole]
}

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPERADMIN: 'Superadministrador',
  COMPANY_ADMIN: 'Admin empresa',
  DIRECTOR_GENERAL: 'Dirección general',
  DIRECTOR_OPERATIONS: 'Dirección operaciones',
  CLINIC_DIRECTOR: 'Dirección clínica',
  HR_MANAGER: 'RRHH / Personas',
  RECEPTIONIST: 'Recepción / Admin',
  EMPLOYEE: 'Empleado',
  GUEST: 'Invitado',
}

export const ROLE_COLORS: Record<RoleType, { bg: string; text: string; border: string }> = {
  SUPERADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  COMPANY_ADMIN: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200' },
  DIRECTOR_GENERAL: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DIRECTOR_OPERATIONS: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  CLINIC_DIRECTOR: { bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  HR_MANAGER: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  RECEPTIONIST: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  EMPLOYEE: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  GUEST: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
}
