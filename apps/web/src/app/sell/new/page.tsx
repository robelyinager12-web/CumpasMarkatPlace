import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/forms/ListingForm'
import { getServerUser } from '@/lib/server-auth'
import { listCategories } from '@/services/categories.service'
import { listCampuses } from '@/services/universities.service'

export const metadata: Metadata = { title: 'Create listing' }
export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const user = await getServerUser()
  if (!user) redirect('/auth/login?next=/sell/new')

  if (!user.emailVerified) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="mb-3 text-2xl font-bold text-brand-navy">Verify your email to sell</h1>
        <p className="text-slate-600">
          This keeps the marketplace safer for everyone.{' '}
          <Link href="/dashboard" className="font-medium text-brand-purple hover:underline">Go to your dashboard</Link> to send the verification email.
        </p>
      </main>
    )
  }

  const [categories, campuses] = await Promise.all([listCategories(), listCampuses(user.university.id)])

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-navy">Create a listing</h1>
      <ListingForm categories={categories} campuses={campuses} universityName={user.university.name} />
    </main>
  )
}