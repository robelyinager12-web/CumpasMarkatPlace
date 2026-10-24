import type { Metadata } from 'next'
import { ProfileForm } from '@/components/forms/ProfileForm'

export const metadata: Metadata = { title: 'Account settings' }

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Account settings</h1>
      <ProfileForm />
    </div>
  )
}