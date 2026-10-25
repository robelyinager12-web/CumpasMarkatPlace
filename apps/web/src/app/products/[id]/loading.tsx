export default function Loading() {
  return (
    <main className="mx-auto grid max-w-6xl animate-pulse gap-8 px-6 py-8 md:grid-cols-2">
      <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded bg-slate-200" />
        <div className="h-6 w-1/4 rounded bg-slate-200" />
        <div className="h-24 rounded bg-slate-200" />
      </div>
    </main>
  )
}