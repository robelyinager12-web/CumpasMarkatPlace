import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/auth/login?next=/admin')
  if (user.role !== 'ADMIN') notFound() // do not reveal that the admin area exists
  return <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
}