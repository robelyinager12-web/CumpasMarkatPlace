'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { ReasonDialog } from '@/components/admin/ModerationActions'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, errorText } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatDateTime } from '@/lib/admin-format'
import { REPORT_REASON_LABEL } from '@/lib/report-labels'
import { cn } from '@/lib/utils'
import { listAdminReports, reviewReport } from '@/services/admin.service'
import type { AdminReport } from '@/types/admin'

const TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWING', label: 'Reviewing' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

type DialogKind = 'resolve' | 'resolveRemove' | 'dismiss'

export function ReportsAdmin() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('PENDING')
  const [dialog, setDialog] = useState<{ report: AdminReport; kind: DialogKind } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['admin', 'reports', status], queryFn: () => listAdminReports(status) })
  const review = useMutation({
    mutationFn: (variables: { id: string; status: 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; resolution?: string; removeListing?: boolean }) =>
      reviewReport(variables.id, { status: variables.status, resolution: variables.resolution, removeListing: variables.removeListing }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    onError: (err) => setError(errorText(err)),
  })

  const confirm = (resolution: string) => {
    if (!dialog) return Promise.resolve()
    return review.mutateAsync({
      id: dialog.report.id,
      status: dialog.kind === 'dismiss' ? 'DISMISSED' : 'RESOLVED',
      resolution: resolution || undefined,
      removeListing: dialog.kind === 'resolveRemove',
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Reports</h1>
      <div role="tablist" aria-label="Report status" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium', status === tab.value ? 'bg-brand-purple text-white' : 'border border-slate-300 bg-white hover:bg-slate-50')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FormAlert message={error} />
      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load reports." /> : null}
      {query.data && query.data.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No reports here.</p> : null}

      <ul className="space-y-3">
        {query.data?.map((report) => {
          const open = report.status === 'PENDING' || report.status === 'REVIEWING'
          return (
            <li key={report.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="amber">{REPORT_REASON_LABEL[report.reason] ?? report.reason}</StatusBadge>
                <span className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</span>
              </div>
              {report.product ? (
                <p>
                  Listing:{' '}
                  <Link href={`/products/${report.product.id}`} className="font-medium text-brand-purple hover:underline">{report.product.title}</Link>{' '}
                  <span className="text-slate-500">by {report.product.seller.fullName} ({report.product.status.toLowerCase()})</span>
                </p>
              ) : null}
              {report.reportedUser ? (
                <p>
                  User:{' '}
                  <Link href={`/admin/users`} className="font-medium text-brand-purple hover:underline">{report.reportedUser.fullName}</Link>{' '}
                  <span className="text-slate-500">{report.reportedUser.email}</span>
                </p>
              ) : null}
              <p className="text-slate-500">Reported by {report.reporter.fullName} ({report.reporter.email})</p>
              {report.details ? <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-slate-800">{report.details}</p> : null}
              {report.resolution ? <p className="text-slate-600">Outcome: {report.resolution}</p> : null}

              {open ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {report.status === 'PENDING' ? (
                    <button type="button" className={btn} disabled={review.isPending} onClick={() => { setError(null); review.mutate({ id: report.id, status: 'REVIEWING' }) }}>
                      Start review
                    </button>
                  ) : null}
                  <button type="button" className={btn} onClick={() => { setError(null); setDialog({ report, kind: 'resolve' }) }}>Resolve</button>
                  {report.product && report.product.status !== 'REMOVED' ? (
                    <button type="button" className={btnDanger} onClick={() => { setError(null); setDialog({ report, kind: 'resolveRemove' }) }}>
                      Resolve and remove listing
                    </button>
                  ) : null}
                  <button type="button" className={btn} onClick={() => { setError(null); setDialog({ report, kind: 'dismiss' }) }}>Dismiss</button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <ReasonDialog
        open={dialog !== null}
        title={dialog?.kind === 'dismiss' ? 'Dismiss this report' : dialog?.kind === 'resolveRemove' ? 'Resolve and remove the listing' : 'Resolve this report'}
        description="The reporter is notified of the outcome. Your note is saved with the report and in the audit log."
        confirmLabel={dialog?.kind === 'dismiss' ? 'Dismiss report' : 'Resolve report'}
        minLength={0}
        danger={dialog?.kind === 'resolveRemove'}
        onConfirm={confirm}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}