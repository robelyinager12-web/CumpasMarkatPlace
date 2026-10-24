'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { FormAlert } from '@/components/forms/FormFeedback'
import { ME_KEY } from '@/hooks/useAuth'
import { verifyEmail } from '@/services/auth.service'

type State = { status: 'loading' } | { status: 'success' } | { status: 'error'; message: string }

export function VerifyEmailStatus({ token }: { token: string }) {
  const queryClient = useQueryClient()
  const started = useRef(false) // React Strict Mode runs effects twice in dev; the link can only be used once
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (started.current) return
    started.current = true
    verifyEmail(token)
      .then(() => {
        setState({ status: 'success' })
        void queryClient.invalidateQueries({ queryKey: ME_KEY })
      })
      .catch((error: unknown) =>
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Verification failed' }),
      )
  }, [token, queryClient])

  if (state.status === 'loading') return <p className="text-slate-600">Verifying your email…</p>
  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <FormAlert message={state.message} />
        <Link href="/dashboard" className="block text-sm font-medium text-brand-purple hover:underline">
          Go to your dashboard to request a new link
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <FormAlert tone="success" message="Your email is verified." />
      <Link href="/dashboard" className="block text-sm font-medium text-brand-purple hover:underline">
        Continue to your dashboard
      </Link>
    </div>
  )
}