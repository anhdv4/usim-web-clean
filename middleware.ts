import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search, protocol, host } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Custom domain
  const customDomain = 'daily.telebox.vn'
  const cloudRunUrl = 'https://usim-web-7i2n2ziwka-as.a.run.app'

  // Skip middleware for API routes, static files, and health checks
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      userAgent.includes('GoogleHC/') ||
      userAgent.includes('Google-Cloud-Scheduler')) {
    return NextResponse.next()
  }

  // If request is coming from custom domain
  if (hostname === customDomain) {
    // Prevent redirect loops by checking multiple conditions
    const isAlreadyRedirected = request.headers.get('x-redirected-from') === customDomain
    const isFromCloudRun = referer.includes(cloudRunUrl)
    const isHttpsRequest = protocol === 'https:'

    // Only redirect if:
    // 1. Not already redirected
    // 2. Not coming from Cloud Run
    // 3. Is HTTPS request (to avoid SSL redirect loops)
    if (!isAlreadyRedirected && !isFromCloudRun && isHttpsRequest) {
      const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`

      console.log(`Redirecting ${hostname}${pathname} to ${targetUrl}`)

      return NextResponse.redirect(targetUrl, {
        status: 302,
        headers: {
          'x-redirected-from': customDomain,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // If already redirected or from Cloud Run, continue normally
    return NextResponse.next()
  }

  // For all other requests, continue normally
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
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}