import { cn } from '@/lib/utils'

const TONES = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-100 text-slate-700',
  purple: 'bg-brand-purple/10 text-brand-purple',
} as const

export function StatusBadge({ tone = 'slate', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>
}