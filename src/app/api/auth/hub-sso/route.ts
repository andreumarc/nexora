import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hubToken = searchParams.get('hub_token')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin

  if (!hubToken) return NextResponse.redirect(`${origin}/login?error=missing_token`)
  const hubSecret = process.env.HUB_JWT_SECRET
  if (!hubSecret) return NextResponse.redirect(`${origin}/login?error=not_configured`)

  let email: string, name: string, appRole: string
  try {
    const { payload } = await jwtVerify(hubToken, new TextEncoder().encode(hubSecret), { issuer: 'impulsodent-hub' })
    email = payload['email'] as string
    name = (payload['name'] as string) ?? ''
    appRole = (payload['app_role'] as string) ?? 'user'
    if (!email) throw new Error('no email')
  } catch {
    return NextResponse.redirect(`${origin}/login?error=invalid_token`)
  }

  // JIT upsert
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email, name: name || email, isActive: true } })
  }

  const secret = process.env.AUTH_SECRET!
  const sessionToken = await encode({
    token: { sub: user.id, email: user.email, name: user.name, id: user.id },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  })
  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token'
  const response = NextResponse.redirect(`${origin}/dashboard`)
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return response
}
