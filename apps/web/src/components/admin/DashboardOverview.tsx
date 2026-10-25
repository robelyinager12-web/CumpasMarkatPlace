'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatAction, formatDateTime } from '@/lib/admin-format'
import { getAdminDashboard } from '@/services/admin.service'

export function DashboardOverview() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard, refetchInterval: 60_000 })

  if (query.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError || !query.data) return <FormAlert message="Could not load the dashboard." />
  const { stats, promotions, revenue, recentActivity } = query.data

  const todo = [
    { href: '/admin/reports', label: 'Reports to review', value: stats.pendingReports + stats.reviewingReports },
    { href: '/admin/verifications', label: 'Student verifications waiting', value: stats.pendingVerifications },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-navy">Admin dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {todo.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-2xl border border-brand-purple/40 bg-brand-purple/5 p-4 hover:bg-brand-purple/10"
          >
            <span className="font-medium text-brand-navy">{item.label}</span>
            <span className="text-2xl font-bold text-brand-purple">{item.value}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Registered users" value={stats.totalUsers} hint={`${stats.newUsers7d} new this week`} />
        <StatCard label="Verified students" value={stats.verifiedStudents} />
        <StatCard label="Active listings" value={stats.activeListings} hint={`${stats.newListings7d} new this week`} />
        <StatCard label="Sold listings" value={stats.soldListings} />
        <StatCard label="Suspended accounts" value={stats.suspendedUsers} />
        <StatCard label="Featured now" value={promotions.activeFeatured} hint={`${promotions.scheduledFeatured} scheduled`} />
      </div>

      <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Revenue: {revenue.note}</p>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-lg font-bold text-brand-navy">Recent activity</h2>
          <Link href="/admin/audit-logs" className="text-sm text-brand-purple hover:underline">Full audit log</Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-600">No administrator actions yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                <span className="font-medium">{entry.actor.name}</span> · {formatAction(entry.action)}
                <span className="block text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}