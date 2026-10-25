'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { FormAlert } from '@/components/forms/FormFeedback'
import { ConversationItem } from '@/components/messaging/ConversationList'
import { getSellerDashboard } from '@/services/dashboard.service'

export function SellerStats() {
  const query = useQuery({ queryKey: ['dashboard', 'seller'], queryFn: getSellerDashboard })

  if (query.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError || !query.data) return <FormAlert message="Could not load your seller statistics." />
  const { stats, recentConversations } = query.data

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Selling</h2>
        <Link href="/sell/new" className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          New listing
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Active listings" value={stats.activeListings} />
        <StatCard label="Sold" value={stats.soldListings} />
        <StatCard label="Drafts" value={stats.draftListings} />
        <StatCard label="Times saved" value={stats.favoritesReceived} />
        <StatCard label="Views" value={stats.totalViews} hint={`${stats.viewsLast7Days} in the last 7 days`} />
      </div>
      {recentConversations.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-600">Recent buyer messages</h3>
          <ul className="space-y-3">
            {recentConversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}