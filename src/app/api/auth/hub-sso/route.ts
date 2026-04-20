import { NextRequest, NextResponse } from 'next/server'

// Delegate to /sso page which uses NextAuth signIn("hub-sso", ...) for a real session cookie.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hubToken = searchParams.get('hub_token')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin

  if (!hubToken) return NextResponse.redirect(`${origin}/login?error=missing_token`)

  const target = new URL('/sso', origin)
  target.searchParams.set('hub_token', hubToken)
  return NextResponse.redirect(target)
}
