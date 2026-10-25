import type { Metadata } from 'next'
import { ListingsAdmin } from '@/components/admin/ListingsAdmin'

export const metadata: Metadata = { title: 'Listings | Admin' }

export default function AdminListingsPage() {
  return <ListingsAdmin />
}