'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { FormAlert } from '@/components/forms/FormFeedback'
import { MessageInput } from '@/components/messaging/MessageInput'
import { ReportDialog } from '@/components/products/ReportDialog'
import { useMessages } from '@/hooks/useMessages'
import { formatMessageTime } from '@/lib/format-time'
import { thumbUrl } from '@/lib/images'
import { cn } from '@/lib/utils'
import { blockUser, unblockUser } from '@/services/blocks.service'
import { getConversation } from '@/services/conversations.service'
import type { ConversationSummary } from '@/types/message'

export function MessageThread({ initial }: { initial: ConversationSummary }) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['conversation', initial.id],
    queryFn: async () => (await getConversation(initial.id)) ?? initial,
    initialData: initial,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
  const conversation = data ?? initial
  const { messages, status, hasMore, loadingOlder, send, loadOlder } = useMessages(initial.id)

  const toggleBlock = useMutation({
    mutationFn: () => (conversation.blockedByMe ? unblockUser(conversation.other.id) : blockUser(conversation.other.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation', initial.id] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['summary'] })
    },
  })

  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  useEffect(() => {
    const element = listRef.current
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight
  }, [messages.length, status])

  const closedReason = conversation.canSend
    ? null
    : conversation.blockedByMe
      ? `You blocked ${conversation.other.name}. Unblock them to send messages.`
      : conversation.product.status === 'REMOVED'
        ? 'This listing was removed, so the conversation is closed.'
        : 'You can no longer reply to this conversation.'

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        <Link href={`/products/${conversation.product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {conversation.product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl(conversation.product.image, 200)} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-semibold text-slate-900">
              {conversation.other.name}
              {conversation.other.verified ? <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified student" /> : null}
            </p>
            <p className="truncate text-xs text-slate-600">About: {conversation.product.title}</p>
          </div>
        </Link>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            disabled={toggleBlock.isPending}
            onClick={() => {
              if (conversation.blockedByMe || window.confirm(`Block ${conversation.other.name}? You will not receive their messages.`)) {
                toggleBlock.mutate()
              }
            }}
            className="text-slate-600 underline hover:text-brand-purple disabled:opacity-50"
          >
            {conversation.blockedByMe ? 'Unblock' : 'Block'}
          </button>
          <ReportDialog type="USER" targetId={conversation.other.id} label="Report user" className="text-slate-600 underline hover:text-red-600" />
        </div>
      </header>

      <p className="bg-amber-50 px-4 py-2 text-xs text-amber-900">
        Meet in a public place on campus and never pay in advance. UniKamp will never ask for your password or verification codes.
      </p>

      <div
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget
          stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
        }}
        className="flex-1 space-y-2 overflow-y-auto p-4"
        aria-live="polite"
      >
        {status === 'loading' ? <p className="text-center text-sm text-slate-600">Loading messages…</p> : null}
        {status === 'error' ? <FormAlert message="Could not load messages. Please refresh the page." /> : null}
        {hasMore ? (
          <button type="button" onClick={loadOlder} disabled={loadingOlder} className="mx-auto block text-xs text-brand-purple hover:underline">
            {loadingOlder ? 'Loading…' : 'Load earlier messages'}
          </button>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.mine ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 text-sm', message.mine ? 'bg-brand-purple text-white' : 'bg-slate-100 text-slate-900')}>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p className={cn('mt-1 text-right text-[11px]', message.mine ? 'text-white/90' : 'text-slate-600')}>
                {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        <MessageInput onSend={send} disabledReason={closedReason} />
      </div>
    </div>
  )
}