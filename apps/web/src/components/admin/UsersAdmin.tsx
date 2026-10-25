'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminPager } from '@/components/admin/AdminPager'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ReasonDialog } from '@/components/admin/ModerationActions'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { btn, btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatDateTime } from '@/lib/admin-format'
import { listAdminUsers, setUserStatus } from '@/services/admin.service'
import type { AdminUser } from '@/types/admin'

export function UsersAdmin() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'users', { q, status, page }],
    queryFn: () => listAdminUsers({ q, status, page }),
    placeholderData: keepPreviousData,
  })

  const change = useMutation({
    mutationFn: (variables: { id: string; status: 'ACTIVE' | 'SUSPENDED'; reason?: string }) =>
      setUserStatus(variables.id, { status: variables.status, reason: variables.reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    onError: (err) => setError(errorText(err)),
  })

  const columns: Column<AdminUser>[] = [
    {
      header: 'User',
      cell: (user) => (
        <>
          <p className="font-medium text-slate-900">{user.fullName}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </>
      ),
    },
    { header: 'University', cell: (user) => `${user.university}${user.campus ? ` · ${user.campus}` : ''}` },
    {
      header: 'Status',
      cell: (user) => (
        <div className="space-y-1">
          <StatusBadge tone={user.status === 'ACTIVE' ? 'green' : 'red'}>{user.status === 'ACTIVE' ? 'Active' : 'Suspended'}</StatusBadge>
          {user.role === 'ADMIN' ? <StatusBadge tone="purple">Admin</StatusBadge> : null}
        </div>
      ),
    },
    { header: 'Email', cell: (user) => (user.emailVerified ? 'Verified' : 'Not verified') },
    { header: 'Student', cell: (user) => user.studentVerification.toLowerCase() },
    { header: 'Listings', cell: (user) => user.listings },
    { header: 'Joined', cell: (user) => formatDateTime(user.createdAt) },
    {
      header: 'Actions',
      cell: (user) =>
        user.role === 'ADMIN' ? null : user.status === 'ACTIVE' ? (
          <button type="button" className={btnDanger} onClick={() => { setError(null); setTarget(user) }}>
            Suspend
          </button>
        ) : (
          <button
            type="button"
            className={btn}
            disabled={change.isPending}
            onClick={() => {
              setError(null)
              if (window.confirm(`Restore ${user.fullName}'s account?`)) change.mutate({ id: user.id, status: 'ACTIVE' })
            }}
          >
            Restore
          </button>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Users</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setQ(search.trim())
          setPage(1)
        }}
        className="flex flex-wrap gap-3"
      >
        <label htmlFor="user-search" className="sr-only">Search users</label>
        <input id="user-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" className={`${input} min-w-64 flex-1`} />
        <label htmlFor="user-status" className="sr-only">Status</label>
        <select id="user-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className={input}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button type="submit" className={btnPrimary}>Search</button>
      </form>

      <FormAlert message={error} />
      {query.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : null}
      {query.isError ? <FormAlert message="Could not load users." /> : null}
      {query.data ? (
        <>
          <p className="text-sm text-slate-600" aria-live="polite">{query.data.meta?.total ?? 0} users</p>
          <DataTable columns={columns} rows={query.data.data.users} rowKey={(user) => user.id} empty="No users match your search." />
          <AdminPager page={page} totalPages={query.data.meta?.totalPages ?? 1} onChange={setPage} />
        </>
      ) : null}

      <ReasonDialog
        open={target !== null}
        title={`Suspend ${target?.fullName ?? ''}`}
        description="They will be signed out at once, cannot log in, and their listings are hidden. The reason is saved in the audit log."
        confirmLabel="Suspend account"
        danger
        onConfirm={(reason) => change.mutateAsync({ id: target?.id ?? '', status: 'SUSPENDED', reason })}
        onClose={() => setTarget(null)}
      />
    </div>
  )
}