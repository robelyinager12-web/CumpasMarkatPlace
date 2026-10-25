import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Safety guide' }

const sections: { title: string; items: string[] }[] = [
  {
    title: 'Before you meet',
    items: [
      'Ask questions and request extra photos in the UniKamp chat first.',
      'Check the listing carefully. If the price looks too good to be true, it may be.',
      'Tell a friend where you are going and who you are meeting.',
    ],
  },
  {
    title: 'Meeting safely',
    items: [
      'Meet in a public, busy place on campus, in daylight where you can.',
      'Inspect the item before you pay. Test electronics and check textbook pages.',
      'If anything feels wrong, walk away. No deal is worth feeling unsafe.',
    ],
  },
  {
    title: 'Payments and scams',
    items: [
      'UniKamp does not hold or transfer money. Pay only when you have the item in your hands.',
      'Never pay in advance or pay a “deposit” to hold an item.',
      'Be careful with anyone who asks you to move the chat elsewhere, rushes you, or offers to overpay and asks for change back.',
      'Never share your password or any verification code. UniKamp will never ask for them.',
    ],
  },
  {
    title: 'Your privacy',
    items: [
      'Your email address and phone number are not shown on listings. Share personal details only if you are comfortable.',
      'Photos are resized on your device, which also removes location data from them.',
    ],
  },
  {
    title: 'Report and block',
    items: [
      'Use “Report this listing” on any listing, or “Report user” inside a conversation. Reports are private.',
      'Use “Block” to stop a person messaging you. They are not told they were blocked.',
      'In an emergency, contact local emergency services or campus security first.',
    ],
  },
]

export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-brand-navy">Safety guide</h1>
      <p className="mt-2 text-slate-600">
        UniKamp connects students on the same campus. Listings are not checked before they appear, and a seller or product is
        not trustworthy just because it is listed here. A “Verified student” badge only means an administrator confirmed that
        person is a student.
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-xl font-bold text-brand-navy">{section.title}</h2>
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-slate-600">
        Found a problem? <Link href="/marketplace" className="font-medium text-brand-purple hover:underline">Open the listing</Link> and use
        “Report this listing”.
      </p>
    </main>
  )
}
