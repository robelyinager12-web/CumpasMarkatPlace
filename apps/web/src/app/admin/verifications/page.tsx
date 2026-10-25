import type { Metadata } from 'next'
import { VerificationsAdmin } from '@/components/admin/VerificationsAdmin'

export const metadata: Metadata = { title: 'Student verification | Admin' }

export default function AdminVerificationsPage() {
  return <VerificationsAdmin />
}