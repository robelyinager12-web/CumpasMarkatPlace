import { z } from 'zod'

export const idParamSchema = z.object({ id: z.string().min(1).max(100) })
export const userIdParamSchema = z.object({ userId: z.string().min(1).max(100) })
export const productIdParamSchema = z.object({ productId: z.string().min(1).max(100) })
export const productImageParamsSchema = z.object({
  id: z.string().min(1).max(100),
  imageId: z.string().min(1).max(100),
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
})