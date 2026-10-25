'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminPager } from '@/components/admin/AdminPager'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { btnPrimary, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatAction, formatDateTime } from '@/lib/admin-format'
import { listAuditLogs } from '@/services/admin.service'
import type { AuditEntry } from '@/types/admin'

const ENTITY_TYPES = ['User', 'Product', 'ListingReport', 'Category', 'University', 'Campus', 'FeaturedListing']

export function AuditLogViewer() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['admin', 'audit', { action, entityType, page }],
    queryFn: () => listAuditLogs({ action, entityType, page }),
    placeholderData: keepPreviousData,
  })

  const columns: Column<AuditEntry>[] = [
    { header: 'When', cell: (entry) => formatDateTime(entry.createdAt) },
    {
      header: 'Who',
      cell: (entry) => (
        <>
          <p className="font-medium">{entry.actor.name}</p>
          <p className="text-xs text-slate-500">{entry.actor.email}</p>
        </>
      ),
    },
    { header: 'Action', cell: (entry) => formatAction(entry.action) },
    {
      header: 'Target',
      cell: (entry) => (
        <>
          {entry.entityType}
          {entry.entityId ? <span className="block break-all text-xs text-slate-500">{entry.entityId}</span> : null}
        </>
      ),
    },
    {
      header: 'Details',
      cell: (entry) =>
        entry.metadata ? (
          <details>
            <summary className="cursor-pointer text-xs text-brand-purple">Show</summary>
            <pre className="mt-1 max-w-xs overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2 text-xs">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </details>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Audit log</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setAction(search.trim())
          setPage(1)
        }}
        className="flex flex-wrap gap-3"
      >
        <label htmlFor="audit-action" className="sr-only">Action contains</label>
        <input id="audit-action" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Action, for example suspended" className={`${input} min-w-64 flex-1`} />
        <label htmlFor="audit-entity" className="sr-only">Target type</label>
        <select id="audit-entity" value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1) }} className={input}>
          <option value="">All targets</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button type="submit" className={btnPrimary}>Filter</button>
      </form>

      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load the audit log." /> : null}
      {query.data ? (
        <>
          <p className="text-sm text-slate-600" aria-live="polite">{query.data.meta?.total ?? 0} entries</p>
          <DataTable columns={columns} rows={query.data.data.logs} rowKey={(entry) => entry.id} empty="No entries match." />
          <AdminPager page={page} totalPages={query.data.meta?.totalPages ?? 1} onChange={setPage} />
        </>
      ) : null}
    </div>
  )
}