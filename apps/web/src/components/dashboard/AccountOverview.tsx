'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormAlert } from '@/components/forms/FormFeedback'
import { ME_KEY, useAuth } from '@/hooks/useAuth'
import { requestStudentVerification, resendVerification } from '@/services/auth.service'
import type { VerificationStatus } from '@/types/user'

const STATUS_LABEL: Record<VerificationStatus, string> = {
  UNVERIFIED: 'Not verified',
  PENDING: 'Pending review',
  VERIFIED: 'Verified student',
  REJECTED: 'Not approved',
}

const buttonClass = 'rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60'

export function AccountOverview() {
  const { user, isLoading } = useAuth()
  const queryClient = useQueryClient()
  const resend = useMutation({ mutationFn: resendVerification })
  const requestVerification = useMutation({
    mutationFn: () => requestStudentVerification(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  })

  if (isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <p className="text-slate-600">Please log in to see your account.</p>

  const canRequest = user.emailVerified && (user.studentVerification === 'UNVERIFIED' || user.studentVerification === 'REJECTED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Welcome, {user.fullName}</h1>
        <p className="text-slate-600">
          {user.university.name}
          {user.campus ? ` · ${user.campus.name}` : ''}
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-brand-navy">Email</h2>
        <p className="text-sm text-slate-600">
          {user.email} — {user.emailVerified ? 'verified' : 'not verified yet'}
        </p>
        {!user.emailVerified ? (
          <>
            <button onClick={() => resend.mutate()} disabled={resend.isPending} className={buttonClass}>
              {resend.isPending ? 'Sending…' : 'Send verification email'}
            </button>
            <FormAlert tone="success" message={resend.isSuccess ? 'Verification email sent. Check your inbox.' : null} />
            <FormAlert message={resend.error instanceof Error ? resend.error.message : null} />
          </>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-brand-navy">Student verification</h2>
        <p className="text-sm text-slate-600">Status: {STATUS_LABEL[user.studentVerification]}</p>
        {user.studentVerification === 'REJECTED' ? (
          <p className="text-sm text-slate-600">Your last request was not approved. You can request again.</p>
        ) : null}
        {!user.emailVerified ? <p className="text-sm text-slate-500">Verify your email first to request student verification.</p> : null}
        {canRequest ? (
          <button onClick={() => requestVerification.mutate()} disabled={requestVerification.isPending} className={buttonClass}>
            {requestVerification.isPending ? 'Sending…' : 'Request student verification'}
          </button>
        ) : null}
        <FormAlert message={requestVerification.error instanceof Error ? requestVerification.error.message : null} />
      </section>
    </div>
  )
}