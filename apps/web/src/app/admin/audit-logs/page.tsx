import type { Metadata } from 'next'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'

export const metadata: Metadata = { title: 'Audit log | Admin' }

export default function AdminAuditLogsPage() {
  return <AuditLogViewer />
}