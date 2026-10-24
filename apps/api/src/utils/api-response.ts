export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const ok = <T>(data: T, meta?: PaginationMeta) => ({
  success: true as const,
  data,
  ...(meta ? { meta } : {}),
})

export const fail = (code: string, message: string, details?: unknown) => ({
  success: false as const,
  error: { code, message, ...(details !== undefined ? { details } : {}) },
})