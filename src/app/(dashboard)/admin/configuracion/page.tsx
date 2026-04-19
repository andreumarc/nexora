import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { SectionCard } from '@/components/common/SectionCard'
import { Settings, Building2, Users, HardDrive } from 'lucide-react'
import type { RoleType } from '@prisma/client'

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  const isSuperadmin = (session.user as any).isSuperadmin
  if (!membership && !isSuperadmin) redirect('/login')

  const canRead = isSuperadmin || hasPermission(membership!.role as RoleType, 'settings:read')
  if (!canRead) redirect('/dashboard')

  const [company, settings, memberCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: membership!.companyId } }),
    prisma.tenantSettings.findUnique({ where: { companyId: membership!.companyId } }),
    prisma.membership.count({ where: { companyId: membership!.companyId, isActive: true } }),
  ])

  const canUpdate = isSuperadmin || hasPermission(membership!.role as RoleType, 'settings:update')

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Company info */}
      <SectionCard
        title="Información de la empresa"
        action={
          canUpdate ? (
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              Editar
            </button>
          ) : null
        }
      >
        <div className="space-y-3">
          <Row label="Nombre" value={company?.name ?? '—'} icon={Building2} />
          <Row label="Slug" value={company?.slug ?? '—'} icon={Settings} />
          <Row label="Dominio" value={company?.domain ?? 'No configurado'} icon={Settings} />
          <Row label="Usuarios activos" value={`${memberCount} / ${settings?.maxUsers ?? 200}`} icon={Users} />
        </div>
      </SectionCard>

      {/* Storage */}
      <SectionCard title="Almacenamiento">
        <div className="space-y-3">
          <Row
            label="Límite de almacenamiento"
            value={
              settings?.maxStorage
                ? `${(Number(settings.maxStorage) / (1024 * 1024 * 1024)).toFixed(0)} GB`
                : '10 GB'
            }
            icon={HardDrive}
          />
        </div>
      </SectionCard>

      {/* Features */}
      <SectionCard title="Funcionalidades">
        <div className="space-y-3">
          <FeatureRow label="Usuarios invitados" enabled={settings?.allowGuests ?? false} />
          <FeatureRow label="Notificaciones por email" enabled={settings?.emailNotifications ?? true} />
          <FeatureRow label="Llamadas de voz" enabled={settings?.allowVoiceCalls ?? false} badge="V2" />
          <FeatureRow label="Videollamadas" enabled={settings?.allowVideoCalls ?? false} badge="V2" />
        </div>
      </SectionCard>
    </div>
  )
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 min-w-[160px]">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

function FeatureRow({ label, enabled, badge }: { label: string; enabled: boolean; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{label}</span>
        {badge && (
          <span className="text-[10px] font-semibold text-accent-700 bg-accent-50 border border-accent-100 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          enabled ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'
        }`}
      >
        {enabled ? 'Activado' : 'Desactivado'}
      </span>
    </div>
  )
}
