import { cookies } from 'next/headers'
import { API_URL, SESSION_COOKIE } from '@/lib/constants'
import type { User } from '@/types/user'

// Server components only: asks the API who the current visitor is, using their session cookie.
export async function getServerUser(): Promise<User | null> {
  const session = (await cookies()).get(SESSION_COOKIE)
  if (!session) return null

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${session.value}`, accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const body = (await response.json()) as { success: boolean; data?: { user: User } }
    return body.success && body.data ? body.data.user : null
  } catch {
    return null
  }
}