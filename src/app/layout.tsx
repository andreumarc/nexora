import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Nexora — Comunicación Interna Corporativa',
    template: '%s · Nexora',
  },
  description: 'Plataforma de comunicación interna para grupos de clínicas y empresas multisede.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
