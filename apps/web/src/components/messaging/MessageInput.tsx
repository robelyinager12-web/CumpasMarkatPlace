'use client'

import { useState } from 'react'

const MAX = 1000

export function MessageInput({
  onSend,
  disabledReason,
}: {
  onSend: (body: string) => Promise<unknown>
  disabledReason: string | null
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      await onSend(body)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (disabledReason) {
    return <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{disabledReason}</p>
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="space-y-2"
    >
      <label htmlFor="message-text" className="sr-only">Message</label>
      <div className="flex items-end gap-2">
        <textarea
          id="message-text"
          rows={2}
          maxLength={MAX}
          value={text}
          placeholder="Write a message…"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter adds a line. Never send while an input method (such as Amharic) is composing.
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              void submit()
            }
          }}
          className="block flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
        />
        <button
          type="submit"
          disabled={sending || text.trim().length === 0}
          className="rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span role="alert" className="text-red-600">{error}</span>
        <span>{text.length}/{MAX}</span>
      </div>
    </form>
  )
}