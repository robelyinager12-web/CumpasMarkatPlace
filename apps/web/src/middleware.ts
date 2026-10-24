import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/constants'

// Quick filter: no session cookie means go to login. The real check (valid session, admin role)
// happens in the server layouts and, above all, in the API.
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/auth/login'
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/sell/:path*', '/messages/:path*', '/favorites/:path*'],
}