'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/verifications', label: 'Student verification' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/universities', label: 'Universities' },
  { href: '/admin/featured', label: 'Featured' },
  { href: '/admin/audit-logs', label: 'Audit log' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
      {LINKS.map((link) => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium',
              active ? 'bg-brand-purple text-white' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}