/**
 * ErrorBoundary Component
 *
 * React Error Boundary for graceful error handling.
 * Catches JavaScript errors in child components and displays fallback UI.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T016
 * Created: 2026-02-09
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ApiError } from '@/services/api-client';
import AccessDenied from '@/components/AccessDenied/AccessDenied';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Custom fallback UI to show when error occurs */
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);

  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Whether to show error details in development (default: true) */
  showErrorDetails?: boolean;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;

  /** The caught error */
  error: Error | null;

  /** Error information from React */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary class component
 *
 * Catches errors in child components and displays fallback UI.
 * Logs errors for debugging and monitoring.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   *
   * @param error - The error that was thrown
   * @returns New state
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle the error after it's been caught
   *
   * @param error - The error that was thrown
   * @param errorInfo - React error info (component stack)
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Reset error state
   * Useful for allowing users to retry after an error
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render the component
   */
  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showErrorDetails = true } = this.props;

    // If an error occurred, render fallback UI
    if (hasError && error) {
      // Check if error is a 403 ApiError (Authorization failure)
      if (error instanceof ApiError && error.statusCode === 403) {
        return (
          <AccessDenied
            message={error.message}
            onReturnToDashboard={this.resetError}
          />
        );
      }

      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function' && errorInfo) {
          return fallback(error, errorInfo);
        }
        return fallback;
      }

      // Default fallback UI for other errors
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600">
                We encountered an unexpected error. Please try refreshing the page or contact
                support if the problem persists.
              </p>
            </div>

            {/* Show error details in development */}
            {showErrorDetails && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h4>
                <p className="text-xs text-red-600 font-mono whitespace-pre-wrap break-all">
                  {error.toString()}
                </p>
                {errorInfo && (
                  <>
                    <h4 className="text-sm font-medium text-gray-900 mt-3 mb-2">
                      Component Stack:
                    </h4>
                    <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-all">
                      {errorInfo.componentStack}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={this.resetError}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // No error - render children normally
    return children;
  }
}

/**
 * Functional wrapper for ErrorBoundary with hooks support
 *
 * This is a convenience wrapper that makes it easier to use ErrorBoundary
 * with modern React patterns.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
