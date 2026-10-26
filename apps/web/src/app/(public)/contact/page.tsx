import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal/LegalPage'
import { CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Contact' }

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <LegalSection title="Questions and feedback">
        {CONTACT_EMAIL ? (
          <p>
            Email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-purple hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        ) : (
          <p>The contact email address has not been set up yet.</p>
        )}
      </LegalSection>
      <LegalSection title="Reporting a problem">
        <p>
          For a suspicious listing or person, use <strong>Report this listing</strong> on the listing page or <strong>Report user</strong> inside a conversation. That reaches
          our moderators directly and is faster than email. See the{' '}
          <Link href="/safety" className="font-medium text-brand-purple hover:underline">safety guide</Link>.
        </p>
        <p>In an emergency, contact local emergency services or campus security first.</p>
      </LegalSection>
      <LegalSection title="Your data">
        <p>
          To ask for a copy of your data, a correction, or deletion of your account, email us from the address on your account.
        </p>
      </LegalSection>
    </LegalPage>
  )
}