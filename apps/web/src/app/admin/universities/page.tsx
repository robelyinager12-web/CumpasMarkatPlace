import type { Metadata } from 'next'
import { UniversitiesAdmin } from '@/components/admin/UniversitiesAdmin'

export const metadata: Metadata = { title: 'Universities | Admin' }

export default function AdminUniversitiesPage() {
  return <UniversitiesAdmin />
}