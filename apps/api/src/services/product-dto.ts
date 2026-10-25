import type { ProductDetailRow, ProductListRow } from '../repositories/product.repository.js'

// "Abebe Kebede" -> "Abebe K." (public pages never show full names or contact details)
export const publicName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  const initial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return initial ? `${parts[0]} ${initial.toUpperCase()}.` : parts[0]
}

export const toListDto = (row: ProductListRow, favorites: ReadonlySet<string>) => ({
  id: row.id,
  title: row.title,
  price: Number(row.priceEtb),
  negotiable: row.negotiable,
  quantity: row.quantity,
  condition: row.condition,
  status: row.status,
  createdAt: row.createdAt,
  category: row.category,
  university: row.university,
  campus: row.campus,
  image: row.images[0]?.url ?? null,
  favoritesCount: row._count.favorites,
  isFavorite: favorites.has(row.id),
})

export const toDetailDto = (row: ProductDetailRow, favorites: ReadonlySet<string>, isOwner: boolean) => ({
  ...toListDto(row, favorites),
  description: row.description,
  images: row.images.map((image) => ({ id: image.id, url: image.url })),
  seller: {
    id: row.seller.id,
    name: publicName(row.seller.fullName),
    memberSince: row.seller.createdAt,
    university: row.seller.university.name,
    verified: row.seller.verification?.status === 'VERIFIED',
  },
  isOwner,
  updatedAt: row.updatedAt,
})