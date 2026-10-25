import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messaging/ConversationList'
import { getServerUser } from '@/lib/server-auth'

export const metadata: Metadata = { title: 'Messages' }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  if (!(await getServerUser())) redirect('/auth/login?next=/messages')
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-navy">Messages</h1>
      <ConversationList />
    </main>
  )
}
