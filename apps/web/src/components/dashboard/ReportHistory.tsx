'use client'

import { useQuery } from '@tanstack/react-query'
import { FormAlert } from '@/components/forms/FormFeedback'
import { REPORT_REASON_LABEL, REPORT_STATUS_LABEL } from '@/lib/report-labels'
import { listMyReports } from '@/services/reports.service'
import type { ReportItem } from '@/types/dashboard'

export function ReportList({ items }: { items: ReportItem[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-600">You have not reported anything.</p>
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
          <p className="font-medium text-slate-900">
            {item.type === 'LISTING' ? 'Listing' : 'User'}: {item.target}
          </p>
          <p className="text-slate-600">
            {REPORT_REASON_LABEL[item.reason] ?? item.reason} · {REPORT_STATUS_LABEL[item.status]} ·{' '}
            {new Date(item.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function ReportHistory() {
  const query = useQuery({ queryKey: ['my-reports'], queryFn: listMyReports })
  if (query.isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError) return <FormAlert message="Could not load your reports." />
  return <ReportList items={query.data ?? []} />
}