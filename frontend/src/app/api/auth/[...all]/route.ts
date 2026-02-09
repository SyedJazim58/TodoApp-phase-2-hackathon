/**
 * Better Auth API Route Handler
 *
 * Catch-all API route for Better Auth endpoints.
 * Handles authentication requests including signup, login, session management, and token issuance.
 *
 * This route handler forwards all authentication-related requests to the Better Auth backend.
 * Better Auth will issue JWT tokens on successful login/signup.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T025
 * Created: 2026-02-09
 *
 * Note: Better Auth client automatically communicates with the backend server.
 * This route is a placeholder/proxy if needed for custom authentication logic.
 * For the current implementation, Better Auth handles everything internally.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle GET requests to auth endpoints
 *
 * Better Auth uses GET for:
 * - Session verification
 * - OAuth callbacks (if enabled)
 * - Token refresh
 *
 * @param request - Next.js request object
 * @returns Response from Better Auth backend
 */
export async function GET(request: NextRequest) {
  return handleAuthRequest(request, 'GET');
}

/**
 * Handle POST requests to auth endpoints
 *
 * Better Auth uses POST for:
 * - User signup
 * - User login
 * - Token issuance
 * - Logout
 *
 * @param request - Next.js request object
 * @returns Response from Better Auth backend
 */
export async function POST(request: NextRequest) {
  return handleAuthRequest(request, 'POST');
}

/**
 * Handle PUT requests to auth endpoints
 *
 * Better Auth uses PUT for:
 * - User profile updates
 * - Password changes
 *
 * @param request - Next.js request object
 * @returns Response from Better Auth backend
 */
export async function PUT(request: NextRequest) {
  return handleAuthRequest(request, 'PUT');
}

/**
 * Handle DELETE requests to auth endpoints
 *
 * Better Auth uses DELETE for:
 * - Account deletion
 * - Session termination
 *
 * @param request - Next.js request object
 * @returns Response from Better Auth backend
 */
export async function DELETE(request: NextRequest) {
  return handleAuthRequest(request, 'DELETE');
}

/**
 * Central request handler for all auth endpoints
 *
 * Forwards authentication requests to the Better Auth backend server.
 * This allows the frontend to proxy auth requests through its own domain,
 * which is useful for:
 * - CORS handling
 * - Cookie management
 * - Request logging
 * - Custom middleware
 *
 * @param request - Next.js request object
 * @param method - HTTP method
 * @returns Response from Better Auth backend
 */
async function handleAuthRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  try {
    // Extract the path after /api/auth/
    const pathname = request.nextUrl.pathname;
    const authPath = pathname.replace('/api/auth', '');

    // Get Better Auth backend URL from environment
    const betterAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

    if (!betterAuthUrl) {
      console.error('AuthRoute: NEXT_PUBLIC_BETTER_AUTH_URL not configured');
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 500 }
      );
    }

    // Build the full backend URL
    const backendUrl = `${betterAuthUrl}${authPath}`;

    console.log(`AuthRoute: Forwarding ${method} ${authPath} to ${backendUrl}`);

    // Prepare request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward cookies from the original request
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Prepare request body for POST/PUT requests
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch (error) {
        // No body or invalid JSON - that's okay for some requests
        console.log('AuthRoute: No request body or invalid JSON');
      }
    }

    // Forward the request to Better Auth backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // Extract response data
    let responseData: unknown;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Create Next.js response
    const nextResponse = NextResponse.json(responseData, {
      status: response.status,
    });

    // Forward Set-Cookie headers from backend
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      nextResponse.headers.set('Set-Cookie', setCookieHeaders);
    }

    console.log(`AuthRoute: Response status ${response.status}`);

    return nextResponse;
  } catch (error) {
    console.error('AuthRoute: Error handling auth request:', error);

    return NextResponse.json(
      {
        error: 'Authentication request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Route segment config
 *
 * Configure this route to be dynamic (not statically generated)
 * since it handles authentication requests that vary per user.
 */
export const dynamic = 'force-dynamic';
