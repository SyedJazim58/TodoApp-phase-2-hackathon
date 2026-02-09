/**
 * ProtectedRoute Component
 *
 * Wrapper component for routes that require authentication.
 * Uses Better Auth to verify session and redirect if unauthenticated.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T015
 * Created: 2026-02-09
 */

'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, isAuthenticated } from '@/lib/better-auth';

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Child components to render if authenticated */
  children: ReactNode;

  /** Path to redirect to if not authenticated (default: /login) */
  redirectPath?: string;

  /** Custom loading component */
  loadingComponent?: ReactNode;

  /** Show loading state (default: true) */
  showLoading?: boolean;
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute wrapper component
 *
 * Verifies user authentication status using Better Auth session.
 * Redirects to login if unauthenticated.
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 *
 * @param props - Component props
 * @returns Wrapped children if authenticated, loading state, or null during redirect
 */
export default function ProtectedRoute({
  children,
  redirectPath = '/login',
  loadingComponent,
  showLoading = true,
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    /**
     * Check authentication status
     */
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const authStatus = await isAuthenticated();

        if (authStatus) {
          // User is authenticated
          setAuthenticated(true);
          setLoading(false);
        } else {
          // User is not authenticated - redirect to login
          console.log('ProtectedRoute: User not authenticated, redirecting to login');

          // Construct login URL with redirect parameter
          const loginUrl = new URL(redirectPath, window.location.origin);
          loginUrl.searchParams.set('redirect', pathname || '/dashboard');
          loginUrl.searchParams.set('message', 'Please log in to access this page');

          // Redirect to login
          router.push(loginUrl.pathname + loginUrl.search);
        }
      } catch (error) {
        // Error checking authentication - treat as not authenticated
        console.error('ProtectedRoute: Error checking authentication:', error);

        // Redirect to login with error message
        const loginUrl = new URL(redirectPath, window.location.origin);
        loginUrl.searchParams.set('redirect', pathname || '/dashboard');
        loginUrl.searchParams.set('message', 'Authentication error. Please log in again.');

        router.push(loginUrl.pathname + loginUrl.search);
      }
    }

    checkAuth();
  }, [router, pathname, redirectPath]);

  // Show loading state while checking authentication
  if (loading) {
    if (!showLoading) {
      return null;
    }

    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show nothing during redirect (loading is false but not authenticated)
  if (!authenticated) {
    return null;
  }

  // User is authenticated - render children
  return <>{children}</>;
}

/**
 * Hook to check authentication status
 *
 * Useful for components that need to conditionally render based on auth status.
 *
 * @returns Object with authentication status and loading state
 */
export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const authStatus = await isAuthenticated();
        setAuthenticated(authStatus);

        if (authStatus) {
          const session = await getSession();
          setUserId(session?.user?.id || null);
        }
      } catch (error) {
        console.error('useAuth: Error checking authentication:', error);
        setAuthenticated(false);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return {
    loading,
    authenticated,
    userId,
  };
}
