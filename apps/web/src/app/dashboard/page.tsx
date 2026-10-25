import type { Metadata } from 'next'
import { AccountOverview } from '@/components/dashboard/AccountOverview'
import { BuyerPanels } from '@/components/dashboard/BuyerPanels'
import { SellerStats } from '@/components/dashboard/SellerStats'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <AccountOverview />
      <SellerStats />
      <BuyerPanels />
    </div>
  )
}