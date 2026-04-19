import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding NEXORA demo database...')

  // ============================================================
  // CLEAN UP
  // ============================================================
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.announcementRead.deleteMany()
  await prisma.announcementAudience.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.messageReaction.deleteMany()
  await prisma.messageRead.deleteMany()
  await prisma.messageAttachment.deleteMany()
  await prisma.message.deleteMany()
  await prisma.channelMember.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.directConversationMember.deleteMany()
  await prisma.directConversation.deleteMany()
  await prisma.userPresence.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.tenantSettings.deleteMany()
  await prisma.team.deleteMany()
  await prisma.department.deleteMany()
  await prisma.clinic.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  const hash = (password: string) => bcrypt.hash(password, 12)

  // ============================================================
  // SUPERADMIN
  // ============================================================
  const superadmin = await prisma.user.create({
    data: {
      email: 'marcandreueguerao@gmail.com',
      hashedPassword: await hash('Admin1234!'),
      name: 'Marc Andreu',
      firstName: 'Marc',
      lastName: 'Andreu',
      jobTitle: 'Superadministrador',
      isSuperadmin: true,
      isActive: true,
      onboardingCompleted: true,
    },
  })

  // ============================================================
  // COMPANY: IMPULSO DENTAL GROUP
  // ============================================================
  const company = await prisma.company.create({
    data: {
      name: 'Impulso Dental Group',
      slug: 'impulso-dental',
      domain: 'impulsodent.com',
      isActive: true,
    },
  })

  await prisma.tenantSettings.create({
    data: {
      companyId: company.id,
      maxUsers: 500,
      maxStorage: BigInt(50 * 1024 * 1024 * 1024), // 50GB
      allowGuests: false,
      emailNotifications: true,
    },
  })

  // ============================================================
  // CLINICS
  // ============================================================
  const clinicData = [
    { name: 'Impulso Dental Badalona', code: 'BAD', city: 'Badalona' },
    { name: 'Impulso Dental Hospitalet', code: 'HOS', city: "L'Hospitalet de Llobregat" },
    { name: 'Impulso Dental Lleida', code: 'LLE', city: 'Lleida' },
    { name: 'Impulso Dental Igualada', code: 'IGU', city: 'Igualada' },
    { name: 'Impulso Dental Bilbao', code: 'BIL', city: 'Bilbao' },
  ]

  const clinics = await Promise.all(
    clinicData.map((c) =>
      prisma.clinic.create({
        data: { ...c, companyId: company.id, isActive: true },
      })
    )
  )

  const [badalona, hospitalet, lleida, igualada, bilbao] = clinics

  // ============================================================
  // DEPARTMENTS
  // ============================================================
  const [deptOperaciones, deptRRHH, deptRecepcion, deptClinica] = await Promise.all([
    prisma.department.create({ data: { companyId: company.id, name: 'Operaciones' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Recursos Humanos' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Recepción y Administración' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Área Clínica' } }),
  ])

  // ============================================================
  // USERS
  // ============================================================
  const usersData = [
    {
      email: 'direccion@impulsodent.com',
      firstName: 'Laura',
      lastName: 'Martínez',
      jobTitle: 'Directora General',
      role: 'DIRECTOR_GENERAL' as const,
    },
    {
      email: 'operaciones@impulsodent.com',
      firstName: 'Jordi',
      lastName: 'Puig',
      jobTitle: 'Director de Operaciones',
      role: 'DIRECTOR_OPERATIONS' as const,
      departmentId: deptOperaciones.id,
    },
    {
      email: 'rrhh@impulsodent.com',
      firstName: 'Ana',
      lastName: 'García',
      jobTitle: 'Responsable de RRHH',
      role: 'HR_MANAGER' as const,
      departmentId: deptRRHH.id,
    },
    {
      email: 'direccion.badalona@impulsodent.com',
      firstName: 'Marta',
      lastName: 'Soler',
      jobTitle: 'Directora clínica Badalona',
      role: 'CLINIC_DIRECTOR' as const,
      clinicId: badalona.id,
    },
    {
      email: 'direccion.hospitalet@impulsodent.com',
      firstName: 'Carlos',
      lastName: 'López',
      jobTitle: 'Director clínica Hospitalet',
      role: 'CLINIC_DIRECTOR' as const,
      clinicId: hospitalet.id,
    },
    {
      email: 'recepcion.badalona@impulsodent.com',
      firstName: 'Elena',
      lastName: 'Fernández',
      jobTitle: 'Recepcionista Badalona',
      role: 'RECEPTIONIST' as const,
      clinicId: badalona.id,
      departmentId: deptRecepcion.id,
    },
    {
      email: 'recepcion.hospitalet@impulsodent.com',
      firstName: 'Paula',
      lastName: 'Díaz',
      jobTitle: 'Recepcionista Hospitalet',
      role: 'RECEPTIONIST' as const,
      clinicId: hospitalet.id,
      departmentId: deptRecepcion.id,
    },
    {
      email: 'empleado@impulsodent.com',
      firstName: 'David',
      lastName: 'Torres',
      jobTitle: 'Auxiliar dental',
      role: 'EMPLOYEE' as const,
      clinicId: badalona.id,
      departmentId: deptClinica.id,
    },
    {
      email: 'demo@impulsodent.com',
      firstName: 'Demo',
      lastName: 'Usuario',
      jobTitle: 'Acceso demo',
      role: 'EMPLOYEE' as const,
    },
  ]

  const createdUsers = await Promise.all(
    usersData.map(async ({ role, clinicId, departmentId, ...userData }) => {
      const user = await prisma.user.create({
        data: {
          ...userData,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          hashedPassword: await hash('Demo2026!'),
          isActive: true,
          onboardingCompleted: true,
        },
      })

      await prisma.membership.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role,
          clinicId: clinicId ?? null,
          departmentId: departmentId ?? null,
          isActive: true,
        },
      })

      return { user, role, clinicId, departmentId }
    })
  )

  const [direccion, operaciones, rrhh, dirBadalona, dirHospitalet, recBadalona, recHospitalet, empleado, demo] =
    createdUsers

  // Admin empresa
  await prisma.membership.create({
    data: {
      userId: superadmin.id,
      companyId: company.id,
      role: 'COMPANY_ADMIN',
      isActive: true,
    },
  })

  // ============================================================
  // PRESENCE
  // ============================================================
  const presenceData = [
    { userId: direccion.user.id, status: 'ONLINE' as const },
    { userId: operaciones.user.id, status: 'ONLINE' as const },
    { userId: rrhh.user.id, status: 'AWAY' as const },
    { userId: dirBadalona.user.id, status: 'ONLINE' as const },
    { userId: dirHospitalet.user.id, status: 'BUSY' as const, statusText: 'En reunión' },
    { userId: recBadalona.user.id, status: 'ONLINE' as const },
    { userId: recHospitalet.user.id, status: 'OFFLINE' as const },
    { userId: empleado.user.id, status: 'ONLINE' as const },
    { userId: demo.user.id, status: 'OFFLINE' as const },
  ]

  await Promise.all(
    presenceData.map(({ userId, status, statusText }) =>
      prisma.userPresence.create({
        data: { userId, status, statusText: statusText ?? null, lastSeenAt: new Date() },
      })
    )
  )

  // ============================================================
  // CHANNELS
  // ============================================================
  const channelsData = [
    // Corporativos
    { name: 'general-corporativo', slug: 'general-corporativo', description: 'Canal general de toda la empresa', type: 'PUBLIC' as const, isPinned: true },
    { name: 'anuncios-dirección', slug: 'anuncios-direccion', description: 'Comunicados de dirección', type: 'ANNOUNCEMENT' as const, isReadOnly: true, isPinned: true },
    { name: 'rrhh-comunicaciones', slug: 'rrhh-comunicaciones', description: 'Comunicaciones de RRHH y personas', type: 'PUBLIC' as const },
    { name: 'operaciones', slug: 'operaciones', description: 'Canal de operaciones y coordinación', type: 'PUBLIC' as const },
    { name: 'dirección-clínicas', slug: 'direccion-clinicas', description: 'Canal de directores de clínica', type: 'PRIVATE' as const },
    { name: 'onboarding', slug: 'onboarding', description: 'Bienvenida y proceso de incorporación', type: 'PUBLIC' as const },
    // Incidencias / Operativo
    { name: 'incidencias-operativas', slug: 'incidencias-operativas', description: 'Incidencias no técnicas del día a día', type: 'OPERATIONAL' as const, isOperational: true },
    { name: 'apertura-centros', slug: 'apertura-centros', description: 'Coordinación de aperturas y cierres', type: 'OPERATIONAL' as const, isOperational: true },
  ]

  const createdChannels = await Promise.all(
    channelsData.map((ch) =>
      prisma.channel.create({
        data: {
          ...ch,
          companyId: company.id,
          createdById: direccion.user.id,
        },
      })
    )
  )

  // Clinic channels
  const clinicChannels = await Promise.all(
    clinics.map((clinic) =>
      prisma.channel.create({
        data: {
          companyId: company.id,
          clinicId: clinic.id,
          name: `${clinic.code!.toLowerCase()}-general`,
          slug: `${clinic.code!.toLowerCase()}-general`,
          description: `Canal general de ${clinic.name}`,
          type: 'PUBLIC',
          isOperational: true,
        },
      })
    )
  )

  const recepcionChannels = await Promise.all(
    [badalona, hospitalet].map((clinic) =>
      prisma.channel.create({
        data: {
          companyId: company.id,
          clinicId: clinic.id,
          departmentId: deptRecepcion.id,
          name: `recepcion-${clinic.code!.toLowerCase()}`,
          slug: `recepcion-${clinic.code!.toLowerCase()}`,
          description: `Recepción de ${clinic.name}`,
          type: 'PUBLIC',
          isOperational: true,
        },
      })
    )
  )

  const allChannels = [...createdChannels, ...clinicChannels, ...recepcionChannels]

  // Add all users to public channels
  const publicChannels = allChannels.filter((c) => c.type === 'PUBLIC' || c.type === 'OPERATIONAL' || c.type === 'ANNOUNCEMENT')
  const allUserIds = createdUsers.map((u) => u.user.id)

  for (const channel of publicChannels) {
    await Promise.all(
      allUserIds.map((userId) =>
        prisma.channelMember.upsert({
          where: { channelId_userId: { channelId: channel.id, userId } },
          create: { channelId: channel.id, userId },
          update: {},
        })
      )
    )
  }

  // Add directors to private direction channel
  const dirChannel = createdChannels.find((c) => c.slug === 'direccion-clinicas')!
  for (const userId of [direccion.user.id, operaciones.user.id, dirBadalona.user.id, dirHospitalet.user.id]) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: dirChannel.id, userId } },
      create: { channelId: dirChannel.id, userId, role: 'admin' },
      update: {},
    })
  }

  // ============================================================
  // MESSAGES — demo conversations
  // ============================================================
  const generalChannel = createdChannels.find((c) => c.slug === 'general-corporativo')!
  const opChannel = createdChannels.find((c) => c.slug === 'operaciones')!

  const now = new Date()
  const msg = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

  const messageData = [
    {
      channelId: generalChannel.id,
      senderId: direccion.user.id,
      content: '¡Buenos días a todos! Empezamos una nueva semana con mucha energía 💪 Recordad que este es nuestro canal principal de comunicación corporativa.',
      createdAt: msg(48),
    },
    {
      channelId: generalChannel.id,
      senderId: rrhh.user.id,
      content: 'Recordamos que el próximo viernes hay formación obligatoria para todo el personal de recepción. Horario: 16:00 - 18:00h.',
      createdAt: msg(36),
    },
    {
      channelId: generalChannel.id,
      senderId: dirBadalona.user.id,
      content: 'La clínica de Badalona alcanzó el objetivo de producción mensual. ¡Felicidades al equipo! 🎉',
      createdAt: msg(24),
    },
    {
      channelId: generalChannel.id,
      senderId: operaciones.user.id,
      content: 'Actualización de procedimiento de apertura: a partir del próximo lunes, el checklist de apertura se enviará a través de este canal. Podéis consultar el documento adjunto en el canal #apertura-centros.',
      createdAt: msg(12),
    },
    {
      channelId: generalChannel.id,
      senderId: recBadalona.user.id,
      content: '¡Gracias por la info! ¿Hay algún cambio en el protocolo de confirmación de citas?',
      createdAt: msg(6),
    },
    {
      channelId: opChannel.id,
      senderId: operaciones.user.id,
      content: 'Recordatorio: revisión de ocupación de sillones esta semana. Lleida y Igualada están por debajo del objetivo. Coordinemos con los directores.',
      createdAt: msg(5),
    },
    {
      channelId: opChannel.id,
      senderId: dirBadalona.user.id,
      content: 'Badalona a tope esta semana. Necesitamos apoyo de auxiliar el miércoles por la tarde si alguien puede.',
      createdAt: msg(3),
    },
    {
      channelId: opChannel.id,
      senderId: operaciones.user.id,
      content: '@dirección.badalona Lo gestiono. Os confirmo antes del mediodía.',
      createdAt: msg(2),
    },
  ]

  const createdMessages = await Promise.all(
    messageData.map((m) =>
      prisma.message.create({ data: { ...m, type: 'TEXT' } })
    )
  )

  // Pin one message
  await prisma.message.update({
    where: { id: createdMessages[0].id },
    data: { isPinned: true, pinnedAt: new Date(), pinnedById: direccion.user.id },
  })

  // Add some reactions
  await Promise.all([
    prisma.messageReaction.create({
      data: { messageId: createdMessages[2].id, userId: operaciones.user.id, emoji: '🎉' },
    }),
    prisma.messageReaction.create({
      data: { messageId: createdMessages[2].id, userId: rrhh.user.id, emoji: '🎉' },
    }),
    prisma.messageReaction.create({
      data: { messageId: createdMessages[2].id, userId: recBadalona.user.id, emoji: '👏' },
    }),
    prisma.messageReaction.create({
      data: { messageId: createdMessages[0].id, userId: operaciones.user.id, emoji: '👍' },
    }),
  ])

  // ============================================================
  // DIRECT CONVERSATION DEMO
  // ============================================================
  const dm = await prisma.directConversation.create({
    data: { companyId: company.id, isGroup: false },
  })

  await Promise.all([
    prisma.directConversationMember.create({
      data: { conversationId: dm.id, userId: operaciones.user.id },
    }),
    prisma.directConversationMember.create({
      data: { conversationId: dm.id, userId: dirBadalona.user.id },
    }),
  ])

  await prisma.message.createMany({
    data: [
      {
        conversationId: dm.id,
        senderId: operaciones.user.id,
        content: 'Marta, ¿cómo va la implantología esta semana?',
        type: 'TEXT',
        createdAt: msg(4),
      },
      {
        conversationId: dm.id,
        senderId: dirBadalona.user.id,
        content: 'Muy bien, tenemos agenda completa hasta el viernes. El nuevo equipo de radiología está funcionando perfecto.',
        type: 'TEXT',
        createdAt: msg(3.5),
      },
    ],
  })

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================
  const announcements = [
    {
      title: '⚠️ Actualización de protocolos de higiene y seguridad — LECTURA OBLIGATORIA',
      content:
        'Estimado equipo,\n\nCon motivo de las nuevas normativas sanitarias vigentes desde el 1 de enero de 2026, hemos actualizado nuestros protocolos de higiene y seguridad en todas las clínicas del grupo.\n\nEs OBLIGATORIO que todo el personal sanitario y administrativo lea y confirme la lectura de este comunicado antes del próximo viernes.\n\nLos cambios principales son:\n1. Nuevo protocolo de esterilización de instrumental\n2. Actualización del registro de limpieza de unidades\n3. Procedimiento de gestión de residuos sanitarios\n\nEl documento completo está disponible en la carpeta de Protocolos del servidor.\n\nGracias por vuestra atención.',
      priority: 'URGENT' as const,
      requiresRead: true,
      isPinned: true,
      isPublished: true,
      publishedAt: msg(48),
      createdById: rrhh.user.id,
    },
    {
      title: 'Formación corporativa — Atención al paciente digital · Marzo 2026',
      content:
        'Nos complace anunciar la próxima sesión de formación corporativa sobre atención al paciente en entornos digitales.\n\nFecha: Viernes 28 de marzo de 2026\nHorario: 16:00 - 18:30h\nModalidad: Online (enlace por email)\n\nEs obligatoria para todo el personal de recepción y administración. El resto del personal puede asistir de forma voluntaria.\n\nSe entregará certificado de asistencia.',
      priority: 'HIGH' as const,
      requiresRead: false,
      isPinned: false,
      isPublished: true,
      publishedAt: msg(24),
      createdById: rrhh.user.id,
    },
    {
      title: 'Resultados Q1 2026 — Superamos el objetivo de producción del grupo',
      content:
        'Equipo,\n\nEs un placer comunicaros que Impulso Dental Group ha superado el objetivo de producción del primer trimestre de 2026 en un 12%.\n\nEste resultado es fruto del esfuerzo y compromiso de todo el equipo. Os felicitamos a todos y todas por vuestro trabajo.\n\nEn las próximas semanas recibiréis información sobre la política de incentivos vinculada a estos resultados.\n\nUn saludo,\nLaura Martínez — Dirección General',
      priority: 'NORMAL' as const,
      requiresRead: false,
      isPinned: true,
      isPublished: true,
      publishedAt: msg(12),
      createdById: direccion.user.id,
    },
    {
      title: 'Nuevo sistema de gestión de vacaciones y ausencias',
      content:
        'A partir del próximo mes, las solicitudes de vacaciones y ausencias se gestionarán a través del nuevo módulo de RRHH del sistema.\n\nOs iremos comunicando el proceso de acceso y las instrucciones de uso en los próximos días.\n\nPara cualquier duda, contactad con el departamento de RRHH.',
      priority: 'NORMAL' as const,
      requiresRead: false,
      isPublished: true,
      publishedAt: msg(6),
      createdById: rrhh.user.id,
    },
  ]

  const createdAnnouncements = await Promise.all(
    announcements.map((a) =>
      prisma.announcement.create({
        data: {
          ...a,
          companyId: company.id,
          audiences: {
            create: [{ clinicId: null, departmentId: null, role: null }],
          },
        },
      })
    )
  )

  // Mark some announcements as read by some users
  await Promise.all([
    prisma.announcementRead.create({
      data: {
        announcementId: createdAnnouncements[0].id,
        userId: operaciones.user.id,
        readAt: msg(40),
        confirmedAt: msg(39),
      },
    }),
    prisma.announcementRead.create({
      data: {
        announcementId: createdAnnouncements[0].id,
        userId: dirBadalona.user.id,
        readAt: msg(38),
        confirmedAt: msg(37),
      },
    }),
    prisma.announcementRead.create({
      data: {
        announcementId: createdAnnouncements[2].id,
        userId: rrhh.user.id,
        readAt: msg(10),
      },
    }),
  ])

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await prisma.notification.createMany({
    data: [
      {
        userId: demo.user.id,
        type: 'ANNOUNCEMENT',
        title: 'Anuncio importante',
        body: 'Actualización de protocolos de higiene — lectura obligatoria',
        announcementId: createdAnnouncements[0].id,
        isRead: false,
      },
      {
        userId: demo.user.id,
        type: 'CHANNEL_MESSAGE',
        title: 'Mensaje nuevo en #general-corporativo',
        body: 'Jordi Puig: Actualización de procedimiento de apertura...',
        isRead: false,
      },
    ],
  })

  // ============================================================
  // AUDIT LOGS
  // ============================================================
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        userId: superadmin.id,
        action: 'user.created',
        resource: 'Company',
        resourceId: company.id,
        metadata: { name: 'Impulso Dental Group' },
        createdAt: msg(72),
      },
      {
        companyId: company.id,
        userId: direccion.user.id,
        action: 'channel.created',
        resource: 'Channel',
        resourceId: createdChannels[0].id,
        metadata: { name: 'general-corporativo' },
        createdAt: msg(48),
      },
      {
        companyId: company.id,
        userId: rrhh.user.id,
        action: 'announcement.published',
        resource: 'Announcement',
        resourceId: createdAnnouncements[0].id,
        metadata: { title: 'Actualización de protocolos' },
        createdAt: msg(48),
      },
      {
        companyId: company.id,
        userId: operaciones.user.id,
        action: 'auth.login',
        ipAddress: '83.52.12.45',
        createdAt: msg(5),
      },
    ],
  })

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('✅ Seed completado:')
  console.log(`  - 1 empresa: Impulso Dental Group`)
  console.log(`  - ${clinics.length} clínicas`)
  console.log(`  - ${createdUsers.length + 1} usuarios (+ superadmin)`)
  console.log(`  - ${allChannels.length} canales`)
  console.log(`  - ${messageData.length} mensajes demo`)
  console.log(`  - ${announcements.length} anuncios`)
  console.log()
  console.log('📧 Accesos demo:')
  console.log('  Superadmin:      marcandreueguerao@gmail.com  /  Admin1234!')
  console.log('  Dirección:       direccion@impulsodent.com    /  Demo2026!')
  console.log('  Operaciones:     operaciones@impulsodent.com  /  Demo2026!')
  console.log('  RRHH:            rrhh@impulsodent.com         /  Demo2026!')
  console.log('  Dir. Badalona:   direccion.badalona@...       /  Demo2026!')
  console.log('  Recepción:       recepcion.badalona@...       /  Demo2026!')
  console.log('  Demo (readonly): demo@impulsodent.com         /  Demo2026!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
