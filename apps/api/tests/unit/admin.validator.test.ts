import { describe, expect, it } from 'vitest'
import { slugify } from '../../src/utils/slug.js'
import {
  auditQuerySchema,
  createCategorySchema,
  createFeaturedSchema,
  productStatusSchema,
  updateCategorySchema,
  userStatusSchema,
} from '../../src/validators/admin.validator.js'

describe('slugify', () => {
  it('makes URL-safe slugs and gives an empty slug for non-Latin names', () => {
    expect(slugify('  Textbooks & Study Guides! ')).toBe('textbooks-study-guides')
    expect(slugify('Laptops 2026')).toBe('laptops-2026')
    expect(slugify('መጽሐፍት')).toBe('')
  })
})

describe('admin validation', () => {
  it('requires a reason of at least 5 characters to suspend, but not to restore', () => {
    expect(userStatusSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(false)
    expect(userStatusSchema.safeParse({ status: 'SUSPENDED', reason: 'bad' }).success).toBe(false)
    expect(userStatusSchema.safeParse({ status: 'SUSPENDED', reason: 'Repeated scams' }).success).toBe(true)
    expect(userStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true)
  })

  it('only allows removing or restoring a listing, always with a reason', () => {
    expect(productStatusSchema.safeParse({ status: 'ACTIVE', reason: 'Because I can' }).success).toBe(false)
    expect(productStatusSchema.safeParse({ status: 'REMOVED' }).success).toBe(false)
    expect(productStatusSchema.safeParse({ status: 'REMOVED', reason: 'Prohibited item' }).success).toBe(true)
  })

  it('validates categories', () => {
    expect(createCategorySchema.parse({ name: '  Lab  coats ' }).name).toBe('Lab coats')
    expect(createCategorySchema.safeParse({ name: 'x' }).success).toBe(false)
    expect(createCategorySchema.safeParse({ name: 'Lab coats', slug: 'Bad Slug!' }).success).toBe(false)
    expect(updateCategorySchema.safeParse({}).success).toBe(false)
    expect(updateCategorySchema.safeParse({ isActive: false }).success).toBe(true)
  })

  it('limits featured periods to 1 to 90 days', () => {
    for (const days of [0, 91, 1.5]) {
      expect(createFeaturedSchema.safeParse({ productId: 'p', days }).success, String(days)).toBe(false)
    }
    expect(createFeaturedSchema.safeParse({ productId: 'p', days: 7 }).success).toBe(true)
    expect(createFeaturedSchema.safeParse({ productId: 'p', days: 7, startsAt: 'not a date' }).success).toBe(false)
  })

  it('has sensible audit query defaults and caps the page size', () => {
    expect(auditQuerySchema.parse({})).toMatchObject({ action: '', page: 1, pageSize: 20 })
    expect(auditQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false)
  })
})