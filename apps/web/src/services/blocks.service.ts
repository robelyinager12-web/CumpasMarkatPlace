import { apiClient } from '@/lib/api-client'

export const blockUser = (userId: string) => apiClient.post<{ blocked: boolean }>(`/blocks/${encodeURIComponent(userId)}`)
export const unblockUser = (userId: string) => apiClient.delete<{ blocked: boolean }>(`/blocks/${encodeURIComponent(userId)}`)