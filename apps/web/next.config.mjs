const apiInternalUrl = process.env.API_INTERNAL_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    if (!apiInternalUrl) return []
    // Production: the browser only talks to ONE origin (this site). Next.js forwards
    // /api/v1/* to the API, so login cookies stay first-party.
    const origin = new URL(apiInternalUrl).origin
    return [{ source: '/api/v1/:path*', destination: `${origin}/api/v1/:path*` }]
  },
}

export default nextConfig