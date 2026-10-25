import type { Metadata } from 'next'
import { ReportHistory } from '@/components/dashboard/ReportHistory'

export const metadata: Metadata = { title: 'Your reports' }

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Your reports</h1>
      <p className="text-sm text-slate-600">Reports are private. This is the status of the ones you sent.</p>
      <ReportHistory />
    </div>
  )
}