import type { Metadata } from 'next'
import Link from 'next/link'
import { ListingsTable } from '@/components/dashboard/ListingsTable'

export const metadata: Metadata = { title: 'My listings' }

export default function MyListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-navy">My listings</h1>
        <Link href="/sell/new" className="rounded-full bg-brand-purple px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
          New listing
        </Link>
      </div>
      <ListingsTable />
    </div>
  )
}