import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold text-brand-navy">Page not found</h1>
      <p className="text-slate-600">The page you are looking for does not exist.</p>
      <Link href="/" className="rounded-full bg-brand-purple px-5 py-2 font-medium text-white hover:opacity-90">
        Back to home
      </Link>
    </main>
  )
}