import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { KpiCard } from '@/components/common/KpiCard'
import { SectionCard } from '@/components/common/SectionCard'
import { Avatar } from '@/components/common/Avatar'
import { PresenceDot } from '@/components/common/PresenceDot'
import { EmptyState } from '@/components/common/EmptyState'
import { formatRelativeTime, formatMessageTime } from '@/lib/utils/format'
import { ROLE_LABELS } from '@/lib/permissions/rbac'
import {
  MessageSquare,
  Hash,
  Megaphone,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import type { RoleType } from '@prisma/client'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: {
      companyId: true,
      role: true,
      company: { select: { name: true } },
    },
  })

  if (!membership) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Users}
          title="Sin empresa asignada"
          description="Tu cuenta no está asociada a ninguna empresa activa. Contacta con el administrador."
        />
      </div>
    )
  }

  const { companyId, role } = membership

  // Parallel queries
  const [channelCount, messageCount, userCount, recentAnnouncements, activeUsers] =
    await Promise.all([
      prisma.channel.count({ where: { companyId, deletedAt: null } }),
      prisma.message.count({
        where: {
          channel: { companyId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.membership.count({ where: { companyId, isActive: true } }),
      prisma.announcement.findMany({
        where: { companyId, isPublished: true, deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          priority: true,
          publishedAt: true,
          requiresRead: true,
          createdBy: {
            select: { firstName: true, lastName: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.userPresence.findMany({
        where: { status: 'ONLINE', user: { memberships: { some: { companyId, isActive: true } } } },
        take: 8,
        select: {
          status: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              avatarUrl: true,
              jobTitle: true,
              memberships: {
                where: { companyId },
                select: { role: true },
                take: 1,
              },
            },
          },
        },
      }),
    ])

  const user = session.user as any

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{user.firstName ? `, ${user.firstName}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {membership.company.name} · {ROLE_LABELS[role as RoleType]}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Canales activos"
          value={channelCount}
          color="blue"
          badge="Total"
        />
        <KpiCard
          label="Mensajes esta semana"
          value={messageCount}
          color="accent"
          badge="7 días"
        />
        <KpiCard
          label="Personas en empresa"
          value={userCount}
          color="green"
        />
        <KpiCard
          label="Online ahora"
          value={activeUsers.length}
          color="neutral"
          badge="Activos"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anuncios recientes */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Anuncios recientes"
            subtitle="Comunicaciones corporativas"
            action={
              <Link href="/anuncios" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Ver todos →
              </Link>
            }
          >
            {recentAnnouncements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Sin anuncios publicados"
                description="Los comunicados corporativos aparecerán aquí."
                size="sm"
              />
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <Link key={a.id} href={`/anuncios/${a.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div
                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                          a.priority === 'URGENT'
                            ? 'bg-red-500'
                            : a.priority === 'HIGH'
                              ? 'bg-amber-500'
                              : 'bg-brand-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {a.createdBy.firstName ?? a.createdBy.name}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {a.publishedAt ? formatRelativeTime(a.publishedAt) : ''}
                          </span>
                          {a.requiresRead && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Lectura obligatoria
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Usuarios online */}
        <SectionCard
          title="En línea ahora"
          subtitle={`${activeUsers.length} persona${activeUsers.length !== 1 ? 's' : ''} activa${activeUsers.length !== 1 ? 's' : ''}`}
          action={
            <Link href="/directorio" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Ver directorio →
            </Link>
          }
        >
          {activeUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nadie en línea"
              description="Los usuarios conectados aparecerán aquí."
              size="sm"
            />
          ) : (
            <div className="space-y-2.5">
              {activeUsers.map(({ user: u, status }) => (
                <Link key={u.id} href={`/directorio/${u.id}`}>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={u.name}
                        firstName={u.firstName}
                        lastName={u.lastName}
                        avatarUrl={u.avatarUrl}
                        size="sm"
                      />
                      <PresenceDot
                        status={status as any}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {u.firstName && u.lastName
                          ? `${u.firstName} ${u.lastName}`
                          : u.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.jobTitle ?? ''}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/canales', icon: Hash, label: 'Ir a canales', color: 'text-brand-600 bg-brand-50' },
          { href: '/mensajes', icon: MessageSquare, label: 'Mensaje directo', color: 'text-accent-600 bg-accent-50' },
          { href: '/anuncios', icon: Megaphone, label: 'Ver anuncios', color: 'text-amber-600 bg-amber-50' },
          { href: '/directorio', icon: Users, label: 'Directorio', color: 'text-green-600 bg-green-50' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
