import { z } from 'zod'

export const idParamSchema = z.object({ id: z.string().min(1).max(100) })
export const userIdParamSchema = z.object({ userId: z.string().min(1).max(100) })