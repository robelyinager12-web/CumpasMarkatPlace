export const APP_NAME = 'UniKamp'
export const TAGLINE = 'Your Campus. Your Marketplace.'

const DEFAULT_API_URL = 'http://localhost:4000/api/v1'

// Server components call the API directly (API_INTERNAL_URL is server-only).
// The browser uses NEXT_PUBLIC_API_URL, which is "/api/v1" in production.
export const API_URL =
  typeof window === 'undefined'
    ? (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL)
    : (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL)