export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED' | 'REMOVED'

export interface Category {
  id: string
  name: string
  slug: string
}

export interface ProductSummary {
  id: string
  title: string
  price: number
  negotiable: boolean
  quantity: number
  condition: ProductCondition
  status: ListingStatus
  createdAt: string
  category: Category
  university: { id: string; name: string }
  campus: { id: string; name: string } | null
  image: string | null
  favoritesCount: number
  isFavorite: boolean
}

export interface ProductImage {
  id: string
  url: string
}

export interface ProductDetail extends ProductSummary {
  description: string
  images: ProductImage[]
  seller: { id: string; name: string; memberSince: string; university: string; verified: boolean }
  isOwner: boolean
  updatedAt: string
}