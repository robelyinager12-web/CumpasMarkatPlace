import type { Metadata } from 'next'
import { ReportsAdmin } from '@/components/admin/ReportsAdmin'

export const metadata: Metadata = { title: 'Reports | Admin' }

export default function AdminReportsPage() {
  return <ReportsAdmin />
}