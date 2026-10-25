'use client'

import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormAlert } from '@/components/forms/FormFeedback'
import { useAuth } from '@/hooks/useAuth'
import { startConversation } from '@/services/conversations.service'

const MAX = 1000
const buttonClass = 'block w-full rounded-full bg-brand-purple px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60'

export function ContactSellerButton({
  productId,
  canContact,
  sellerName,
}: {
  productId: string
  canContact: boolean
  sellerName: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('Hi, is this still available?')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => startConversation(productId, message.trim()),
    onSuccess: (result) => router.push(`/messages/${result.conversationId}`),
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.'),
  })

  if (!canContact) {
    return (
      <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
        This item is no longer available
      </button>
    )
  }
  if (isLoading) {
    return <button type="button" disabled className={buttonClass}>Contact seller</button>
  }
  if (!user) {
    return (
      <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className={buttonClass}>
        Log in to contact seller
      </Link>
    )
  }
  if (!user.emailVerified) {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
        Verify your email to message sellers.{' '}
        <Link href="/dashboard" className="font-medium text-brand-purple hover:underline">Go to your dashboard</Link>
      </p>
    )
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Contact seller
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        if (message.trim().length === 0) {
          setError('Write a message first.')
          return
        }
        mutation.mutate()
      }}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <label htmlFor="first-message" className="block text-sm font-medium text-slate-700">
        Message to {sellerName}
      </label>
      <textarea
        id="first-message"
        rows={3}
        maxLength={MAX}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
      />
      <p className="text-right text-xs text-slate-500">{message.length}/{MAX}</p>
      <FormAlert message={error} />
      <div className="flex gap-3">
        <button type="submit" disabled={mutation.isPending} className={buttonClass}>
          {mutation.isPending ? 'Sending…' : 'Send message'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  )
}