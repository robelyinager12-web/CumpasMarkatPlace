'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FormAlert } from '@/components/forms/FormFeedback'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { formatMessageTime } from '@/lib/format-time'
import { thumbUrl } from '@/lib/images'
import { listConversations } from '@/services/conversations.service'
import type { ConversationSummary } from '@/types/message'

export function ConversationItem({ conversation }: { conversation: ConversationSummary }) {
  const last = conversation.lastMessage
  return (
    <li>
      <Link
        href={`/messages/${conversation.id}`}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:border-brand-purple"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {conversation.product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl(conversation.product.image, 200)} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-slate-900">
              {conversation.other.name}
              <span className="ml-2 text-xs font-normal text-slate-500">{conversation.role === 'seller' ? 'Buyer' : 'Seller'}</span>
            </span>
            {last ? <span className="shrink-0 text-xs text-slate-500">{formatMessageTime(last.createdAt)}</span> : null}
          </p>
          <p className="truncate text-xs text-slate-500">{conversation.product.title}</p>
          {last ? (
            <p className={`truncate text-sm ${conversation.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
              {last.mine ? 'You: ' : ''}
              {last.body}
            </p>
          ) : null}
        </div>
        {conversation.unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-brand-purple px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${conversation.unreadCount} unread`}>
            {conversation.unreadCount}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

export function ConversationList() {
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  })

  if (query.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError) return <FormAlert message="Could not load your messages. Please refresh the page." />
  const conversations = query.data ?? []

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="When you contact a seller, or a buyer contacts you, the conversation appears here."
        action={{ href: '/marketplace', label: 'Browse the marketplace' }}
      />
    )
  }
  return (
    <ul className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationItem key={conversation.id} conversation={conversation} />
      ))}
    </ul>
  )
}