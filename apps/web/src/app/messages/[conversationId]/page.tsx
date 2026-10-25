import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MessageThread } from '@/components/messaging/MessageThread'
import { getServerUser } from '@/lib/server-auth'
import { getSessionHeaders } from '@/lib/server-session'
import { getConversation } from '@/services/conversations.service'

export const metadata: Metadata = { title: 'Conversation' }
export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  if (!(await getServerUser())) redirect(`/auth/login?next=/messages/${encodeURIComponent(conversationId)}`)

  const conversation = await getConversation(conversationId, await getSessionHeaders())
  if (!conversation) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/messages" className="mb-4 inline-block text-sm text-brand-purple hover:underline">
        ← All messages
      </Link>
      <MessageThread initial={conversation} />
    </main>
  )
}
