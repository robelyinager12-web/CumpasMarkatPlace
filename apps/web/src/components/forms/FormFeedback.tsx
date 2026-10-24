import { cn } from '@/lib/utils'

export function SubmitButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export function FormAlert({ message, tone = 'error' }: { message: string | null; tone?: 'error' | 'success' }) {
  if (!message) return null
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl px-4 py-3 text-sm',
        tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800',
      )}
    >
      {message}
    </p>
  )
}