/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for identifying potential problems
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Type checking is done separately via tsc --noEmit in CI/CD
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    // Enable Server Actions for better form handling
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Environment variables that should be available on the client side
  // Note: NEXT_PUBLIC_ prefix makes them available in the browser
  env: {
    // These will be populated from .env.local
  },

  // API proxy configuration (if needed to avoid CORS issues in development)
  async rewrites() {
    // Only proxy in development if NEXT_PUBLIC_API_BASE_URL is not set
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*', // FastAPI backend default
        },
      ];
    }
    return [];
  },

  // Security headers
  // T066: Content Security Policy configuration for enhanced security
  async headers() {
    // Content Security Policy directives
    // Prevents XSS attacks by controlling which resources can be loaded
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'} ${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:8000'};
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
