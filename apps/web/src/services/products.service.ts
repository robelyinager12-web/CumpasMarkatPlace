import { ApiClientError, apiClient } from '@/lib/api-client'
import type { ProductDetail, ProductSummary } from '@/types/product'

type Headers = Record<string, string>

export const listProducts = (query: string, headers?: Headers) =>
  apiClient.list<{ products: ProductSummary[] }>(`/products${query ? `?${query}` : ''}`, {
    headers,
    cache: 'no-store',
  })

export async function getProduct(id: string, headers?: Headers): Promise<ProductDetail | null> {
  try {
    return (
      await apiClient.get<{ product: ProductDetail }>(`/products/${encodeURIComponent(id)}`, {
        headers,
        cache: 'no-store',
      })
    ).product
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null
    throw error
  }
}

export const listMyProducts = async () => (await apiClient.get<{ products: ProductSummary[] }>('/products/mine')).products

export interface ProductPayload {
  title: string
  description: string
  categoryId: string
  price: number
  condition: string
  negotiable: boolean
  quantity: number
  campusId: string | null
}

export const createProduct = async (payload: ProductPayload) =>
  (await apiClient.post<{ product: ProductSummary }>('/products', payload)).product

export const updateProduct = async (id: string, payload: Partial<ProductPayload> & { status?: string }) =>
  (await apiClient.patch<{ product: ProductSummary }>(`/products/${encodeURIComponent(id)}`, payload)).product

export const deleteProduct = (id: string) => apiClient.delete<{ deleted: boolean }>(`/products/${encodeURIComponent(id)}`)

export const deleteProductImage = (productId: string, imageId: string) =>
  apiClient.delete<{ removed: boolean }>(
    `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
  )