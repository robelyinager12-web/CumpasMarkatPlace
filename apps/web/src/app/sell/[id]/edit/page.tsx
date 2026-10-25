import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ListingForm } from '@/components/forms/ListingForm'
import { getServerUser } from '@/lib/server-auth'
import { getSessionHeaders } from '@/lib/server-session'
import { listCategories } from '@/services/categories.service'
import { getProduct } from '@/services/products.service'
import { listCampuses } from '@/services/universities.service'

export const metadata: Metadata = { title: 'Edit listing' }
export const dynamic = 'force-dynamic'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) redirect(`/auth/login?next=/sell/${encodeURIComponent(id)}/edit`)

  const product = await getProduct(id, await getSessionHeaders())
  if (!product || !product.isOwner || product.status === 'REMOVED') notFound()

  const [categories, campuses] = await Promise.all([listCategories(), listCampuses(user.university.id)])

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-navy">Edit listing</h1>
      <ListingForm product={product} categories={categories} campuses={campuses} universityName={user.university.name} />
    </main>
  )
}