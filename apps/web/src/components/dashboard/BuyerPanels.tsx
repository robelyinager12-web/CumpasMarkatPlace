'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ReportList } from '@/components/dashboard/ReportHistory'
import { FormAlert } from '@/components/forms/FormFeedback'
import { ConversationItem } from '@/components/messaging/ConversationList'
import { ProductGrid } from '@/components/products/ProductGrid'
import { getBuyerDashboard } from '@/services/dashboard.service'

export function BuyerPanels() {
  const query = useQuery({ queryKey: ['dashboard', 'buyer'], queryFn: getBuyerDashboard })

  if (query.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError || !query.data) return <FormAlert message="Could not load your buying activity." />
  const { favorites, recentlyViewed, recentConversations, reports } = query.data

  return (
    <section className="space-y-8">
      <h2 className="text-xl font-bold text-brand-navy">Buying</h2>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-sm font-semibold text-slate-600">Recent conversations</h3>
          <Link href="/messages" className="text-sm text-brand-purple hover:underline">All messages</Link>
        </div>
        {recentConversations.length > 0 ? (
          <ul className="space-y-3">
            {recentConversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No conversations with sellers yet.</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-sm font-semibold text-slate-600">Favorites</h3>
          <Link href="/favorites" className="text-sm text-brand-purple hover:underline">See all</Link>
        </div>
        {favorites.length > 0 ? <ProductGrid products={favorites} /> : <p className="text-sm text-slate-600">Tap the heart on a listing to save it.</p>}
      </div>

      {recentlyViewed.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-600">Recently viewed</h3>
          <ProductGrid products={recentlyViewed} />
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-sm font-semibold text-slate-600">Your reports</h3>
          <Link href="/dashboard/reports" className="text-sm text-brand-purple hover:underline">History</Link>
        </div>
        <ReportList items={reports} />
      </div>
    </section>
  )
}