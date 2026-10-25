import type { ConversationSummary } from '@/types/message'
import type { ProductSummary } from '@/types/product'

export interface ReportItem {
  id: string
  type: 'LISTING' | 'USER'
  target: string
  reason: string
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface Summary {
  unreadNotifications: number
  unreadMessages: number
}

export interface SellerDashboard {
  stats: {
    activeListings: number
    soldListings: number
    draftListings: number
    favoritesReceived: number
    totalViews: number
    viewsLast7Days: number
  }
  recentConversations: ConversationSummary[]
}

export interface BuyerDashboard {
  favorites: ProductSummary[]
  recentlyViewed: ProductSummary[]
  recentConversations: ConversationSummary[]
  reports: ReportItem[]
}