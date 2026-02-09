/**
 * AccessDenied Component
 *
 * Displays "Access Denied" message when user attempts to access
 * another user's resources (403 Forbidden response).
 *
 * Provides clear messaging and navigation back to dashboard.
 *
 * Feature: 003-frontend-fullstack-integration
 * User Story 4: Authorization Enforcement
 * Tasks: T055-T057
 * Created: 2026-02-09
 */

'use client';

import { useRouter } from 'next/navigation';

/**
 * AccessDenied component props
 */
interface AccessDeniedProps {
  /** Custom error message (optional) */
  message?: string;

  /** Whether to show the "Return to Dashboard" button (default: true) */
  showDashboardButton?: boolean;

  /** Custom callback when user returns to dashboard (optional) */
  onReturnToDashboard?: () => void;
}

/**
 * AccessDenied Component
 *
 * Displays when user attempts to access resources they don't have permission to view.
 * Common scenarios:
 * - Attempting to access another user's tasks
 * - Manually modifying user_id in API URLs
 * - Attempting to perform unauthorized operations
 *
 * Features:
 * - Clear error messaging
 * - Icon to represent access denial
 * - "Return to Dashboard" action button
 * - Responsive design
 * - Accessible markup with ARIA attributes
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <AccessDenied />
 *
 * // With custom message
 * <AccessDenied message="You cannot access this task" />
 *
 * // With custom callback
 * <AccessDenied onReturnToDashboard={() => handleReturn()} />
 * ```
 */
export default function AccessDenied({
  message = "Access Denied: You cannot access another user's resources.",
  showDashboardButton = true,
  onReturnToDashboard,
}: AccessDeniedProps) {
  const router = useRouter();

  /**
   * Handle return to dashboard navigation
   */
  function handleReturnToDashboard() {
    if (onReturnToDashboard) {
      onReturnToDashboard();
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 sm:px-6 lg:px-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Access Denied
            </h1>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-base text-gray-600 sm:text-lg">
              {message}
            </p>
          </div>

          {/* Additional explanation */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authorization Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    You attempted to access resources that belong to another user.
                    This action is not permitted for security and privacy reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showDashboardButton && (
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleReturnToDashboard}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return to Dashboard
              </button>

              <button
                onClick={() => router.back()}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go Back
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}

/**
 * Inline AccessDenied component for use within other components
 * (e.g., within a modal or as part of a larger page)
 */
export function InlineAccessDenied({
  message = "You cannot access this resource.",
  onReturnToDashboard,
}: Pick<AccessDeniedProps, 'message' | 'onReturnToDashboard'>) {
  const router = useRouter();

  function handleReturn() {
    if (onReturnToDashboard) {
      onReturnToDashboard();
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div
      className="rounded-md bg-red-50 border border-red-200 p-4"
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={handleReturn}
              className="text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
