import { BadgeCheck } from 'lucide-react'
import type { ProductDetail } from '@/types/product'

export function SellerCard({ seller }: { seller: ProductDetail['seller'] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-500">Seller</h2>
      <p className="mt-1 flex items-center gap-2 font-semibold text-brand-navy">
        {seller.name}
        {/* shown only after an administrator has actually approved the student */}
        {seller.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified student
          </span>
        ) : null}
      </p>
      <p className="text-sm text-slate-600">{seller.university}</p>
      <p className="text-xs text-slate-500">
        Member since {new Date(seller.memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
      </p>
    </section>
  )
}