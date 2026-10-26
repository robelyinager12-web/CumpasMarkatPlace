'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormAlert } from '@/components/forms/FormFeedback'
import { ME_KEY, useAuth } from '@/hooks/useAuth'
import {
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  setupTwoFactor,
} from '@/services/auth.service'

const field =
  'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30'
const primary = 'rounded-full bg-brand-purple px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60'
const secondary = 'rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60'
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong. Please try again.')

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <h2 className="text-lg font-bold text-brand-navy">Save your recovery codes</h2>
      <p className="text-sm text-slate-700">
        Each code works once if you lose your phone. They are shown only now, so write them down or store them in a password manager.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
        {codes.map((code) => (
          <li key={code} className="rounded-lg bg-white px-3 py-2 text-center">{code}</li>
        ))}
      </ul>
      <button type="button" onClick={onDone} className={primary}>I have saved these codes</button>
    </div>
  )
}

function SetupFlow({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const start = useMutation({ mutationFn: setupTwoFactor, onSuccess: setSetup, onError: (err) => setError(errorMessage(err)) })
  const enable = useMutation({
    mutationFn: () => enableTwoFactor(code.trim()),
    onSuccess: (result) => onEnabled(result.recoveryCodes),
    onError: (err) => setError(errorMessage(err)),
  })

  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Two-factor sign-in asks for a code from an authenticator app (such as Google Authenticator, Microsoft Authenticator or Aegis)
          in addition to your password.
        </p>
        <FormAlert message={error} />
        <button type="button" onClick={() => { setError(null); start.mutate() }} disabled={start.isPending} className={primary}>
          {start.isPending ? 'Please wait…' : 'Set up two-factor sign-in'}
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        enable.mutate()
      }}
      className="space-y-4"
    >
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>
          In your authenticator app choose <strong>Add account</strong> then <strong>Enter a setup key</strong>. On a phone you can also{' '}
          <a href={setup.otpauthUrl} className="font-medium text-brand-purple hover:underline">tap here to open it directly</a>.
        </li>
        <li>
          Type this key (spaces do not matter): <code className="block break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-base">{setup.secret.match(/.{1,4}/g)?.join(' ')}</code>
        </li>
        <li>Enter the 6-digit code the app shows:</li>
      </ol>
      <div className="max-w-xs space-y-1">
        <label htmlFor="enable-code" className="block text-sm font-medium">Code</label>
        <input id="enable-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className={field} />
      </div>
      <FormAlert message={error} />
      <button type="submit" disabled={enable.isPending || code.trim().length < 6} className={primary}>
        {enable.isPending ? 'Checking…' : 'Turn on'}
      </button>
    </form>
  )
}

function ManagePanel({ required, onNewCodes }: { required: boolean; onNewCodes: (codes: string[]) => void }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'codes' | 'disable' | null>(null)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setMode(null)
    setPassword('')
    setCode('')
    setError(null)
  }
  const regenerate = useMutation({
    mutationFn: () => regenerateRecoveryCodes({ password, code: code.trim() }),
    onSuccess: (result) => {
      reset()
      onNewCodes(result.recoveryCodes)
    },
    onError: (err) => setError(errorMessage(err)),
  })
  const disable = useMutation({
    mutationFn: () => disableTwoFactor({ password, code: code.trim() }),
    onSuccess: () => {
      reset()
      void queryClient.invalidateQueries({ queryKey: ME_KEY })
    },
    onError: (err) => setError(errorMessage(err)),
  })
  const busy = regenerate.isPending || disable.isPending

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Two-factor sign-in is on.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={secondary} onClick={() => { reset(); setMode('codes') }}>New recovery codes</button>
        {!required ? <button type="button" className={secondary} onClick={() => { reset(); setMode('disable') }}>Turn off</button> : null}
      </div>
      {required ? <p className="text-xs text-slate-600">Administrators must keep two-factor sign-in on.</p> : null}
      {mode ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            if (mode === 'codes') regenerate.mutate()
            else disable.mutate()
          }}
          className="max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm text-slate-700">
            {mode === 'codes' ? 'Your old recovery codes stop working.' : 'Sign-in will only need your password again.'} Confirm with your password and a code.
          </p>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="block text-sm font-medium">Password</label>
            <input id="confirm-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-code" className="block text-sm font-medium">Authenticator code</label>
            <input id="confirm-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className={field} />
          </div>
          <FormAlert message={error} />
          <div className="flex gap-3">
            <button type="submit" disabled={busy || !password || code.trim().length < 6} className={primary}>
              {busy ? 'Please wait…' : mode === 'codes' ? 'Create new codes' : 'Turn off'}
            </button>
            <button type="button" onClick={reset} className={secondary}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export function TwoFactorPanel() {
  const { user, isLoading } = useAuth()
  const queryClient = useQueryClient()
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null)

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <p className="text-slate-600">Please log in to manage your security settings.</p>

  const showCodes = (codes: string[]) => {
    setFreshCodes(codes)
    void queryClient.invalidateQueries({ queryKey: ME_KEY })
  }

  return (
    <div className="max-w-2xl space-y-6">
      {user.twoFactorRequired ? (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Administrators must turn on two-factor sign-in before the admin area opens.
        </p>
      ) : null}
      {freshCodes ? (
        <RecoveryCodes codes={freshCodes} onDone={() => setFreshCodes(null)} />
      ) : user.twoFactorEnabled ? (
        <ManagePanel required={user.role === 'ADMIN'} onNewCodes={showCodes} />
      ) : (
        <SetupFlow onEnabled={showCodes} />
      )}
    </div>
  )
}