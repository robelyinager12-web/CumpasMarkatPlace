import type { University } from '@/types/user'

export function HeroSearch({ universities }: { universities: University[] }) {
  return (
    <form action="/marketplace" method="get" className="mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row">
      <label htmlFor="hero-q" className="sr-only">Search products</label>
      <input
        id="hero-q"
        name="q"
        placeholder="Search textbooks, laptops, clothes…"
        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900"
      />
      {universities.length > 0 ? (
        <>
          <label htmlFor="hero-university" className="sr-only">University</label>
          <select id="hero-university" name="universityId" className="rounded-xl border border-slate-200 px-3 py-3 text-slate-900">
            <option value="">All universities</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>{university.name}</option>
            ))}
          </select>
        </>
      ) : null}
      <button type="submit" className="rounded-xl bg-brand-purple px-6 py-3 font-semibold text-white hover:opacity-90">
        Search
      </button>
    </form>
  )
}