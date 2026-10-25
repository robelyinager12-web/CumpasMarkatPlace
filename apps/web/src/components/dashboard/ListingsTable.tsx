'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatEtb } from '@/lib/format-currency'
import { thumbUrl } from '@/lib/images'
import { STATUS_LABEL } from '@/lib/product-labels'
import { deleteProduct, listMyProducts, updateProduct } from '@/services/products.service'

const action = 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50'

export function ListingsTable() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['my-products'], queryFn: listMyProducts })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-products'] })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateProduct(id, { status }),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: refresh })

  const error = changeStatus.error ?? remove.error
  const busy = changeStatus.isPending || remove.isPending

  if (query.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError) return <FormAlert message="Could not load your listings. Please refresh the page." />
  const products = query.data ?? []

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-600">You have not listed anything yet.</p>
        <Link href="/sell/new" className="mt-3 inline-block rounded-full bg-brand-purple px-5 py-2 text-sm font-semibold text-white">
          Create your first listing
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FormAlert message={error instanceof Error ? error.message : null} />
      <ul className="space-y-3">
        {products.map((product) => (
          <li key={product.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(product.image, 300)} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{product.title}</p>
              <p className="text-sm text-slate-600">
                {formatEtb(product.price)} · {STATUS_LABEL[product.status]} · {product.favoritesCount} saved
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.status === 'ACTIVE' || product.status === 'SOLD' ? (
                <Link href={`/products/${product.id}`} className={action}>View</Link>
              ) : null}
              {product.status !== 'REMOVED' ? <Link href={`/sell/${product.id}/edit`} className={action}>Edit</Link> : null}
              {product.status === 'DRAFT' ? (
                <button disabled={busy} className={action} onClick={() => changeStatus.mutate({ id: product.id, status: 'ACTIVE' })}>Publish</button>
              ) : null}
              {product.status === 'ACTIVE' ? (
                <button disabled={busy} className={action} onClick={() => changeStatus.mutate({ id: product.id, status: 'SOLD' })}>Mark as sold</button>
              ) : null}
              {product.status === 'SOLD' || product.status === 'ARCHIVED' ? (
                <button disabled={busy} className={action} onClick={() => changeStatus.mutate({ id: product.id, status: 'ACTIVE' })}>
                  {product.status === 'SOLD' ? 'Relist' : 'Restore'}
                </button>
              ) : null}
              {product.status === 'ACTIVE' || product.status === 'SOLD' || product.status === 'DRAFT' ? (
                <button disabled={busy} className={action} onClick={() => changeStatus.mutate({ id: product.id, status: 'ARCHIVED' })}>Archive</button>
              ) : null}
              {product.status !== 'REMOVED' ? (
                <button
                  disabled={busy}
                  className={`${action} text-red-700`}
                  onClick={() => {
                    if (window.confirm(`Delete "${product.title}" permanently?`)) remove.mutate(product.id)
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}