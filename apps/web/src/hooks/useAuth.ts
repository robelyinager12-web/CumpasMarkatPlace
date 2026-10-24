'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout } from '@/services/auth.service'
import type { User } from '@/types/user'

export const ME_KEY = ['me'] as const

export function useAuth() {
  const queryClient = useQueryClient()

  const query = useQuery({ queryKey: ME_KEY, queryFn: getMe, staleTime: 60_000, retry: false })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(ME_KEY, null)
    },
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    logout: logoutMutation.mutateAsync,
  }
}

// For forms that sign the user in: updates the cached user without an extra /auth/me request.
export function useSetUser() {
  const queryClient = useQueryClient()
  return (user: User | null) => queryClient.setQueryData(ME_KEY, user)
}