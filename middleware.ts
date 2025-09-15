import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search, protocol, host } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Custom domains - support multiple domains
  const customDomains = ['daily.telebox.vn', 'telebox.vn', 'usim.vn', 'dulichsim.xyz'] // Add your new domains here
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
    // Enhanced Cloudflare proxy detection
    const cfRay = request.headers.get('cf-ray')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    const cfVisitor = request.headers.get('cf-visitor')
    const cfRequestId = request.headers.get('cf-request-id')
    const serverHeader = request.headers.get('server')
    const isFromCloudflare = cfRay || cfConnectingIp || cfVisitor || cfRequestId || (serverHeader && serverHeader.includes('cloudflare'))

    // Additional Cloudflare detection methods
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const hasCloudflareHeaders = cfRay || cfConnectingIp || cfVisitor || cfRequestId

    console.log(`Domain request: ${hostname}${pathname}`)
    console.log(`Cloudflare detection: cfRay=${!!cfRay}, cfVisitor=${!!cfVisitor}, cfRequestId=${!!cfRequestId}, server=${serverHeader}`)
    console.log(`Forwarding: forwardedFor=${forwardedFor}, realIp=${realIp}`)

    // CLOUDFLARE PROXY HANDLING
    if (isFromCloudflare || hasCloudflareHeaders) {
      console.log('✅ Cloudflare proxy detected - serving content directly')

      // For Cloudflare proxied requests, serve content directly
      // This prevents redirect loops through the proxy
      return NextResponse.next()
    }

    // DIRECT DNS REQUESTS (non-Cloudflare)
    const isAlreadyRedirected = request.headers.get('x-redirected-from') === hostname
    const isFromCloudRun = referer && (referer.includes(cloudRunUrl) || referer.includes('a.run.app'))
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttpsRequest = protocol === 'https:' || forwardedProto === 'https'

    console.log(`Direct DNS check: isAlreadyRedirected=${isAlreadyRedirected}, isFromCloudRun=${isFromCloudRun}, isHttpsRequest=${isHttpsRequest}`)

    // Only redirect direct DNS requests to Cloud Run
    if (!isAlreadyRedirected && !isFromCloudRun && isHttpsRequest) {
      const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0')

      if (redirectCount > 3) {
        console.log('❌ Redirect loop detected, stopping')
        return NextResponse.next()
      }

      const targetUrl = `${cloudRunUrl}${pathname}${search || ''}`
      console.log(`🔄 Direct DNS redirect: ${hostname}${pathname} → ${targetUrl}`)

      return NextResponse.redirect(targetUrl, {
        status: 302,
        headers: {
          'x-redirected-from': hostname,
          'x-redirect-count': (redirectCount + 1).toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    console.log('⏭️ Skipping redirect for direct DNS request')
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