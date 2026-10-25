import Link from 'next/link'
import { toHref, type RawParams } from '@/lib/search-params'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number
  totalPages: number
  basePath: string
  params: RawParams
}) {
  if (totalPages <= 1) return null

  const href = (target: number) => toHref(basePath, params, { page: target === 1 ? undefined : String(target) })
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index)
  const base = 'rounded-full border px-4 py-2 text-sm'

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(base, 'border-slate-300 bg-white hover:bg-slate-50')}>
          Previous
        </Link>
      ) : null}
      {pages.map((number) => (
        <Link
          key={number}
          href={href(number)}
          aria-current={number === page ? 'page' : undefined}
          className={cn(base, number === page ? 'border-brand-purple bg-brand-purple text-white' : 'border-slate-300 bg-white hover:bg-slate-50')}
        >
          {number}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(base, 'border-slate-300 bg-white hover:bg-slate-50')}>
          Next
        </Link>
      ) : null}
    </nav>
  )
}