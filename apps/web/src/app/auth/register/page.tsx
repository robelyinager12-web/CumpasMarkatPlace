import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/forms/RegisterForm'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-brand-navy">Create your account</h1>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-brand-purple hover:underline">
          Log in
        </Link>
      </p>
    </main>
  )
}