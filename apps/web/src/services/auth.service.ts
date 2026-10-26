import { ApiClientError, apiClient } from '@/lib/api-client'
import type { User } from '@/types/user'

type UserResponse = { user: User }
export type LoginResult = { twoFactorRequired: true } | UserResponse

export async function getMe(): Promise<User | null> {
  try {
    return (await apiClient.get<UserResponse>('/auth/me')).user
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null
    throw error
  }
}

export const login = (input: { email: string; password: string; code?: string }) =>
  apiClient.post<LoginResult>('/auth/login', input)

export const register = (input: {
  fullName: string
  email: string
  phone?: string
  password: string
  universityId: string
  campusId?: string
  department?: string
}) => apiClient.post<UserResponse>('/auth/register', input)

export const logout = () => apiClient.post<{ loggedOut: boolean }>('/auth/logout')

export const verifyEmail = (token: string) => apiClient.post<{ verified: boolean }>('/auth/verify-email', { token })

export const resendVerification = () => apiClient.post<{ sent: boolean }>('/auth/resend-verification')

export const forgotPassword = (email: string) => apiClient.post<{ message: string }>('/auth/forgot-password', { email })

export const resetPassword = (input: { token: string; password: string }) =>
  apiClient.post<{ reset: boolean }>('/auth/reset-password', input)

export const updateProfile = (input: {
  fullName?: string
  phone?: string | null
  department?: string | null
  campusId?: string | null
}) => apiClient.patch<UserResponse>('/auth/me', input)

export const requestStudentVerification = (message?: string) =>
  apiClient.post<{ status: string }>('/auth/student-verification', message ? { message } : {})

export const setupTwoFactor = () => apiClient.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup')
export const enableTwoFactor = (code: string) => apiClient.post<{ recoveryCodes: string[] }>('/auth/2fa/enable', { code })
export const disableTwoFactor = (input: { password: string; code: string }) =>
  apiClient.post<{ disabled: boolean }>('/auth/2fa/disable', input)
export const regenerateRecoveryCodes = (input: { password: string; code: string }) =>
  apiClient.post<{ recoveryCodes: string[] }>('/auth/2fa/recovery-codes', input)