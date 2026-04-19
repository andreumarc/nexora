import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { hasPermission } from '@/lib/permissions/rbac'
import { KpiCard } from '@/components/common/KpiCard'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { BarChart3 } from 'lucide-react'
import type { RoleType } from '@prisma/client'

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true, role: true },
  })

  const isSuperadmin = (session.user as any).isSuperadmin
  if (!membership && !isSuperadmin) redirect('/login')

  const canView = isSuperadmin || hasPermission(membership!.role as RoleType, 'metrics:read')
  if (!canView) redirect('/dashboard')

  const companyId = membership!.companyId
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalUsers,
    activeToday,
    activeLast7d,
    totalMessages,
    messagesLast7d,
    totalChannels,
    totalAnnouncements,
    publishedAnnouncements,
    topChannels,
    clinicActivity,
  ] = await Promise.all([
    prisma.membership.count({ where: { companyId, isActive: true } }),
    prisma.user.count({
      where: {
        memberships: { some: { companyId, isActive: true } },
        lastActiveAt: { gte: today },
      },
    }),
    prisma.user.count({
      where: {
        memberships: { some: { companyId, isActive: true } },
        lastActiveAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.message.count({ where: { channel: { companyId } } }),
    prisma.message.count({
      where: {
        channel: { companyId },
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.channel.count({ where: { companyId, deletedAt: null } }),
    prisma.announcement.count({ where: { companyId, deletedAt: null } }),
    prisma.announcement.count({ where: { companyId, isPublished: true, deletedAt: null } }),
    prisma.channel.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { messages: { _count: 'desc' } },
      take: 5,
      select: {
        name: true,
        type: true,
        _count: { select: { messages: true, members: true } },
      },
    }),
    prisma.clinic.findMany({
      where: { companyId, isActive: true },
      select: {
        name: true,
        _count: { select: { channels: true } },
      },
    }),
  ])

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Actividad y uso de la plataforma
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total usuarios" value={totalUsers} color="blue" />
        <KpiCard label="Activos hoy" value={activeToday} color="green" badge="Hoy" />
        <KpiCard label="Activos 7 días" value={activeLast7d} color="accent" badge="7d" />
        <KpiCard label="Total mensajes" value={totalMessages} color="neutral" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Mensajes (7 días)" value={messagesLast7d} color="blue" />
        <KpiCard label="Canales activos" value={totalChannels} color="accent" />
        <KpiCard label="Anuncios publicados" value={publishedAnnouncements} color="green" />
        <KpiCard
          label="Total anuncios"
          value={totalAnnouncements}
          badge={`${publishedAnnouncements} pub.`}
          color="neutral"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Canales más activos" subtitle="Por volumen de mensajes">
          {topChannels.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sin datos" size="sm" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-400 font-semibold pb-2">Canal</th>
                  <th className="text-right text-xs text-gray-400 font-semibold pb-2">Mensajes</th>
                  <th className="text-right text-xs text-gray-400 font-semibold pb-2">Miembros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topChannels.map((ch) => (
                  <tr key={ch.name} className="hover:bg-gray-50/60">
                    <td className="py-2.5 pr-4 text-sm text-gray-800 truncate max-w-[140px]">
                      #{ch.name}
                    </td>
                    <td className="py-2.5 text-sm text-right font-semibold text-gray-900">
                      {ch._count.messages.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 text-sm text-right text-gray-500">
                      {ch._count.members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        <SectionCard title="Actividad por clínica" subtitle="Canales por sede">
          {clinicActivity.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sin clínicas" size="sm" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-400 font-semibold pb-2">Clínica</th>
                  <th className="text-right text-xs text-gray-400 font-semibold pb-2">Canales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clinicActivity.map((clinic) => (
                  <tr key={clinic.name} className="hover:bg-gray-50/60">
                    <td className="py-2.5 pr-4 text-sm text-gray-800">{clinic.name}</td>
                    <td className="py-2.5 text-sm text-right font-semibold text-gray-900">
                      {clinic._count.channels}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
