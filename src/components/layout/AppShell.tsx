'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: React.ReactNode
  user: {
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    jobTitle?: string | null
    avatarUrl?: string | null
  }
  companyName?: string
  unreadNotifications?: number
}

export function AppShell({ children, user, companyName, unreadNotifications = 0 }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        companyName={companyName}
        unreadNotifications={unreadNotifications}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          unreadNotifications={unreadNotifications}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
