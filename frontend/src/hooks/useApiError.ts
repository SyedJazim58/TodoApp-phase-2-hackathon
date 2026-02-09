/**
 * Custom hook for handling API errors in React components
 *
 * Provides a consistent way to handle and display API errors,
 * particularly 401 (authentication) and 403 (authorization) errors.
 *
 * Feature: 003-frontend-fullstack-integration
 * User Stories 3 & 4: Session Expiry and Authorization
 * Created: 2026-02-09
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/services/api-client';

/**
 * Error state managed by the hook
 */
interface ErrorState {
  /** Error message to display */
  message: string;

  /** Error code from API */
  code?: string;

  /** HTTP status code */
  statusCode?: number;

  /** Whether this is a 403 authorization error */
  isAccessDenied: boolean;

  /** Whether this is a 401 authentication error */
  isAuthenticationError: boolean;
}

/**
 * Return type for useApiError hook
 */
interface UseApiErrorReturn {
  /** Current error state (null if no error) */
  error: ErrorState | null;

  /** Set an API error */
  setError: (error: Error | ApiError | string) => void;

  /** Clear the current error */
  clearError: () => void;

  /** Check if an error is currently set */
  hasError: boolean;

  /** Navigate back to dashboard (useful for 403 errors) */
  returnToDashboard: () => void;
}

/**
 * Custom hook for handling API errors
 *
 * This hook provides utilities for handling API errors in components,
 * with special handling for authentication (401) and authorization (403) errors.
 *
 * Features:
 * - Automatic error parsing and categorization
 * - Type-safe error state management
 * - Helper methods for common error scenarios
 * - Integration with Next.js router for navigation
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { error, setError, clearError, hasError, returnToDashboard } = useApiError();
 *
 *   async function fetchData() {
 *     try {
 *       const data = await apiClient.get('/api/user-123/tasks');
 *     } catch (err) {
 *       setError(err);
 *     }
 *   }
 *
 *   if (error?.isAccessDenied) {
 *     return (
 *       <div>
 *         <p>{error.message}</p>
 *         <button onClick={returnToDashboard}>Return to Dashboard</button>
 *       </div>
 *     );
 *   }
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useApiError(): UseApiErrorReturn {
  const router = useRouter();
  const [error, setErrorState] = useState<ErrorState | null>(null);

  /**
   * Parse and set an error
   */
  const setError = useCallback((err: Error | ApiError | string) => {
    // Handle string errors
    if (typeof err === 'string') {
      setErrorState({
        message: err,
        isAccessDenied: false,
        isAuthenticationError: false,
      });
      return;
    }

    // Handle ApiError instances with status codes
    if (err instanceof ApiError) {
      setErrorState({
        message: err.message,
        code: err.errorCode,
        statusCode: err.statusCode,
        isAccessDenied: err.statusCode === 403,
        isAuthenticationError: err.statusCode === 401,
      });
      return;
    }

    // Handle generic Error instances
    setErrorState({
      message: err.message || 'An unexpected error occurred',
      isAccessDenied: false,
      isAuthenticationError: false,
    });
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  /**
   * Navigate back to dashboard
   */
  const returnToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return {
    error,
    setError,
    clearError,
    hasError: error !== null,
    returnToDashboard,
  };
}

/**
 * Higher-order function to wrap API calls with automatic error handling
 *
 * @param apiCall - Async function that makes an API call
 * @param onError - Optional error handler callback
 * @returns Wrapped function with error handling
 *
 * @example
 * ```tsx
 * const { setError } = useApiError();
 *
 * const fetchTasks = withErrorHandler(
 *   async () => {
 *     return await apiClient.get<Task[]>('/api/user-123/tasks');
 *   },
 *   setError
 * );
 *
 * await fetchTasks();
 * ```
 */
export function withErrorHandler<T>(
  apiCall: () => Promise<T>,
  onError: (error: Error | ApiError) => void
): () => Promise<T | undefined> {
  return async () => {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof Error || error instanceof ApiError) {
        onError(error);
      } else {
        onError(new Error('An unexpected error occurred'));
      }
      return undefined;
    }
  };
}

export default useApiError;
