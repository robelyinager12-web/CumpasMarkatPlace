import { z } from 'zod'
import { cleanMultiline } from '../utils/sanitize.js'

export const REPORT_REASONS = ['SCAM', 'PROHIBITED_ITEM', 'MISLEADING', 'HARASSMENT', 'SPAM', 'OTHER'] as const

export const createReportSchema = z
  .object({
    type: z.enum(['LISTING', 'USER']),
    targetId: z.string().min(1).max(100),
    reason: z.enum(REPORT_REASONS),
    details: z
      .string()
      .transform(cleanMultiline)
      .pipe(z.string().max(1000, 'Maximum 1000 characters'))
      .optional(),
  })
  .refine((value) => value.reason !== 'OTHER' || (value.details?.length ?? 0) >= 10, {
    message: 'Please describe the problem (at least 10 characters)',
    path: ['details'],
  })

export type CreateReportInput = z.infer<typeof createReportSchema>