import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold text-brand-navy">Forgot your password?</h1>
      <p className="mb-6 text-slate-600">Enter your email and we will send you a link to choose a new one.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="font-medium text-brand-purple hover:underline">
          Back to log in
        </Link>
      </p>
    </main>
  )
}