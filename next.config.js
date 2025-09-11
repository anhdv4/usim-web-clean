/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom domain configuration
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Image domains for external images
  images: {
    domains: ['usim-web-7i2n2ziwka-as.a.run.app']
  },

  // Environment variables
  env: {
    CUSTOM_DOMAIN: 'daily.telebox.vn',
    CLOUD_RUN_URL: 'https://usim-web-7i2n2ziwka-as.a.run.app'
  }
}

module.exports = nextConfig