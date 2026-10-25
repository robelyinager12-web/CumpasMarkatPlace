import Link from 'next/link'
import { CategoryShortcuts } from '@/components/marketplace/CategoryShortcuts'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { HeroSearch } from '@/components/marketplace/HeroSearch'
import { ProductGrid } from '@/components/products/ProductGrid'
import { toApiQuery } from '@/lib/search-params'
import { getSessionHeaders } from '@/lib/server-session'
import { listCategories } from '@/services/categories.service'
import { listProducts } from '@/services/products.service'
import { listUniversities } from '@/services/universities.service'

export const dynamic = 'force-dynamic'

// The landing page must still render when the API is unreachable
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export default async function HomePage() {
  const headers = await getSessionHeaders()
  const [categories, universities, featured, recent] = await Promise.all([
    safe(listCategories(), []),
    safe(listUniversities(), []),
    safe(listProducts(toApiQuery({}, { featured: 'true', pageSize: '4' }), headers), null),
    safe(listProducts(toApiQuery({}, { pageSize: '8' }), headers), null),
  ])
  const featuredProducts = featured?.data.products ?? []
  const recentProducts = recent?.data.products ?? []

  return (
    <main>
      <section className="bg-brand-navy px-6 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Buy Smart. Sell Easy. Campus Life Made Affordable.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Find textbooks, laptops, clothes and dorm essentials from students on your campus.
          </p>
          <HeroSearch universities={universities} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketplace" className="rounded-full bg-brand-purple px-6 py-3 font-semibold hover:opacity-90">Explore Marketplace</Link>
            <Link href="/sell/new" className="rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">Start Selling</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-6 py-12">
        <section>
          <h2 className="mb-4 text-xl font-bold text-brand-navy">Shop by category</h2>
          <CategoryShortcuts categories={categories} />
        </section>

        {featuredProducts.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-bold text-brand-navy">Featured products</h2>
            <ProductGrid products={featuredProducts} />
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold text-brand-navy">Recently listed</h2>
            <Link href="/marketplace" className="text-sm font-medium text-brand-purple hover:underline">See all</Link>
          </div>
          {recentProducts.length > 0 ? (
            <ProductGrid products={recentProducts} />
          ) : (
            <EmptyState
              title="No listings yet"
              description="Be the first to sell something on your campus."
              action={{ href: '/sell/new', label: 'Create a listing' }}
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-brand-navy">How UniKamp works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              ['1. Create an account', 'Sign up with your email and choose your university and campus.'],
              ['2. Post or browse', 'List what you no longer need, or search for what you need for less.'],
              ['3. Meet on campus', 'Agree on a price and arrange a safe, local exchange. UniKamp does not handle payments.'],
            ].map(([title, text]) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-brand-navy">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 rounded-2xl bg-white p-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Why sell on UniKamp</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Free to list while we grow with your campus.</li>
              <li>Reach students who are already nearby.</li>
              <li>Manage listings and see how many people saved them.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Trust and safety</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Meet in public campus places, in daylight where possible.</li>
              <li>Never pay in advance or share verification codes.</li>
              <li>A &quot;Verified student&quot; badge appears only after an administrator confirms it. Listings are not checked before they appear, so use your judgement.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}