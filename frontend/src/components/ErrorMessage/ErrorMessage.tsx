/**
 * ErrorMessage Component
 *
 * Standardized error message display component.
 * Provides consistent error styling and formatting across the application.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T064
 * Created: 2026-02-09
 */

'use client';

/**
 * Error message types with associated styling
 */
export type ErrorType = 'error' | 'warning' | 'info';

/**
 * ErrorMessage component props
 */
interface ErrorMessageProps {
  /** Error message to display */
  message: string;

  /** Error type (affects styling) */
  type?: ErrorType;

  /** Additional CSS classes */
  className?: string;

  /** Optional title for the error */
  title?: string;

  /** Whether to show an icon */
  showIcon?: boolean;

  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Get styling classes based on error type
 */
function getTypeClasses(type: ErrorType): {
  container: string;
  icon: string;
  title: string;
  message: string;
} {
  switch (type) {
    case 'error':
      return {
        container: 'bg-red-50 border-red-200',
        icon: 'text-red-400',
        title: 'text-red-800',
        message: 'text-red-700',
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-400',
        title: 'text-yellow-800',
        message: 'text-yellow-700',
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-400',
        title: 'text-blue-800',
        message: 'text-blue-700',
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200',
        icon: 'text-gray-400',
        title: 'text-gray-800',
        message: 'text-gray-700',
      };
  }
}

/**
 * Get icon SVG path based on error type
 */
function getIconPath(type: ErrorType): string {
  switch (type) {
    case 'error':
      return 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z';
    case 'warning':
      return 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z';
    case 'info':
      return 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z';
    default:
      return '';
  }
}

/**
 * ErrorMessage Component
 *
 * Displays error messages with consistent styling across the application.
 *
 * Features:
 * - Multiple error types (error, warning, info)
 * - Optional icon display
 * - Optional title
 * - Optional action button
 * - Responsive design
 * - Proper semantic HTML
 * - Accessibility support
 *
 * Usage:
 * ```tsx
 * <ErrorMessage
 *   message="Failed to load tasks"
 *   type="error"
 *   title="Error Loading Data"
 *   action={{ label: "Retry", onClick: handleRetry }}
 * />
 * ```
 */
export default function ErrorMessage({
  message,
  type = 'error',
  className = '',
  title,
  showIcon = true,
  action,
}: ErrorMessageProps) {
  const classes = getTypeClasses(type);

  return (
    <div
      className={`rounded-md border p-4 ${classes.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${classes.icon}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d={getIconPath(type)}
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className={`text-sm font-medium ${classes.title} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${classes.message}`}>{message}</p>

          {/* Action button */}
          {action && (
            <div className="mt-3">
              <button
                type="button"
                onClick={action.onClick}
                className={`text-sm font-medium ${
                  type === 'error'
                    ? 'text-red-800 hover:text-red-900'
                    : type === 'warning'
                    ? 'text-yellow-800 hover:text-yellow-900'
                    : 'text-blue-800 hover:text-blue-900'
                } underline focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'error'
                    ? 'focus:ring-red-500'
                    : type === 'warning'
                    ? 'focus:ring-yellow-500'
                    : 'focus:ring-blue-500'
                }`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message for form fields
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`} role="alert">
      {message}
    </p>
  );
}

/**
 * Success message component
 */
interface SuccessMessageProps {
  message: string;
  className?: string;
  title?: string;
  showIcon?: boolean;
}

export function SuccessMessage({
  message,
  className = '',
  title,
  showIcon = true,
}: SuccessMessageProps) {
  return (
    <div
      className={`rounded-md border border-green-200 bg-green-50 p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium text-green-800 mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  );
}
