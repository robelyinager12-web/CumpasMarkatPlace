'use client'

import { useEffect, useRef, useState } from 'react'
import { btnDanger, btnPrimary, errorText, input } from '@/components/admin/ui'
import { FormAlert } from '@/components/forms/FormFeedback'

// A confirmation dialog that asks for a reason. minLength 0 makes the note optional.
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  minLength = 5,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  minLength?: number
  danger?: boolean
  onConfirm: (reason: string) => Promise<unknown>
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setReason('')
      setError(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = reason.trim()
    if (text.length < minLength) {
      setError(`Write at least ${minLength} characters.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(text)
      onClose()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} aria-label={title} onClose={onClose} className="m-auto w-full max-w-md rounded-2xl p-6 shadow-xl backdrop:bg-black/40">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        <div className="space-y-1">
          <label htmlFor="reason-text" className="block text-sm font-medium text-slate-700">
            {minLength > 0 ? 'Reason' : 'Note (optional)'}
          </label>
          <textarea
            id="reason-text"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${input} block w-full`}
          />
        </div>
        <FormAlert message={error} />
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={danger ? `${btnDanger} px-5 py-2 text-sm` : btnPrimary}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  )
}