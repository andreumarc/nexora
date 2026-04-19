import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { formatDate, formatMessageTime } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { ShieldCheck } from 'lucide-react'
import type { RoleType } from '@prisma/client'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'auth.login': { label: 'Inicio de sesión', color: 'text-green-600 bg-green-50' },
  'auth.logout': { label: 'Cierre de sesión', color: 'text-gray-500 bg-gray-100' },
  'user.created': { label: 'Usuario creado', color: 'text-blue-600 bg-blue-50' },
  'user.deactivated': { label: 'Usuario desactivado', color: 'text-red-600 bg-red-50' },
  'user.blocked': { label: 'Usuario bloqueado', color: 'text-red-700 bg-red-100' },
  'user.role_changed': { label: 'Rol modificado', color: 'text-amber-600 bg-amber-50' },
  'user.impersonated': { label: 'Impersonación', color: 'text-purple-600 bg-purple-50' },
  'invitation.sent': { label: 'Invitación enviada', color: 'text-brand-600 bg-brand-50' },
  'channel.created': { label: 'Canal creado', color: 'text-accent-600 bg-accent-50' },
  'channel.deleted': { label: 'Canal eliminado', color: 'text-red-600 bg-red-50' },
  'message.deleted': { label: 'Mensaje eliminado', color: 'text-amber-600 bg-amber-50' },
  'announcement.published': { label: 'Anuncio publicado', color: 'text-green-600 bg-green-50' },
  'file.uploaded': { label: 'Archivo subido', color: 'text-blue-600 bg-blue-50' },
  'settings.updated': { label: 'Configuración actualizada', color: 'text-brand-600 bg-brand-50' },
}

export default async function AuditoriaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  const isSuperadmin = (session.user as any).isSuperadmin

  if (!membership && !isSuperadmin) redirect('/login')

  const canRead = isSuperadmin || hasPermission(membership!.role as RoleType, 'audit:read')
  if (!canRead) redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    where: { companyId: membership?.companyId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Registro de actividad y acciones sensibles — últimas {logs.length} entradas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Sin registros de auditoría"
            description="Las acciones realizadas en la plataforma aparecerán aquí."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Acción</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">
                    Usuario
                  </th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden md:table-cell">
                    Recurso
                  </th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Fecha</th>
                  <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const actionConfig = ACTION_LABELS[log.action] ?? {
                    label: log.action,
                    color: 'text-gray-600 bg-gray-100',
                  }
                  const displayName =
                    log.user?.firstName && log.user?.lastName
                      ? `${log.user.firstName} ${log.user.lastName}`
                      : log.user?.name ?? log.user?.email ?? 'Sistema'

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionConfig.color}`}
                        >
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={log.user.name}
                              firstName={log.user.firstName}
                              lastName={log.user.lastName}
                              avatarUrl={log.user.avatarUrl}
                              size="xs"
                            />
                            <span className="text-sm text-gray-700 truncate max-w-[140px]">
                              {displayName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sistema</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500">
                          {log.resource ?? '—'}
                          {log.resourceId ? (
                            <span className="text-gray-300 ml-1 font-mono text-[10px]">
                              {log.resourceId.slice(0, 8)}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs text-gray-700">{formatDate(log.createdAt)}</p>
                          <p className="text-[10px] text-gray-400">
                            {formatMessageTime(log.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs font-mono text-gray-400">
                          {log.ipAddress ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
