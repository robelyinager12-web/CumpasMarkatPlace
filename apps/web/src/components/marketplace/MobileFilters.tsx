export function MobileFilters({ children }: { children: React.ReactNode }) {
  return (
    <details className="mb-4 rounded-2xl border border-slate-200 bg-white lg:hidden">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-navy">Filters</summary>
      <div className="border-t border-slate-200 p-4">{children}</div>
    </details>
  )
}