/**
 * Next.js Middleware for Protected Route Authentication
 *
 * Uses Better Auth to protect routes requiring authentication.
 * Redirects unauthenticated users to /login.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T012
 * Created: 2026-02-09
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes that require authentication
 * Add any new protected routes to this array
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
];

/**
 * Routes that are only accessible when NOT authenticated
 * (e.g., login, signup - redirect to dashboard if already logged in)
 */
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

/**
 * Middleware function to protect routes
 *
 * Flow:
 * 1. Check if route requires protection
 * 2. Verify Better Auth session cookie
 * 3. Redirect to /login if unauthenticated
 * 4. Redirect to /dashboard if authenticated user tries to access auth routes
 *
 * @param request - Next.js request object
 * @returns Next.js response (redirect or continue)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Get Better Auth session from cookies
  // Better Auth stores session in httpOnly cookie named 'better-auth.session_token'
  const sessionToken = request.cookies.get('better-auth.session_token');
  const isAuthenticated = !!sessionToken?.value;

  // Protected route - redirect to login if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);

    // Preserve the attempted URL for redirect after login
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('message', 'Please log in to access this page');

    return NextResponse.redirect(loginUrl);
  }

  // Auth route - redirect to dashboard if already authenticated
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow request to continue
  return NextResponse.next();
}

/**
 * Matcher configuration
 * Specifies which routes the middleware should run on
 *
 * Excludes:
 * - API routes (/api/*)
 * - Static files (/_next/static/*)
 * - Images (/_next/image/*)
 * - Favicon and other public assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc. (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
