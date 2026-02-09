/**
 * Toast Notification Component
 *
 * Displays success, error, and info notifications with auto-dismiss.
 * Used for showing feedback after CRUD operations.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T042
 * Created: 2026-02-09
 */

'use client';

import { useEffect } from 'react';

/**
 * Toast type determines the visual style
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Toast component props
 */
interface ToastProps {
  /** Message to display */
  message: string;

  /** Type of toast (success, error, info) */
  type: ToastType;

  /** Callback when toast is dismissed */
  onClose: () => void;

  /** Auto-dismiss duration in milliseconds (default: 3000) */
  duration?: number;
}

/**
 * Toast Notification Component
 *
 * Displays a notification message with auto-dismiss functionality.
 * Appears at the top-right of the screen with appropriate colors
 * based on the toast type.
 *
 * Features:
 * - Auto-dismiss after specified duration
 * - Manual close button
 * - Responsive design
 * - Slide-in animation
 * - Different colors for success, error, and info
 */
export default function Toast({
  message,
  type,
  onClose,
  duration = 3000
}: ToastProps) {
  /**
   * Auto-dismiss after duration
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  /**
   * Get icon based on toast type
   */
  function getIcon() {
    switch (type) {
      case 'success':
        return (
          <svg
            className="h-6 w-6 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            className="h-6 w-6 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  }

  /**
   * Get background color class based on toast type
   */
  function getBackgroundColor() {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  }

  /**
   * Get text color class based on toast type
   */
  function getTextColor() {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg border shadow-lg animate-slide-in-right max-w-md ${getBackgroundColor()}`}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0">{getIcon()}</div>

      {/* Message */}
      <div className={`ml-3 text-sm font-medium ${getTextColor()}`}>
        {message}
      </div>

      {/* Close button */}
      <button
        type="button"
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white/50 transition-colors ${getTextColor()}`}
        onClick={onClose}
        aria-label="Close"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
