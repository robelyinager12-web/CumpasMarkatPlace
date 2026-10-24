import type { ApiFailure, ApiSuccess, PaginationMeta } from '@/types/api'
import { API_URL } from './constants'

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

type Options = Omit<RequestInit, 'headers' | 'body'> & {
  headers?: Record<string, string>
  json?: unknown
}

async function request<T>(method: string, path: string, options: Options = {}): Promise<ApiSuccess<T>> {
  const { json, headers, ...rest } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    })
  } catch {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection.')
  }

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null

  if (!response.ok || !payload || payload.success === false) {
    const error = payload && payload.success === false ? payload.error : undefined
    throw new ApiClientError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.details,
    )
  }

  return payload
}

export const apiClient = {
  get: async <T>(path: string, options?: Options) => (await request<T>('GET', path, options)).data,
  list: async <T>(path: string, options?: Options): Promise<{ data: T; meta?: PaginationMeta }> => {
    const res = await request<T>('GET', path, options)
    return { data: res.data, meta: res.meta }
  },
  post: async <T>(path: string, json?: unknown, options?: Options) =>
    (await request<T>('POST', path, { ...options, json })).data,
  patch: async <T>(path: string, json?: unknown, options?: Options) =>
    (await request<T>('PATCH', path, { ...options, json })).data,
  delete: async <T>(path: string, options?: Options) => (await request<T>('DELETE', path, options)).data,
}