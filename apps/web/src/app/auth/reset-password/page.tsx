import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'

export const metadata: Metadata = { title: 'Reset password' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-brand-navy">Choose a new password</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-slate-600">
          This reset link is incomplete.{' '}
          <Link href="/auth/forgot-password" className="font-medium text-brand-purple hover:underline">
            Request a new one
          </Link>
          .
        </p>
      )}
    </main>
  )
}