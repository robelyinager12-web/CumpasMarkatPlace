import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { Pagination } from '@/components/marketplace/Pagination'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ApiClientError } from '@/lib/api-client'
import { first, type RawParams } from '@/lib/search-params'
import { getSessionHeaders } from '@/lib/server-session'
import { listFavorites } from '@/services/favorites.service'

export const metadata: Metadata = { title: 'Favorites' }
export const dynamic = 'force-dynamic'

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams
  const page = Math.max(1, Number(first(params.page)) || 1)

  let result
  try {
    result = await listFavorites(page, await getSessionHeaders())
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) redirect('/auth/login?next=/favorites')
    throw error
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-navy">Your favorites</h1>
      {result.data.products.length > 0 ? (
        <>
          <ProductGrid products={result.data.products} />
          <Pagination page={result.meta?.page ?? 1} totalPages={result.meta?.totalPages ?? 1} basePath="/favorites" params={params} />
        </>
      ) : (
        <EmptyState
          title="No favorites yet"
          description="Tap the heart on any listing to save it here."
          action={{ href: '/marketplace', label: 'Browse the marketplace' }}
        />
      )}
    </main>
  )
}