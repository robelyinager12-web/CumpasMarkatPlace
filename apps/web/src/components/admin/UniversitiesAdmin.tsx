'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import {
  addCampus,
  createUniversity,
  deleteCampus,
  deleteUniversity,
  listAdminUniversities,
  renameCampus,
  updateUniversity,
} from '@/services/admin.service'
import type { AdminUniversity } from '@/types/admin'

function CampusAdder({ onAdd, disabled }: { onAdd: (name: string) => void; disabled: boolean }) {
  const [name, setName] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim()) {
          onAdd(name.trim())
          setName('')
        }
      }}
      className="flex gap-2"
    >
      <label className="sr-only" htmlFor="campus-name">Campus name</label>
      <input id="campus-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New campus name" className={`${input} flex-1`} />
      <button type="submit" disabled={disabled} className={btn}>Add campus</button>
    </form>
  )
}

export function UniversitiesAdmin() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['admin', 'universities'], queryFn: listAdminUniversities })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'universities'] })
  const onError = (err: unknown) => setError(errorText(err))

  const create = useMutation({
    mutationFn: () => createUniversity({ name: name.trim(), city: city.trim() || undefined }),
    onSuccess: () => {
      setName('')
      setCity('')
      void refresh()
    },
    onError,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; input: { name?: string; city?: string | null; isActive?: boolean } }) => updateUniversity(v.id, v.input),
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({ mutationFn: (id: string) => deleteUniversity(id), onSuccess: refresh, onError })
  const campusAdd = useMutation({ mutationFn: (v: { id: string; name: string }) => addCampus(v.id, v.name), onSuccess: refresh, onError })
  const campusRename = useMutation({ mutationFn: (v: { id: string; name: string }) => renameCampus(v.id, v.name), onSuccess: refresh, onError })
  const campusRemove = useMutation({ mutationFn: (id: string) => deleteCampus(id), onSuccess: refresh, onError })
  const busy = [create, update, remove, campusAdd, campusRename, campusRemove].some((mutation) => mutation.isPending)

  function renameUniversity(university: AdminUniversity) {
    const next = window.prompt('New name', university.name)?.trim()
    if (next && next !== university.name) {
      setError(null)
      update.mutate({ id: university.id, input: { name: next } })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Universities and campuses</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          create.mutate()
        }}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="space-y-1">
          <label htmlFor="uni-name" className="block text-sm font-medium">University name</label>
          <input id="uni-name" value={name} onChange={(event) => setName(event.target.value)} className={input} required minLength={2} />
        </div>
        <div className="space-y-1">
          <label htmlFor="uni-city" className="block text-sm font-medium">City (optional)</label>
          <input id="uni-city" value={city} onChange={(event) => setCity(event.target.value)} className={input} />
        </div>
        <button type="submit" disabled={busy} className={btnPrimary}>Add university</button>
      </form>

      <FormAlert message={error} />
      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load universities." /> : null}

      <ul className="space-y-4">
        {query.data?.map((university) => (
          <li key={university.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-900">{university.name}</p>
                <p className="text-xs text-slate-500">
                  {university.city ? `${university.city} · ` : ''}{university.users} users · {university.listings} listings
                </p>
              </div>
              <StatusBadge tone={university.isActive ? 'green' : 'slate'}>{university.isActive ? 'Active' : 'Inactive'}</StatusBadge>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn} disabled={busy} onClick={() => renameUniversity(university)}>Rename</button>
                <button type="button" className={btn} disabled={busy} onClick={() => { setError(null); update.mutate({ id: university.id, input: { isActive: !university.isActive } }) }}>
                  {university.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className={btnDanger}
                  disabled={busy}
                  onClick={() => {
                    setError(null)
                    if (window.confirm(`Delete "${university.name}" and its campuses?`)) remove.mutate(university.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <ul className="space-y-1 border-t border-slate-100 pt-3">
              {university.campuses.length === 0 ? <li className="text-slate-500">No campuses yet.</li> : null}
              {university.campuses.map((campus) => (
                <li key={campus.id} className="flex flex-wrap items-center gap-3">
                  <span className="flex-1">{campus.name} <span className="text-xs text-slate-500">({campus.users} users, {campus.listings} listings)</span></span>
                  <button
                    type="button"
                    className={btn}
                    disabled={busy}
                    onClick={() => {
                      const next = window.prompt('New campus name', campus.name)?.trim()
                      if (next && next !== campus.name) {
                        setError(null)
                        campusRename.mutate({ id: campus.id, name: next })
                      }
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={btnDanger}
                    disabled={busy}
                    onClick={() => {
                      setError(null)
                      if (window.confirm(`Delete the campus "${campus.name}"?`)) campusRemove.mutate(campus.id)
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <CampusAdder disabled={busy} onAdd={(campusName) => { setError(null); campusAdd.mutate({ id: university.id, name: campusName }) }} />
          </li>
        ))}
      </ul>
    </div>
  )
}