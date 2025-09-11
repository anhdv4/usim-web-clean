import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Custom domain
  const customDomain = 'daily.telebox.vn'
  const cloudRunUrl = 'https://usim-web-7i2n2ziwka-as.a.run.app'

  // If request is coming from custom domain
  if (hostname === customDomain) {
    // Prevent redirect loops by checking if we're already on the target
    if (!request.headers.get('x-redirected-from')) {
      const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`

      return NextResponse.redirect(targetUrl, {
        status: 302,
        headers: {
          'x-redirected-from': customDomain
        }
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}