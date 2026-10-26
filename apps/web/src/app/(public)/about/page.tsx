import type { Metadata } from 'next'
import Link from 'next/link'
import { BulletList, LegalPage, LegalSection } from '@/components/legal/LegalPage'
import { APP_NAME, TAGLINE } from '@/lib/constants'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <LegalPage title={`About ${APP_NAME}`}>
      <p className="text-lg text-slate-700">{TAGLINE} {APP_NAME} helps students buy and sell affordable things within their own campus community.</p>
      <LegalSection title="What it does">
        <BulletList
          items={[
            'Students list textbooks, laptops, clothes, dormitory items and other everyday things.',
            'Buyers search by category, price, condition and campus, and message sellers directly.',
            'Buyers and sellers arrange a safe exchange on campus. UniKamp does not take payments or hold money.',
          ]}
        />
      </LegalSection>
      <LegalSection title="Starting small">
        <p>We are launching with one university first, learning what works, and then growing to other campuses.</p>
      </LegalSection>
      <LegalSection title="Staying safe">
        <p>
          Read the <Link href="/safety" className="font-medium text-brand-purple hover:underline">safety guide</Link> before you meet someone. You can report
          any listing or person, and block anyone who makes you uncomfortable.
        </p>
      </LegalSection>
    </LegalPage>
  )
}