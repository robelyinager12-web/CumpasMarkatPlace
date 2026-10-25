import type { Metadata } from 'next'
import { DashboardOverview } from '@/components/admin/DashboardOverview'

export const metadata: Metadata = { title: 'Admin dashboard' }

export default function AdminDashboardPage() {
  return <DashboardOverview />
}