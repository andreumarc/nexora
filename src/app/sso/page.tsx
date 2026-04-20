import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth/auth'

async function completeSso(formData: FormData) {
  'use server'
  const hub_token = formData.get('hub_token') as string | null
  if (!hub_token) redirect('/login')
  try {
    await signIn('hub-sso', { hub_token, redirectTo: '/' })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=sso_failed')
    }
    throw error
  }
}

export default async function SsoPage(props: {
  searchParams: Promise<{ hub_token?: string }>
}) {
  const params = await props.searchParams
  if (!params.hub_token) redirect('/login')

  return (
    <form action={completeSso} id="sso-form" style={{ display: 'none' }}>
      <input type="hidden" name="hub_token" value={params.hub_token} />
      <noscript>
        <button type="submit">Continuar con SSO</button>
      </noscript>
      <script
        dangerouslySetInnerHTML={{
          __html: "document.getElementById('sso-form').submit()",
        }}
      />
    </form>
  )
}
