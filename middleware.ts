import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search, protocol, host } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Custom domains - support multiple domains
  const customDomains = ['daily.telebox.vn', 'telebox.vn', 'usim.vn'] // Add your new domains here
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

  // Check if request is coming from any custom domain
  const isCustomDomain = customDomains.includes(hostname)

  if (isCustomDomain) {
    // Enhanced redirect loop prevention with Cloudflare support
    const isAlreadyRedirected = request.headers.get('x-redirected-from') === hostname
    const isFromCloudRun = referer.includes(cloudRunUrl) || referer.includes('a.run.app')
    const cfRay = request.headers.get('cf-ray') // Cloudflare header
    const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare header
    const cfVisitor = request.headers.get('cf-visitor') // Cloudflare visitor header
    const isFromCloudflare = cfRay || cfConnectingIp || cfVisitor

    // Check if this is a direct request to the domain (not from redirects)
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttpsRequest = protocol === 'https:' || forwardedProto === 'https'

    console.log(`Request analysis: hostname=${hostname}, protocol=${protocol}, forwardedProto=${forwardedProto}, cfRay=${!!cfRay}, cfVisitor=${!!cfVisitor}, isAlreadyRedirected=${isAlreadyRedirected}, isFromCloudRun=${isFromCloudRun}`)

    // SPECIAL HANDLING FOR CLOUDFLARE PROXY
    if (isFromCloudflare) {
      // For Cloudflare proxied domains, use a different approach
      // Check if this is a fresh request (not a redirect loop)
      const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0')

      // If redirect count is too high, stop redirecting
      if (redirectCount > 3) {
        console.log('Cloudflare redirect loop detected, stopping redirect')
        return NextResponse.next()
      }

      // For Cloudflare, check if we're not in a loop by checking referer more carefully
      const isFromSameDomain = referer && (referer.includes(hostname) || referer.includes('cloudflare'))
      const isFromCloudflareRedirect = referer && referer.includes('a.run.app') && request.headers.get('x-redirected-from') === hostname

      // Only redirect if:
      // 1. Not already redirected from this domain
      // 2. Not coming from Cloud Run with our redirect marker
      // 3. Is HTTPS request
      // 4. Redirect count is reasonable
      if (!isAlreadyRedirected && !isFromCloudflareRedirect && isHttpsRequest && redirectCount <= 3) {
        const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`

        console.log(`Cloudflare redirect: ${hostname}${pathname} to ${targetUrl} (count: ${redirectCount})`)

        return NextResponse.redirect(targetUrl, {
          status: 302,
          headers: {
            'x-redirected-from': hostname,
            'x-redirect-count': (redirectCount + 1).toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'CF-RAY': cfRay || '', // Preserve Cloudflare ray for debugging
          }
        })
      }

      console.log('Cloudflare request: skipping redirect to prevent loop')
      return NextResponse.next()
    }

    // NON-CLOUDFLARE DOMAINS (direct DNS)
    // Only redirect if:
    // 1. Not already redirected (prevent loops)
    // 2. Not coming from Cloud Run
    // 3. Is HTTPS request
    if (!isAlreadyRedirected && !isFromCloudRun && isHttpsRequest) {
      // Additional check: don't redirect if we detect potential loop
      const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0')
      if (redirectCount > 2) {
        console.log('Direct DNS redirect loop detected, stopping redirect')
        return NextResponse.next()
      }

      const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`

      console.log(`Direct DNS redirecting ${hostname}${pathname} to ${targetUrl}`)

      return NextResponse.redirect(targetUrl, {
        status: 302,
        headers: {
          'x-redirected-from': hostname,
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