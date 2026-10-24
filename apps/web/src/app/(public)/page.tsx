import { APP_NAME, TAGLINE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getHealth } from '@/services/health.service'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { ok } = await getHealth()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-brand-navy">{APP_NAME}</h1>
      <p className="text-lg text-slate-600">{TAGLINE}</p>
      <span
        className={cn(
          'rounded-full px-4 py-1 text-sm font-medium',
          ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800',
        )}
      >
        API: {ok ? 'online' : 'offline'}
      </span>
    </main>
  )
}