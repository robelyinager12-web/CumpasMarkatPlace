'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-brand-navy">Something went wrong</h1>
      <p className="text-slate-600">Please try again. If the problem continues, come back later.</p>
      <button
        onClick={reset}
        className="rounded-full bg-brand-purple px-5 py-2 font-medium text-white hover:opacity-90"
      >
        Try again
      </button>
    </main>
  )
}