import type { Metadata } from 'next'
import { AccountOverview } from '@/components/dashboard/AccountOverview'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return <AccountOverview />
}