import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/constants'

// Server components only: forwards the visitor's session to the API so it can answer
// "is this saved?" and "is this your listing?".
export async function getSessionHeaders(): Promise<Record<string, string>> {
  const session = (await cookies()).get(SESSION_COOKIE)
  return session ? { cookie: `${SESSION_COOKIE}=${session.value}` } : {}
}