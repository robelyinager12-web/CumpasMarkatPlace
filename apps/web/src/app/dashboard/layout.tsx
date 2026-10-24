import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/auth/login?next=/dashboard')

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-8 flex gap-6 border-b border-slate-200 pb-3 text-sm font-medium" aria-label="Dashboard">
        <Link href="/dashboard" className="text-slate-700 hover:text-brand-purple">
          Overview
        </Link>
        <Link href="/dashboard/settings" className="text-slate-700 hover:text-brand-purple">
          Settings
        </Link>
      </nav>
      {children}
    </div>
  )
}