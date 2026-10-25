import { z } from 'zod'
import { cleanMultiline, cleanText } from '../utils/sanitize.js'

export const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as const
// Owners can never set REMOVED: only moderators remove listings
export const OWNER_STATUSES = ['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED'] as const

const title = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'))

const description = z
  .string()
  .transform(cleanMultiline)
  .pipe(z.string().min(10, 'Describe the item in at least 10 characters').max(2000, 'Description is too long'))

const price = z
  .number()
  .positive('Price must be greater than 0')
  .max(10_000_000, 'Price is too high')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Use at most 2 decimal places')

const quantity = z.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity is too high')
const categoryId = z.string().min(1, 'Select a category').max(100)
const campusId = z.string().min(1).max(100).nullable().optional()

export const createProductSchema = z.object({
  title,
  description,
  categoryId,
  price,
  condition: z.enum(CONDITIONS),
  negotiable: z.boolean().default(false),
  quantity: quantity.default(1),
  campusId,
})

// Unknown keys (sellerId, universityId, ...) are stripped, so ownership can never be changed from the client.
export const updateProductSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    categoryId: categoryId.optional(),
    price: price.optional(),
    condition: z.enum(CONDITIONS).optional(),
    negotiable: z.boolean().optional(),
    quantity: quantity.optional(),
    campusId,
    status: z.enum(OWNER_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update' })

const csv = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  )

export const listProductsQuerySchema = z
  .object({
    q: z
      .string()
      .optional()
      .transform((value) => cleanText(value ?? ''))
      .pipe(z.string().max(200)),
    category: z.string().trim().min(1).max(100).optional(),
    condition: csv.pipe(z.array(z.enum(CONDITIONS)).max(4)),
    universityId: z.string().min(1).max(100).optional(),
    campusId: z.string().min(1).max(100).optional(),
    minPrice: z.coerce.number().min(0).max(10_000_000).optional(),
    maxPrice: z.coerce.number().min(0).max(10_000_000).optional(),
    featured: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
    excludeId: z.string().min(1).max(100).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
    message: 'Minimum price cannot be above maximum price',
    path: ['minPrice'],
  })

export const mineQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED', 'REMOVED']).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>
export type MineQuery = z.infer<typeof mineQuerySchema>