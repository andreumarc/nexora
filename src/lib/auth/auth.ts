import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            hashedPassword: true,
            isActive: true,
            isBlocked: true,
            isSuperadmin: true,
            onboardingCompleted: true,
          },
        })

        if (!user || !user.hashedPassword) return null
        if (!user.isActive || user.isBlocked) return null

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordMatch) return null

        // Update last active
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          isSuperadmin: user.isSuperadmin,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    }),
    Credentials({
      id: 'hub-sso',
      name: 'ImpulsoDent Hub SSO',
      credentials: { hub_token: { label: 'Hub Token', type: 'text' } },
      async authorize(credentials) {
        try {
          const token = credentials?.hub_token as string | undefined
          if (!token) return null
          const secret = process.env.HUB_JWT_SECRET
          if (!secret) return null
          const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(secret),
            { issuer: 'impulsodent-hub' },
          )
          const email = payload.email as string
          const name = (payload.name as string) ?? email
          const companySlug = (payload.company_slug as string | null) ?? null
          if (!email) return null

          let user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true, email: true, name: true, firstName: true, lastName: true,
              avatarUrl: true, isActive: true, isBlocked: true,
              isSuperadmin: true, onboardingCompleted: true,
            },
          })
          if (!user) {
            const created = await prisma.user.create({
              data: {
                email, name, firstName: name, lastName: '',
                hashedPassword: '', isActive: true, onboardingCompleted: true,
              },
            })
            user = {
              id: created.id, email: created.email, name: created.name,
              firstName: created.firstName, lastName: created.lastName,
              avatarUrl: created.avatarUrl, isActive: created.isActive,
              isBlocked: created.isBlocked, isSuperadmin: created.isSuperadmin,
              onboardingCompleted: created.onboardingCompleted,
            }
          }
          if (!user.isActive || user.isBlocked) return null

          if (companySlug) {
            try {
              const company = await prisma.company.findUnique({ where: { slug: companySlug } })
              if (company) {
                const existing = await prisma.membership.findFirst({
                  where: { userId: user.id, companyId: company.id },
                })
                if (!existing) {
                  await prisma.membership.create({
                    data: { userId: user.id, companyId: company.id, role: 'EMPLOYEE', isActive: true },
                  })
                }
              }
            } catch { /* non-fatal */ }
          }

          await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            isSuperadmin: user.isSuperadmin,
            onboardingCompleted: user.onboardingCompleted,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.avatarUrl = (user as any).avatarUrl
        token.isSuperadmin = (user as any).isSuperadmin
        token.onboardingCompleted = (user as any).onboardingCompleted
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).firstName = token.firstName
        ;(session.user as any).lastName = token.lastName
        ;(session.user as any).avatarUrl = token.avatarUrl
        ;(session.user as any).isSuperadmin = token.isSuperadmin
        ;(session.user as any).onboardingCompleted = token.onboardingCompleted
        ;(session.user as any).companyId = (token.companyId as string | null) ?? null
      }
      return session
    },
  },
})
