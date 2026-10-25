import { apiClient } from '@/lib/api-client'
import type { ProductSummary } from '@/types/product'

export const addFavorite = (productId: string) =>
  apiClient.post<{ favorite: boolean }>(`/favorites/${encodeURIComponent(productId)}`)

export const removeFavorite = (productId: string) =>
  apiClient.delete<{ favorite: boolean }>(`/favorites/${encodeURIComponent(productId)}`)

export const listFavorites = (page: number, headers?: Record<string, string>) =>
  apiClient.list<{ products: ProductSummary[] }>(`/favorites?page=${page}`, { headers, cache: 'no-store' })