import Link from 'next/link'
import { FavoriteButton } from '@/components/products/FavoriteButton'
import { formatEtb } from '@/lib/format-currency'
import { thumbUrl } from '@/lib/images'
import { CONDITION_LABEL } from '@/lib/product-labels'
import type { ProductSummary } from '@/types/product'

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] bg-slate-100">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl(product.image)} alt={product.title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
          )}
          {product.status === 'SOLD' ? (
            <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">Sold</span>
          ) : null}
        </div>
        <div className="space-y-1 p-4">
          <h3 className="line-clamp-2 font-semibold text-slate-900">{product.title}</h3>
          <p className="text-lg font-bold text-brand-navy">
            {formatEtb(product.price)}
            {product.negotiable ? <span className="ml-2 text-xs font-medium text-brand-purple">Negotiable</span> : null}
          </p>
          <p className="text-xs text-slate-500">
            {CONDITION_LABEL[product.condition]} · {product.campus?.name ?? product.university.name}
          </p>
        </div>
      </Link>
      <FavoriteButton productId={product.id} initial={product.isFavorite} className="absolute right-3 top-3" />
    </article>
  )
}