import { ProductGrid } from '@/components/products/ProductGrid'
import type { ProductSummary } from '@/types/product'

export function RelatedProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-brand-navy">Related products</h2>
      <ProductGrid products={products} />
    </section>
  )
}