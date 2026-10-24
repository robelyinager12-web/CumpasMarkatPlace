'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { APP_NAME } from '@/lib/constants'

export function Navbar() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6" aria-label="Main">
        <Link href="/" className="text-xl font-bold text-brand-navy">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/marketplace" className="text-slate-600 hover:text-brand-purple">
            Marketplace
          </Link>
          {isLoading ? null : user ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-brand-purple">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="rounded-full border border-slate-300 px-4 py-1.5 hover:bg-slate-50">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-slate-600 hover:text-brand-purple">
                Log in
              </Link>
              <Link href="/auth/register" className="rounded-full bg-brand-purple px-4 py-1.5 text-white hover:opacity-90">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}