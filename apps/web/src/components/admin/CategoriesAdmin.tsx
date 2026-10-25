'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  moveCategory,
  updateCategory,
} from '@/services/admin.service'
import type { AdminCategory } from '@/types/admin'

export function CategoriesAdmin() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: listAdminCategories })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
  const onError = (err: unknown) => setError(errorText(err))

  const create = useMutation({
    mutationFn: () => createCategory({ name: name.trim(), slug: slug.trim() || undefined }),
    onSuccess: () => {
      setName('')
      setSlug('')
      void refresh()
    },
    onError,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; input: { name?: string; isActive?: boolean } }) => updateCategory(v.id, v.input),
    onSuccess: refresh,
    onError,
  })
  const move = useMutation({ mutationFn: (v: { id: string; direction: 'up' | 'down' }) => moveCategory(v.id, v.direction), onSuccess: refresh, onError })
  const remove = useMutation({ mutationFn: (id: string) => deleteCategory(id), onSuccess: refresh, onError })
  const busy = create.isPending || update.isPending || move.isPending || remove.isPending

  function rename(category: AdminCategory) {
    const next = window.prompt('New name', category.name)?.trim()
    if (next && next !== category.name) {
      setError(null)
      update.mutate({ id: category.id, input: { name: next } })
    }
  }

  const categories = query.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Categories</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          create.mutate()
        }}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="space-y-1">
          <label htmlFor="cat-name" className="block text-sm font-medium">Name</label>
          <input id="cat-name" value={name} onChange={(event) => setName(event.target.value)} className={input} required minLength={2} />
        </div>
        <div className="space-y-1">
          <label htmlFor="cat-slug" className="block text-sm font-medium">Slug (optional)</label>
          <input id="cat-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="auto from name" className={input} />
        </div>
        <button type="submit" disabled={busy} className={btnPrimary}>Add category</button>
        <p className="w-full text-xs text-slate-500">Names that are not in Latin letters need a slug typed in by hand (letters, numbers and dashes).</p>
      </form>

      <FormAlert message={error} />
      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load categories." /> : null}

      <ul className="space-y-2">
        {categories.map((category, index) => (
          <li key={category.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{category.name}</p>
              <p className="text-xs text-slate-500">/{category.slug} · {category.listings} listing{category.listings === 1 ? '' : 's'}</p>
            </div>
            <StatusBadge tone={category.isActive ? 'green' : 'slate'}>{category.isActive ? 'Active' : 'Inactive'}</StatusBadge>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn} disabled={busy || index === 0} onClick={() => { setError(null); move.mutate({ id: category.id, direction: 'up' }) }} aria-label={`Move ${category.name} up`}>↑</button>
              <button type="button" className={btn} disabled={busy || index === categories.length - 1} onClick={() => { setError(null); move.mutate({ id: category.id, direction: 'down' }) }} aria-label={`Move ${category.name} down`}>↓</button>
              <button type="button" className={btn} disabled={busy} onClick={() => rename(category)}>Rename</button>
              <button type="button" className={btn} disabled={busy} onClick={() => { setError(null); update.mutate({ id: category.id, input: { isActive: !category.isActive } }) }}>
                {category.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                className={btnDanger}
                disabled={busy}
                onClick={() => {
                  setError(null)
                  if (window.confirm(`Delete "${category.name}"? This cannot be undone.`)) remove.mutate(category.id)
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Changes can take up to 5 minutes to appear on the public site.</p>
    </div>
  )
}