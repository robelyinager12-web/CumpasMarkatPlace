import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContactSellerButton } from '@/components/products/ContactSellerButton'
import { FavoriteButton } from '@/components/products/FavoriteButton'
import { ProductGallery } from '@/components/products/ProductGallery'
import { RelatedProducts } from '@/components/products/RelatedProducts'
import { SellerCard } from '@/components/products/SellerCard'
import { formatEtb } from '@/lib/format-currency'
import { CONDITION_LABEL, STATUS_LABEL } from '@/lib/product-labels'
import { toApiQuery } from '@/lib/search-params'
import { getSessionHeaders } from '@/lib/server-session'
import { getProduct, listProducts } from '@/services/products.service'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id, await getSessionHeaders()).catch(() => null)
  return { title: product?.title ?? 'Listing' }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headers = await getSessionHeaders()
  const product = await getProduct(id, headers)
  if (!product) notFound()

  const related = await listProducts(
    toApiQuery({ category: product.category.slug, universityId: product.university.id }, { excludeId: product.id, pageSize: '4' }),
    headers,
  ).then(
    (result) => result.data.products,
    () => [],
  )

  const isActive = product.status === 'ACTIVE'

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {product.isOwner ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-purple/10 px-4 py-3 text-sm">
          <span>This is your listing. Status: <strong>{STATUS_LABEL[product.status]}</strong></span>
          <Link href={`/sell/${product.id}/edit`} className="font-semibold text-brand-purple hover:underline">Edit listing</Link>
        </div>
      ) : null}

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-brand-navy">{product.title}</h1>
            <FavoriteButton productId={product.id} initial={product.isFavorite} className="border border-slate-200" />
          </div>

          <p className="text-3xl font-bold text-brand-navy">
            {formatEtb(product.price)}
            {product.negotiable ? <span className="ml-3 text-sm font-medium text-brand-purple">Negotiable</span> : null}
          </p>

          {!isActive ? (
            <p className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {product.status === 'SOLD' ? 'This item has been sold.' : `Status: ${STATUS_LABEL[product.status]}`}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Condition</dt><dd className="font-medium">{CONDITION_LABEL[product.condition]}</dd></div>
            <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{product.category.name}</dd></div>
            <div><dt className="text-slate-500">Location</dt><dd className="font-medium">{product.campus ? `${product.campus.name}, ` : ''}{product.university.name}</dd></div>
            <div><dt className="text-slate-500">Available</dt><dd className="font-medium">{isActive ? `${product.quantity} in stock` : 'Not available'}</dd></div>
            <div><dt className="text-slate-500">Listed</dt><dd className="font-medium">{new Date(product.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</dd></div>
            <div><dt className="text-slate-500">Saved by</dt><dd className="font-medium">{product.favoritesCount}</dd></div>
          </dl>

          <section>
            <h2 className="mb-1 text-sm font-semibold text-slate-500">Description</h2>
            <p className="whitespace-pre-line text-slate-800">{product.description}</p>
          </section>

          <SellerCard seller={product.seller} />
          {!product.isOwner ? <ContactSellerButton /> : null}
          <p className="text-xs text-slate-500">
            Meet in a public place on campus and never pay in advance. UniKamp does not hold or transfer money.
          </p>
        </div>
      </div>

      <RelatedProducts products={related} />
    </main>
  )
}