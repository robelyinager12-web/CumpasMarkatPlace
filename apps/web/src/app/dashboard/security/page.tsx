import type { Metadata } from 'next'
import { TwoFactorPanel } from '@/components/dashboard/TwoFactorPanel'

export const metadata: Metadata = { title: 'Security' }

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Security</h1>
      <h2 className="text-lg font-semibold text-brand-navy">Two-factor sign-in</h2>
      <TwoFactorPanel />
    </div>
  )
}