import { ProductGridSkeleton } from '@/components/products/ProductSkeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200" />
      <ProductGridSkeleton count={8} />
    </main>
  )
}