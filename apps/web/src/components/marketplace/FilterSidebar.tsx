'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CONDITIONS, CONDITION_LABEL } from '@/lib/product-labels'
import { conditionsOf, first, type RawParams } from '@/lib/search-params'
import type { Category } from '@/types/product'
import type { Campus, University } from '@/types/user'

const control = 'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm'

export function FilterSidebar({
  idPrefix,
  params,
  categories,
  universities,
  campuses,
}: {
  idPrefix: string
  params: RawParams
  categories: Category[]
  universities: University[]
  campuses: Campus[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const selected = conditionsOf(params)
  const id = (name: string) => `${idPrefix}-${name}`

  // Works without JavaScript as a plain GET form. With JavaScript it builds a clean URL (no empty values).
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const search = new URLSearchParams()
    for (const key of ['q', 'category', 'minPrice', 'maxPrice', 'universityId', 'campusId', 'sort']) {
      const value = String(data.get(key) ?? '').trim()
      if (value) search.set(key, value)
    }
    const conditions = data.getAll('condition').map(String)
    if (conditions.length > 0) search.set('condition', conditions.join(','))
    const query = search.toString()
    router.push(query ? `/marketplace?${query}` : '/marketplace')
  }

  function changeUniversity() {
    const campus = formRef.current?.elements.namedItem('campusId')
    if (campus instanceof HTMLSelectElement) campus.value = ''
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} method="get" action="/marketplace" onSubmit={submit} className="space-y-4">
      <input type="hidden" name="sort" value={first(params.sort) ?? ''} />

      <div>
        <label htmlFor={id('q')} className="mb-1 block text-sm font-medium">Search</label>
        <input id={id('q')} name="q" defaultValue={first(params.q) ?? ''} placeholder="Title or description" className={control} />
      </div>

      <div>
        <label htmlFor={id('category')} className="mb-1 block text-sm font-medium">Category</label>
        <select id={id('category')} name="category" defaultValue={first(params.category) ?? ''} className={control}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Price (ETB)</legend>
        <div className="flex gap-2">
          <input aria-label="Minimum price" name="minPrice" type="number" min="0" inputMode="decimal" placeholder="Min" defaultValue={first(params.minPrice) ?? ''} className={control} />
          <input aria-label="Maximum price" name="maxPrice" type="number" min="0" inputMode="decimal" placeholder="Max" defaultValue={first(params.maxPrice) ?? ''} className={control} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Condition</legend>
        <div className="space-y-1">
          {CONDITIONS.map((condition) => (
            <label key={condition} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="condition" value={condition} defaultChecked={selected.includes(condition)} />
              {CONDITION_LABEL[condition]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={id('university')} className="mb-1 block text-sm font-medium">University</label>
        <select id={id('university')} name="universityId" defaultValue={first(params.universityId) ?? ''} onChange={changeUniversity} className={control}>
          <option value="">All universities</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>{university.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id('campus')} className="mb-1 block text-sm font-medium">Campus</label>
        <select id={id('campus')} name="campusId" defaultValue={first(params.campusId) ?? ''} disabled={campuses.length === 0} className={control}>
          <option value="">{campuses.length === 0 ? 'Choose a university first' : 'All campuses'}</option>
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>{campus.name}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="w-full rounded-full bg-brand-purple px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
        Apply filters
      </button>
      <a href="/marketplace" className="block text-center text-sm text-slate-600 hover:text-brand-purple">Clear all</a>
    </form>
  )
}