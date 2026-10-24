import { apiClient } from '@/lib/api-client'

export async function getHealth(): Promise<{ ok: boolean }> {
  try {
    const data = await apiClient.get<{ status: string }>('/health', { cache: 'no-store' })
    return { ok: data.status === 'ok' }
  } catch {
    return { ok: false }
  }
}