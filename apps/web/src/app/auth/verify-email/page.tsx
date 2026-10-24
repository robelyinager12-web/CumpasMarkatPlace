import type { Metadata } from 'next'
import Link from 'next/link'
import { VerifyEmailStatus } from '@/components/forms/VerifyEmailStatus'

export const metadata: Metadata = { title: 'Verify email' }

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-brand-navy">Email verification</h1>
      {token ? (
        <VerifyEmailStatus token={token} />
      ) : (
        <p className="text-slate-600">
          Check your inbox for the verification link. You can request a new one from your{' '}
          <Link href="/dashboard" className="font-medium text-brand-purple hover:underline">
            dashboard
          </Link>
          .
        </p>
      )}
    </main>
  )
}