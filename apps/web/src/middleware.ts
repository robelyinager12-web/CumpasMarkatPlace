import { NextResponse } from 'next/server'

// Phase 2 will redirect signed-out users away from these routes (and non-admins from /admin).
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/sell/:path*', '/messages/:path*', '/favorites/:path*'],
}