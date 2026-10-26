import type { Metadata } from 'next'
import { BulletList, LegalPage, LegalSection } from '@/components/legal/LegalPage'
import { APP_NAME } from '@/lib/constants'
import { CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" legal>
      <LegalSection title="1. What UniKamp is">
        <p>
          {APP_NAME} is an online noticeboard where students list items and contact each other. We are not a party to any sale. We do not sell, inspect, store, ship
          or guarantee any item, and we do not collect or hold payments.
        </p>
      </LegalSection>
      <LegalSection title="2. Your account">
        <BulletList
          items={[
            'Give accurate information and keep your password and two-factor codes private.',
            'You are responsible for what happens under your account.',
            'One person, one account. Tell us if you think someone else has access to yours.',
            '[Minimum age and who may register: to be confirmed with a lawyer.]',
          ]}
        />
      </LegalSection>
      <LegalSection title="3. Listings and behaviour">
        <p>When you list or message, you agree to:</p>
        <BulletList
          items={[
            'Only list items you own and may sell, described honestly with your own photos.',
            'Not list illegal, stolen, counterfeit, dangerous or adult items, weapons, drugs, or services that help others cheat in their studies.',
            'Not harass, threaten, scam or mislead anyone, and not send spam.',
            'Not try to break, overload or bypass the security of the service.',
          ]}
        />
      </LegalSection>
      <LegalSection title="4. Deals between users">
        <BulletList
          items={[
            'Buyers and sellers agree the price and the exchange themselves, in person.',
            'Inspect an item before you pay. Never pay in advance. Meet in a public place on campus.',
            'UniKamp does not offer escrow, refunds or payment protection. Any dispute is between you and the other person.',
          ]}
        />
      </LegalSection>
      <LegalSection title="5. Verified student badge">
        <p>
          The badge means an administrator confirmed that the person is a student. It is not a guarantee of their honesty, and listings are not checked before they appear.
        </p>
      </LegalSection>
      <LegalSection title="6. Moderation">
        <p>
          We may remove listings, limit features or suspend accounts that break these terms or put others at risk. We tell the affected person why where we can, and keep a
          record of moderation actions. Reports are reviewed by people, and the person reported is not told who reported them.
        </p>
      </LegalSection>
      <LegalSection title="7. Your content">
        <p>
          You keep ownership of your listings, photos and messages. You allow {APP_NAME} to store and display them so the service can work, for as long as they are on the service.
        </p>
      </LegalSection>
      <LegalSection title="8. The service">
        <p>
          We work to keep {APP_NAME} available and safe, but it is provided as it is, may change, and may be unavailable at times.
        </p>
        <p>[Limits on our liability and applicable law: to be written by a lawyer.]</p>
      </LegalSection>
      <LegalSection title="9. Ending your account">
        <p>You may stop using {APP_NAME} at any time and ask us to delete your account. We may suspend or close accounts that break these terms.</p>
      </LegalSection>
      <LegalSection title="10. Changes">
        <p>We may update these terms. When we make an important change we will tell you in the service. Using it after that means you accept the new terms.</p>
      </LegalSection>
      <LegalSection title="11. Contact">
        <p>{CONTACT_EMAIL ? `Questions about these terms: ${CONTACT_EMAIL}.` : '[Contact email to be added.]'}</p>
      </LegalSection>
    </LegalPage>
  )
}