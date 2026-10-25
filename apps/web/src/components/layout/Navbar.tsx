'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSummary } from '@/hooks/useNotifications'
import { APP_NAME } from '@/lib/constants'

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white" aria-label={`${count} unread`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Navbar() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const summary = useSummary(!!user).data

  async function handleLogout() {
    await logout()
    router.push('/')
    router.refresh()
  }

  const linkClass = 'text-slate-600 hover:text-brand-purple'

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6" aria-label="Main">
        <Link href="/" className="text-xl font-bold text-brand-navy">
          {APP_NAME}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-medium">
          <Link href="/marketplace" className={linkClass}>
            Marketplace
          </Link>
          <Link href="/sell/new" className="rounded-full border border-brand-purple px-4 py-1.5 text-brand-purple hover:bg-brand-purple hover:text-white">
            Sell
          </Link>
          {isLoading ? null : user ? (
            <>
              <Link href="/messages" className={linkClass}>
                Messages
                <Badge count={summary?.unreadMessages ?? 0} />
              </Link>
              <Link href="/favorites" className={linkClass}>
                Favorites
              </Link>
              <Link href="/dashboard" className={linkClass}>
                Dashboard
                <Badge count={summary?.unreadNotifications ?? 0} />
              </Link>
              <button onClick={handleLogout} className="rounded-full border border-slate-300 px-4 py-1.5 hover:bg-slate-50">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={linkClass}>
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