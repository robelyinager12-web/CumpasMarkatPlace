import { z } from 'zod'

export const verificationListQuerySchema = z.object({
  status: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
})

export const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
})

export type VerificationListQuery = z.infer<typeof verificationListQuerySchema>
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>