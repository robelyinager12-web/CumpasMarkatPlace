import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Providers } from '@/components/layout/Providers'
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
      <body className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-navy focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>
          <Navbar />
          <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}