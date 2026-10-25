import type { Metadata } from 'next'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { FilterSidebar } from '@/components/marketplace/FilterSidebar'
import { MobileFilters } from '@/components/marketplace/MobileFilters'
import { Pagination } from '@/components/marketplace/Pagination'
import { SortSelect } from '@/components/marketplace/SortSelect'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ApiClientError } from '@/lib/api-client'
import { first, toApiQuery, type RawParams } from '@/lib/search-params'
import { getSessionHeaders } from '@/lib/server-session'
import { listCategories } from '@/services/categories.service'
import { listProducts } from '@/services/products.service'
import { listCampuses, listUniversities } from '@/services/universities.service'

export const metadata: Metadata = { title: 'Marketplace' }
export const dynamic = 'force-dynamic'

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams
  const universityId = first(params.universityId)
  const headers = await getSessionHeaders()

  const [categories, universities, campuses, result] = await Promise.all([
    listCategories().catch(() => []),
    listUniversities().catch(() => []),
    universityId ? listCampuses(universityId).catch(() => []) : Promise.resolve([]),
    listProducts(toApiQuery(params), headers).then(
      (value) => ({ ok: true as const, ...value }),
      (error: unknown) => ({
        ok: false as const,
        message: error instanceof ApiClientError ? error.message : 'The marketplace is unavailable right now. Please try again.',
      }),
    ),
  ])

  const filters = (idPrefix: string) => (
    <FilterSidebar idPrefix={idPrefix} params={params} categories={categories} universities={universities} campuses={campuses} />
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-navy">Marketplace</h1>
      <MobileFilters>{filters('m')}</MobileFilters>
      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">{filters('d')}</aside>
        <section className="min-w-0 flex-1">
          {result.ok ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600" aria-live="polite">
                  {result.meta?.total ?? 0} {result.meta?.total === 1 ? 'listing' : 'listings'}
                </p>
                <SortSelect current={first(params.sort) ?? 'newest'} params={params} />
              </div>
              {result.data.products.length > 0 ? (
                <>
                  <ProductGrid products={result.data.products} />
                  <Pagination page={result.meta?.page ?? 1} totalPages={result.meta?.totalPages ?? 1} basePath="/marketplace" params={params} />
                </>
              ) : (
                <EmptyState
                  title="Nothing matches your search"
                  description="Try fewer filters or a different word, or list the item yourself."
                  action={{ href: '/marketplace', label: 'Clear filters' }}
                />
              )}
            </>
          ) : (
            <EmptyState title="We could not load listings" description={result.message} action={{ href: '/marketplace', label: 'Clear filters' }} />
          )}
        </section>
      </div>
    </main>
  )
}