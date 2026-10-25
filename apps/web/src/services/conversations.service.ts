import { ApiClientError, apiClient } from '@/lib/api-client'
import type { ChatMessage, ConversationSummary } from '@/types/message'

type Headers = Record<string, string>

export const listConversations = async () =>
  (await apiClient.get<{ conversations: ConversationSummary[] }>('/conversations')).conversations

export async function getConversation(id: string, headers?: Headers): Promise<ConversationSummary | null> {
  try {
    return (
      await apiClient.get<{ conversation: ConversationSummary }>(`/conversations/${encodeURIComponent(id)}`, {
        headers,
        cache: 'no-store',
      })
    ).conversation
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null
    throw error
  }
}

export const startConversation = (productId: string, message: string) =>
  apiClient.post<{ conversationId: string }>('/conversations', { productId, message })

export function fetchMessages(id: string, cursor: { after?: string; before?: string } = {}) {
  const query = new URLSearchParams()
  if (cursor.after) query.set('after', cursor.after)
  if (cursor.before) query.set('before', cursor.before)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiClient.get<{ messages: ChatMessage[]; hasMore: boolean }>(
    `/conversations/${encodeURIComponent(id)}/messages${suffix}`,
  )
}

export const sendMessage = async (id: string, body: string) =>
  (await apiClient.post<{ message: ChatMessage }>(`/conversations/${encodeURIComponent(id)}/messages`, { body })).message

export const markConversationRead = (id: string) =>
  apiClient.post<{ read: boolean }>(`/conversations/${encodeURIComponent(id)}/read`)