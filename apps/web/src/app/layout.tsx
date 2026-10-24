import type { Metadata, Viewport } from 'next'
import './globals.css'
import { APP_NAME, TAGLINE } from '@/lib/constants'

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${TAGLINE}`, template: `%s | ${APP_NAME}` },
  description: 'Buy and sell affordable products with students on your campus.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}