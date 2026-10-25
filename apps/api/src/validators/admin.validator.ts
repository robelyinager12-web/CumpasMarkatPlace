import { z } from 'zod'

export const verificationListQuerySchema = z.object({
  status: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
})

export const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
})

export const reportListQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']).default('PENDING'),
})

export const reviewReportSchema = z
  .object({
    status: z.enum(['REVIEWING', 'RESOLVED', 'DISMISSED']),
    resolution: z.string().trim().max(500).optional(),
    removeListing: z.boolean().default(false),
  })
  .refine((value) => !value.removeListing || value.status === 'RESOLVED', {
    message: 'A listing can only be removed when the report is resolved',
    path: ['removeListing'],
  })

export type VerificationListQuery = z.infer<typeof verificationListQuerySchema>
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>
export type ReportListQuery = z.infer<typeof reportListQuerySchema>
export type ReviewReportInput = z.infer<typeof reviewReportSchema>