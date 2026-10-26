import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/auth/login?next=/dashboard')

  const link = 'text-slate-700 hover:text-brand-purple'
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-slate-200 pb-3 text-sm font-medium" aria-label="Dashboard">
        <Link href="/dashboard" className={link}>Overview</Link>
        <Link href="/dashboard/listings" className={link}>My listings</Link>
        <Link href="/dashboard/notifications" className={link}>Notifications</Link>
        <Link href="/dashboard/reports" className={link}>Reports</Link>
        <Link href="/dashboard/security" className={link}>Security</Link>
        <Link href="/dashboard/settings" className={link}>Settings</Link>
      </nav>
      {children}
    </div>
  )
}