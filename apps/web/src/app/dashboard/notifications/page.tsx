import type { Metadata } from 'next'
import { NotificationsList } from '@/components/dashboard/NotificationsList'

export const metadata: Metadata = { title: 'Notifications' }

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Notifications</h1>
      <NotificationsList />
    </div>
  )
}