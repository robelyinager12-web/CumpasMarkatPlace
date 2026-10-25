'use client'

import { useQuery } from '@tanstack/react-query'
import { getSummary } from '@/services/notifications.service'

// Unread counts for the navbar. Polls every 30 seconds, and not while the tab is hidden.
export function useSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}