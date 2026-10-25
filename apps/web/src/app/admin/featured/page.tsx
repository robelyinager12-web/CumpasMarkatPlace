import type { Metadata } from 'next'
import { FeaturedAdmin } from '@/components/admin/FeaturedAdmin'

export const metadata: Metadata = { title: 'Featured | Admin' }

export default function AdminFeaturedPage() {
  return <FeaturedAdmin />
}