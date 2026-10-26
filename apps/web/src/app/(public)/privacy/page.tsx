import type { Metadata } from 'next'
import { BulletList, LegalPage, LegalSection } from '@/components/legal/LegalPage'
import { APP_NAME } from '@/lib/constants'
import { CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" legal>
      <LegalSection title="What we collect">
        <BulletList
          items={[
            'Account details: your name, email address, university, campus, optional department and optional phone number. Your password is stored only as a salted hash.',
            'What you post: listings, prices, photos and messages, plus the items you save, the people you block and the reports you send.',
            'Security data: your sign-in sessions (with the IP address and browser type, so you and we can spot unusual activity) and counters of failed sign-in attempts, stored against a hash of the email address.',
            'Basic activity: how many people viewed a listing, using your account or an anonymous code made from your connection details that cannot be turned back into them.',
            'Two-factor settings, if you turn them on. The secret is stored encrypted and recovery codes are stored only as hashes.',
          ]}
        />
      </LegalSection>
      <LegalSection title="Who can see what">
        <BulletList
          items={[
            'Other people see your first name and the first letter of your last name, your university, whether an administrator verified you as a student, and your listings and photos.',
            'Your email address and phone number are not shown on listings or to other users.',
            'Messages are visible to the two people in the conversation. The administrator screens do not display message contents.',
            'Administrators can see account details (such as name, email, university and activity) to run the service and handle reports.',
            'Technical staff with access to the database could technically read stored data. We should only do this where needed to keep the service secure or where the law requires.',
          ]}
        />
      </LegalSection>
      <LegalSection title="Photos">
        <p>Photos you upload on the website are normally resized in your browser first, which also removes hidden data such as the location where the photo was taken.</p>
      </LegalSection>
      <LegalSection title="Cookies">
        <p>
          {APP_NAME} uses one essential cookie that keeps you signed in. We do not currently use advertising or analytics cookies.
        </p>
      </LegalSection>
      <LegalSection title="Emails">
        <p>We email you to verify your address, reset your password and tell you about new messages. New-message emails do not include the message text.</p>
      </LegalSection>
      <LegalSection title="Services we use">
        <p>
          We use hosting, database, email delivery and image storage providers to run {APP_NAME}. They process data on our behalf.
        </p>
        <p>[List the providers and where their servers are located before launch.]</p>
      </LegalSection>
      <LegalSection title="How long we keep data">
        <BulletList
          items={[
            'Sign-in sessions expire after 7 days. Verification and reset links expire quickly. Expired technical records are deleted automatically.',
            'Account, listing and message data is kept while your account exists.',
            '[Retention after an account is closed: to be decided and stated here.]',
          ]}
        />
      </LegalSection>
      <LegalSection title="Your choices">
        <BulletList
          items={[
            'You can edit your profile in your dashboard settings, and delete your own listings.',
            'To get a copy of your data, correct it, or have your account deleted, email us from the address on your account. We handle these requests by hand for now.',
          ]}
        />
      </LegalSection>
      <LegalSection title="Age">
        <p>[Minimum age and rules for young users: to be confirmed with a lawyer.]</p>
      </LegalSection>
      <LegalSection title="Changes and contact">
        <p>We will tell you in the service about important changes to this policy.</p>
        <p>{CONTACT_EMAIL ? `Privacy questions: ${CONTACT_EMAIL}.` : '[Contact email to be added.]'}</p>
      </LegalSection>
    </LegalPage>
  )
}