# NEXORA — Plataforma de Comunicación Interna Corporativa

> SaaS de comunicación interna para grupos de clínicas dentales, empresas multisede y organizaciones sanitarias.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15+ App Router · TypeScript · Tailwind CSS · shadcn/ui |
| Auth | Auth.js (NextAuth v5) · bcryptjs · JWT |
| Base de datos | PostgreSQL (Neon) · Prisma ORM |
| Realtime | Socket.IO |
| Storage | Supabase Storage (adapter desacoplado) |
| Estado | Zustand |
| Charts | Recharts |
| Deploy | Vercel · GitHub Actions |

---

## Inicio rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/andreumarc/nexora.git
cd nexora
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Edita .env.local con tus valores reales
```

Variables requeridas:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `DIRECT_URL` — Neon direct connection (para migraciones)
- `AUTH_SECRET` — Generar con `openssl rand -base64 32`
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key de Supabase

### 3. Base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar schema (primera vez)
npm run db:push

# O con migraciones
npm run db:migrate

# Seed con datos demo de Impulso Dental Group
npm run db:seed
```

### 4. Arrancar en desarrollo

```bash
npm run dev
```

Accede a `http://localhost:3000`

---

## Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Superadmin | marcandreueguerao@gmail.com | Admin1234! |
| Dirección general | direccion@impulsodent.com | Demo2026! |
| Director operaciones | operaciones@impulsodent.com | Demo2026! |
| RRHH | rrhh@impulsodent.com | Demo2026! |
| Dir. clínica Badalona | direccion.badalona@impulsodent.com | Demo2026! |
| Recepción Badalona | recepcion.badalona@impulsodent.com | Demo2026! |
| Demo (read-only) | demo@impulsodent.com | Demo2026! |

---

## Despliegue — GitHub + Vercel + Neon + Supabase

### 1. Base de datos — Neon

1. Crea un proyecto en [neon.tech](https://neon.tech)
2. Copia los connection strings: `DATABASE_URL` y `DIRECT_URL`
3. Añade `?sslmode=require` al final si no está incluido

### 2. Storage — Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Storage → Create bucket: `nexora-files` (public)
3. Copia las claves de Settings → API

### 3. GitHub

```bash
git init
git add .
git commit -m "feat: initial NEXORA platform"
git remote add origin https://github.com/andreumarc/nexora.git
git push -u origin main
```

### 4. Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Framework: Next.js (detecta automáticamente)
3. Añade todas las variables de entorno de `.env.example`
4. Deploy

### 5. Seed en producción

```bash
# Una vez desplegado, ejecutar seed desde local apuntando a producción
DATABASE_URL="tu-neon-url" npm run db:seed
```

---

## Estructura del proyecto

```
nexora/
├── prisma/
│   ├── schema.prisma     # Modelo de datos completo
│   └── seed.ts           # Seed demo Impulso Dental Group
├── src/
│   ├── app/
│   │   ├── (auth)/       # Login, onboarding, recuperar contraseña
│   │   ├── (dashboard)/  # App principal
│   │   └── api/          # Route handlers
│   ├── components/       # Componentes UI reutilizables
│   ├── features/         # Lógica por feature
│   ├── lib/
│   │   ├── auth/         # NextAuth config
│   │   ├── db/           # Prisma client
│   │   ├── permissions/  # RBAC matrix
│   │   ├── tenant/       # Multi-tenant isolation
│   │   ├── storage/      # Storage adapter
│   │   ├── realtime/     # Socket.IO events
│   │   └── audit/        # Audit logger
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
```

---

## Roles disponibles

| Rol | Acceso |
|-----|--------|
| `SUPERADMIN` | Plataforma completa |
| `COMPANY_ADMIN` | Toda la empresa |
| `DIRECTOR_GENERAL` | Canales + anuncios + métricas |
| `DIRECTOR_OPERATIONS` | Canales + anuncios operativos |
| `CLINIC_DIRECTOR` | Su clínica + canales |
| `HR_MANAGER` | Anuncios + canales corporativos |
| `RECEPTIONIST` | Canales asignados + mensajes |
| `EMPLOYEE` | Canales asignados + mensajes |
| `GUEST` | Acceso muy restringido |

---

## Roadmap

### V2 — Comunicación avanzada
- [ ] Llamadas de voz (WebRTC)
- [ ] Videollamadas 1:1
- [ ] Calendario compartido
- [ ] Tareas rápidas y recordatorios
- [ ] Estados de usuario avanzados
- [ ] Hilos mejorados con vista dedicada
- [ ] Redis pub/sub para realtime escalable
- [ ] Push notifications (PWA)

### V3 — IA e integraciones
- [ ] IA para resumir conversaciones y canales
- [ ] Búsqueda semántica (pgvector)
- [ ] Traducción automática de mensajes
- [ ] Integración Google Workspace / Microsoft 365
- [ ] Integración con sistemas de RRHH
- [ ] Integración con gestor documental
- [ ] White-label por empresa
- [ ] Billing y planes de suscripción

---

## Microcopy UX

| Contexto | Texto |
|----------|-------|
| Canal vacío | "Este es el inicio de la conversación. Sé el primero en escribir." |
| Sin mensajes DM | "Empieza una conversación directa con esta persona." |
| Sin anuncios | "Los comunicados corporativos aparecerán aquí cuando se publiquen." |
| Sin notificaciones | "Todo al día. Aquí verás menciones, DMs y comunicados importantes." |
| Error de permisos | "No tienes acceso a esta sección. Contacta con el administrador." |
| Archivo no permitido | "El archivo supera el tamaño máximo permitido (25MB) o el tipo no está permitido." |
| Anuncio urgente | "⚠️ Este comunicado requiere tu confirmación de lectura." |
| Confirmación enviada | "Lectura confirmada correctamente." |
| Usuario desconectado | "Desconectado" |
| Canal archivado | "Este canal está archivado. Solo puedes leer mensajes anteriores." |
| Canal solo lectura | "No tienes permisos para enviar mensajes en este canal." |
| Invitación enviada | "Invitación enviada correctamente. El usuario recibirá un email." |

---

## Seguridad

- Tenant isolation: `companyId` validado en cada query
- RBAC en backend: permisos nunca solo en frontend
- Soft delete: datos auditables, no destruidos
- Audit log: todas las acciones sensibles registradas
- Sessions JWT: expiración configurable
- Passwords: bcrypt con salt 12
- SQL injection: imposible vía Prisma ORM
- CORS: configurado en Next.js

---

© 2026 Nexora · ImpulsoDent Group · andreumarc
