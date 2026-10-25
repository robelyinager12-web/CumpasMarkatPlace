import Link from 'next/link'
import { APP_NAME, TAGLINE } from '@/lib/constants'

const links = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/safety', label: 'Safety' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-brand-navy">{APP_NAME}</p>
          <p>{TAGLINE}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-purple">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}