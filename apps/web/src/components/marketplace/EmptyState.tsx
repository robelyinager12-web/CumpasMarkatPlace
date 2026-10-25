import Link from 'next/link'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {action ? (
        <Link href={action.href} className="mt-4 inline-block rounded-full bg-brand-purple px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}