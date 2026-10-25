import { apiClient } from '@/lib/api-client'
import type { NotificationItem, Summary } from '@/types/dashboard'

export const getSummary = () => apiClient.get<Summary>('/notifications/summary')

export const listNotifications = () =>
  apiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications')

export const markNotificationRead = (id: string) =>
  apiClient.post<{ read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`)

export const markAllNotificationsRead = () => apiClient.post<{ read: boolean }>('/notifications/read-all')