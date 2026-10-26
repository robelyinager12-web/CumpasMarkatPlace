const apiInternalUrl = process.env.API_INTERNAL_URL

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The end-to-end tests build into their own folder so they never disturb a running dev server
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async rewrites() {
    if (!apiInternalUrl) return []
    // Production: the browser only talks to ONE origin (this site). Next.js forwards
    // /api/v1/* to the API, so login cookies stay first-party.
    const origin = new URL(apiInternalUrl).origin
    return [{ source: '/api/v1/:path*', destination: `${origin}/api/v1/:path*` }]
  },
}

export default nextConfig