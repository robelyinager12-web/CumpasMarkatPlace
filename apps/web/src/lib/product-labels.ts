import type { ListingStatus, ProductCondition } from '@/types/product'

export const CONDITION_LABEL: Record<ProductCondition, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
}

export const CONDITIONS = Object.keys(CONDITION_LABEL) as ProductCondition[]

export const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SOLD: 'Sold',
  ARCHIVED: 'Archived',
  REMOVED: 'Removed by moderators',
}