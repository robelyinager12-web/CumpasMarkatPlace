import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/LoginForm'
import { safeNextPath } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-brand-navy">Log in</h1>
      <LoginForm next={safeNextPath(next)} />
      <p className="mt-6 text-center text-sm text-slate-600">
        New to UniKamp?{' '}
        <Link href="/auth/register" className="font-medium text-brand-purple hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  )
}