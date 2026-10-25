import { z } from 'zod'
import { cleanText } from '../utils/sanitize.js'

const cleaned = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max, `Maximum ${max} characters`))

const requiredReason = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(5, 'Give a reason (at least 5 characters)').max(500, 'Maximum 500 characters'))

const searchText = z
  .string()
  .optional()
  .transform((value) => cleanText(value ?? ''))
  .pipe(z.string().max(100))

const adminPage = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}

const nonEmpty = (value: object) => Object.keys(value).length > 0
const id = z.string().min(1).max(100)

// ---- student verification and reports (Phases 2 and 4) ----
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

// ---- users ----
export const userListQuerySchema = z.object({
  q: searchText,
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['STUDENT', 'ADMIN']).optional(),
  ...adminPage,
})

export const userStatusSchema = z
  .object({ status: z.enum(['ACTIVE', 'SUSPENDED']), reason: cleaned(500).optional() })
  .refine((value) => value.status === 'ACTIVE' || (value.reason?.length ?? 0) >= 5, {
    message: 'Give a reason (at least 5 characters)',
    path: ['reason'],
  })

// ---- listings ----
export const productListQuerySchema = z.object({
  q: searchText,
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED', 'REMOVED']).optional(),
  ...adminPage,
})

export const productStatusSchema = z.object({
  status: z.enum(['REMOVED', 'ARCHIVED']), // ARCHIVED means "restore" and is only valid for removed listings
  reason: requiredReason,
})

// ---- categories ----
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes')
  .max(80)
const categoryName = z.string().transform(cleanText).pipe(z.string().min(2, 'Name is too short').max(80, 'Name is too long'))

export const createCategorySchema = z.object({ name: categoryName, slug: slug.optional() })
export const updateCategorySchema = z
  .object({ name: categoryName.optional(), slug: slug.optional(), isActive: z.boolean().optional() })
  .refine(nonEmpty, { message: 'Nothing to update' })
export const moveCategorySchema = z.object({ direction: z.enum(['up', 'down']) })

// ---- universities and campuses ----
const universityName = z.string().transform(cleanText).pipe(z.string().min(2, 'Name is too short').max(120, 'Name is too long'))
const city = cleaned(80)

export const createUniversitySchema = z.object({
  name: universityName,
  city: city.optional(),
  isActive: z.boolean().default(true),
})
export const updateUniversitySchema = z
  .object({ name: universityName.optional(), city: city.nullable().optional(), isActive: z.boolean().optional() })
  .refine(nonEmpty, { message: 'Nothing to update' })
export const campusSchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2, 'Name is too short').max(80, 'Name is too long')),
})

// ---- featured listings ----
export const featuredListQuerySchema = z.object({
  state: z.enum(['active', 'scheduled', 'ended', 'all']).default('active'),
  ...adminPage,
})
export const createFeaturedSchema = z.object({
  productId: id,
  startsAt: z.coerce.date().optional(),
  days: z.number().int().min(1, 'Choose 1 to 90 days').max(90, 'Choose 1 to 90 days'),
})

// ---- audit log ----
export const auditQuerySchema = z.object({
  action: searchText,
  entityType: z.string().trim().max(50).optional(),
  actorId: z.string().trim().max(100).optional(),
  ...adminPage,
})

export type VerificationListQuery = z.infer<typeof verificationListQuerySchema>
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>
export type ReportListQuery = z.infer<typeof reportListQuerySchema>
export type ReviewReportInput = z.infer<typeof reviewReportSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>
export type UserStatusInput = z.infer<typeof userStatusSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
export type ProductStatusInput = z.infer<typeof productStatusSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateUniversityInput = z.infer<typeof createUniversitySchema>
export type UpdateUniversityInput = z.infer<typeof updateUniversitySchema>
export type FeaturedListQuery = z.infer<typeof featuredListQuerySchema>
export type CreateFeaturedInput = z.infer<typeof createFeaturedSchema>
export type AuditQuery = z.infer<typeof auditQuerySchema>