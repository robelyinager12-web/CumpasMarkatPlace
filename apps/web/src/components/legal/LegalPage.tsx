import { LEGAL_REVIEWED, LEGAL_UPDATED } from '@/lib/legal'

export function LegalPage({ title, legal = false, children }: { title: string; legal?: boolean; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
      {legal ? <p className="mt-1 text-sm text-slate-600">Last updated {LEGAL_UPDATED}</p> : null}
      {legal && !LEGAL_REVIEWED ? (
        <p role="note" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Draft: this text has not yet been reviewed by a lawyer and may change before UniKamp opens to everyone.
        </p>
      ) : null}
      <div className="mt-8 space-y-8">{children}</div>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-brand-navy">{title}</h2>
      <div className="space-y-2 text-slate-700">{children}</div>
    </section>
  )
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}