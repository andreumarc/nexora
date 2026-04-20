import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/recuperar-contrasena', '/nueva-contrasena', '/invitacion', '/api/sync/user', '/api/sync/company', '/api/auth/hub-sso', '/sso']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isApi = pathname.startsWith('/api')
  const isAuth = !!req.auth

  if (isApi || isPublic) return NextResponse.next()

  if (!isAuth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
