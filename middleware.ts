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
    // Enhanced redirect loop prevention
    const isAlreadyRedirected = request.headers.get('x-redirected-from') === customDomain
    const isFromCloudRun = referer.includes(cloudRunUrl) || referer.includes('a.run.app')
    const cfRay = request.headers.get('cf-ray') // Cloudflare header
    const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare header
    const isFromCloudflare = cfRay || cfConnectingIp

    // Check if this is a direct request to the domain (not from redirects)
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttpsRequest = protocol === 'https:' || forwardedProto === 'https'

    console.log(`Request analysis: hostname=${hostname}, protocol=${protocol}, forwardedProto=${forwardedProto}, cfRay=${!!cfRay}, isAlreadyRedirected=${isAlreadyRedirected}, isFromCloudRun=${isFromCloudRun}`)

    // CRITICAL FIX: If coming through Cloudflare proxy, skip redirect to prevent loops
    if (isFromCloudflare) {
      console.log('Request from Cloudflare proxy, skipping redirect to prevent loop')
      return NextResponse.next()
    }

    // Only redirect if:
    // 1. Not already redirected (prevent loops)
    // 2. Not coming from Cloud Run
    // 3. Is HTTPS request
    // 4. Not in a redirect loop (additional safety)
    if (!isAlreadyRedirected && !isFromCloudRun && isHttpsRequest) {
      // Additional check: don't redirect if we detect potential loop
      const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0')
      if (redirectCount > 2) {
        console.log('Redirect loop detected, stopping redirect')
        return NextResponse.next()
      }

      const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`

      console.log(`Redirecting ${hostname}${pathname} to ${targetUrl}`)

      return NextResponse.redirect(targetUrl, {
        status: 302,
        headers: {
          'x-redirected-from': customDomain,
          'x-redirect-count': (redirectCount + 1).toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // If already redirected or from Cloud Run, continue normally
    console.log('Skipping redirect, conditions not met')
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