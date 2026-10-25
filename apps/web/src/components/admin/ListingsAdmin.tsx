'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { AdminPager } from '@/components/admin/AdminPager'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ReasonDialog } from '@/components/admin/ModerationActions'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatDateTime } from '@/lib/admin-format'
import { formatEtb } from '@/lib/format-currency'
import { thumbUrl } from '@/lib/images'
import { STATUS_LABEL } from '@/lib/product-labels'
import { listAdminProducts, setProductStatus } from '@/services/admin.service'
import type { AdminListing } from '@/types/admin'

const TONE = { ACTIVE: 'green', SOLD: 'slate', DRAFT: 'amber', ARCHIVED: 'slate', REMOVED: 'red' } as const

export function ListingsAdmin() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ listing: AdminListing; kind: 'remove' | 'restore' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'listings', { q, status, page }],
    queryFn: () => listAdminProducts({ q, status, page }),
    placeholderData: keepPreviousData,
  })

  const change = useMutation({
    mutationFn: (variables: { id: string; status: 'REMOVED' | 'ARCHIVED'; reason: string }) =>
      setProductStatus(variables.id, { status: variables.status, reason: variables.reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    onError: (err) => setError(errorText(err)),
  })

  const columns: Column<AdminListing>[] = [
    {
      header: 'Listing',
      cell: (listing) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {listing.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl(listing.image, 160)} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <Link href={`/products/${listing.id}`} className="font-medium text-brand-purple hover:underline">{listing.title}</Link>
            <p className="text-xs text-slate-500">{listing.category} · {formatEtb(listing.price)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Seller',
      cell: (listing) => (
        <>
          <p>{listing.seller.name}</p>
          <p className="text-xs text-slate-500">{listing.seller.email}</p>
          {listing.seller.suspended ? <StatusBadge tone="red">Suspended</StatusBadge> : null}
        </>
      ),
    },
    { header: 'Status', cell: (listing) => <StatusBadge tone={TONE[listing.status]}>{STATUS_LABEL[listing.status]}</StatusBadge> },
    { header: 'Saved', cell: (listing) => listing.favorites },
    { header: 'Reports', cell: (listing) => listing.reports },
    { header: 'Listed', cell: (listing) => formatDateTime(listing.createdAt) },
    {
      header: 'Actions',
      cell: (listing) =>
        listing.status === 'REMOVED' ? (
          <button type="button" className={btn} onClick={() => { setError(null); setDialog({ listing, kind: 'restore' }) }}>Restore</button>
        ) : (
          <button type="button" className={btnDanger} onClick={() => { setError(null); setDialog({ listing, kind: 'remove' }) }}>Remove</button>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Listings</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setQ(search.trim())
          setPage(1)
        }}
        className="flex flex-wrap gap-3"
      >
        <label htmlFor="listing-search" className="sr-only">Search listings</label>
        <input id="listing-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or seller" className={`${input} min-w-64 flex-1`} />
        <label htmlFor="listing-status" className="sr-only">Status</label>
        <select id="listing-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className={input}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className={btnPrimary}>Search</button>
      </form>

      <FormAlert message={error} />
      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load listings." /> : null}
      {query.data ? (
        <>
          <p className="text-sm text-slate-600" aria-live="polite">{query.data.meta?.total ?? 0} listings</p>
          <DataTable columns={columns} rows={query.data.data.products} rowKey={(listing) => listing.id} empty="No listings match your search." />
          <AdminPager page={page} totalPages={query.data.meta?.totalPages ?? 1} onChange={setPage} />
        </>
      ) : null}

      <ReasonDialog
        open={dialog !== null}
        title={dialog?.kind === 'remove' ? 'Remove this listing' : 'Restore this listing'}
        description={
          dialog?.kind === 'remove'
            ? `"${dialog.listing.title}" disappears from the marketplace and the seller is told why.`
            : `"${dialog?.listing.title ?? ''}" is restored as Archived. The seller decides whether to republish it.`
        }
        confirmLabel={dialog?.kind === 'remove' ? 'Remove listing' : 'Restore listing'}
        danger={dialog?.kind === 'remove'}
        onConfirm={(reason) =>
          change.mutateAsync({ id: dialog?.listing.id ?? '', status: dialog?.kind === 'remove' ? 'REMOVED' : 'ARCHIVED', reason })
        }
        onClose={() => setDialog(null)}
      />
    </div>
  )
}