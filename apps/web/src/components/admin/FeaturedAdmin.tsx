'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { AdminPager } from '@/components/admin/AdminPager'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatDateTime } from '@/lib/admin-format'
import { formatEtb } from '@/lib/format-currency'
import { cn } from '@/lib/utils'
import { createFeatured, listAdminProducts, listFeatured, removeFeatured } from '@/services/admin.service'

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ended', label: 'Ended' },
]

export function FeaturedAdmin() {
  const queryClient = useQueryClient()
  const [state, setState] = useState('active')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [days, setDays] = useState(7)
  const [error, setError] = useState<string | null>(null)

  const featured = useQuery({
    queryKey: ['admin', 'featured', { state, page }],
    queryFn: () => listFeatured({ state, page }),
    placeholderData: keepPreviousData,
  })
  const results = useQuery({
    queryKey: ['admin', 'featured-search', submitted],
    queryFn: () => listAdminProducts({ q: submitted, status: 'ACTIVE', pageSize: 5 }),
    enabled: submitted.length >= 2,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  const add = useMutation({
    mutationFn: (productId: string) => createFeatured({ productId, days }),
    onSuccess: refresh,
    onError: (err) => setError(errorText(err)),
  })
  const remove = useMutation({ mutationFn: (id: string) => removeFeatured(id), onSuccess: refresh, onError: (err) => setError(errorText(err)) })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Featured listings</h1>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-brand-navy">Feature a listing</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(search.trim())
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1">
            <label htmlFor="feature-search" className="block text-sm font-medium">Find an active listing</label>
            <input id="feature-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or seller" className={input} />
          </div>
          <div className="space-y-1">
            <label htmlFor="feature-days" className="block text-sm font-medium">Days</label>
            <select id="feature-days" value={days} onChange={(event) => setDays(Number(event.target.value))} className={input}>
              {[3, 7, 14, 30].map((value) => (
                <option key={value} value={value}>{value} days</option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnPrimary}>Search</button>
        </form>
        {results.data ? (
          results.data.data.products.length === 0 ? (
            <p className="text-sm text-slate-600">No active listings found.</p>
          ) : (
            <ul className="space-y-2">
              {results.data.data.products.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex-1">{product.title} <span className="text-slate-500">· {formatEtb(product.price)} · {product.seller.name}</span></span>
                  <button type="button" className={btn} disabled={add.isPending} onClick={() => { setError(null); add.mutate(product.id) }}>
                    Feature for {days} days
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <FormAlert message={error} />

      <div role="tablist" aria-label="Featured state" className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={state === tab.value}
            onClick={() => { setState(tab.value); setPage(1) }}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium', state === tab.value ? 'bg-brand-purple text-white' : 'border border-slate-300 bg-white hover:bg-slate-50')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {featured.isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {featured.isError ? <FormAlert message="Could not load featured listings." /> : null}
      {featured.data && featured.data.data.featured.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Nothing here.</p>
      ) : null}
      <ul className="space-y-2">
        {featured.data?.data.featured.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm">
            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.product.id}`} className="font-medium text-brand-purple hover:underline">{item.product.title}</Link>
              <p className="text-xs text-slate-500">
                {item.product.sellerName} · {formatDateTime(item.startsAt)} to {formatDateTime(item.endsAt)}
              </p>
            </div>
            <StatusBadge tone={item.state === 'active' ? 'green' : item.state === 'scheduled' ? 'amber' : 'slate'}>{item.state}</StatusBadge>
            <button
              type="button"
              className={btnDanger}
              disabled={remove.isPending}
              onClick={() => {
                setError(null)
                if (window.confirm('Remove this featured period?')) remove.mutate(item.id)
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {featured.data ? <AdminPager page={page} totalPages={featured.data.meta?.totalPages ?? 1} onChange={setPage} /> : null}
    </div>
  )
}