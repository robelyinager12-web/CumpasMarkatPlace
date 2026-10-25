import { apiClient } from '@/lib/api-client'
import type { Category } from '@/types/product'

export const listCategories = async () =>
  (await apiClient.get<{ categories: Category[] }>('/categories', { next: { revalidate: 300 } })).categories