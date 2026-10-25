'use client'

import { useRouter } from 'next/navigation'
import { toHref, type RawParams } from '@/lib/search-params'

export function SortSelect({ current, params }: { current: string; params: RawParams }) {
  const router = useRouter()
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Sort by
      <select
        value={current}
        onChange={(event) =>
          router.push(toHref('/marketplace', params, { sort: event.target.value === 'newest' ? undefined : event.target.value, page: undefined }))
        }
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Lowest price</option>
        <option value="price_desc">Highest price</option>
      </select>
    </label>
  )
}