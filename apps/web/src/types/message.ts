import type { ListingStatus } from '@/types/product'

export interface ConversationSummary {
  id: string
  role: 'buyer' | 'seller'
  product: { id: string; title: string; status: ListingStatus; image: string | null }
  other: { id: string; name: string; verified: boolean }
  lastMessage: { body: string; createdAt: string; mine: boolean } | null
  lastMessageAt: string
  unreadCount: number
  blockedByMe: boolean
  canSend: boolean
}

export interface ChatMessage {
  id: string
  body: string
  senderId: string
  createdAt: string
  mine: boolean
}