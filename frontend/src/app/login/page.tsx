/**
 * Login Page
 *
 * User authentication page with Better Auth login form.
 * Allows existing users to log in with email and password.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T020
 * Created: 2026-02-09
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient, isAuthenticated } from '@/lib/better-auth';
import { getStoredRequestContext, clearStoredRequestContext, retryStoredRequest } from '@/services/api-client';

/**
 * Form validation errors
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Login Page Component
 *
 * Provides a login form with:
 * - Email and password fields
 * - Client-side validation
 * - Error handling with user-friendly messages
 * - Loading states during submission
 * - Automatic redirect to dashboard on success
 * - Redirect to dashboard if already authenticated
 * - Display session expired message if redirected from API client
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  // Get query parameters
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const expiredParam = searchParams.get('expired');
  const messageParam = searchParams.get('message');

  // Check if there's a stored request context for retry
  const hasStoredContext = typeof window !== 'undefined' && getStoredRequestContext() !== null;

  /**
   * Check if user is already authenticated
   * Redirect to dashboard if already logged in
   */
  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          console.log('LoginPage: User already authenticated, redirecting to dashboard');
          router.push(redirectPath);
          return;
        }

        // Display session expired or custom message
        if (expiredParam === 'true') {
          const message = hasStoredContext
            ? 'Your session has expired. Please log in again to continue your action.'
            : 'Your session has expired. Please log in again.';
          setErrors({ general: message });
        } else if (messageParam) {
          setErrors({ general: messageParam });
        }
      } catch (error) {
        console.error('LoginPage: Error checking authentication:', error);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router, redirectPath, expiredParam, messageParam]);

  /**
   * Validate form fields
   * Returns true if all validations pass, false otherwise
   */
  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Handle form submission
   * Validates input, calls Better Auth login, and redirects on success
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Reset previous messages
    setSuccessMessage('');
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call Better Auth login endpoint
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('LoginPage: Login failed:', error);

        // Handle specific error cases
        if (error.message?.includes('Invalid credentials') || error.message?.includes('not found')) {
          setErrors({ general: 'Invalid email or password. Please try again.' });
        } else {
          setErrors({ general: error.message || 'Login failed. Please try again.' });
        }
        return;
      }

      if (!data) {
        setErrors({ general: 'Login failed. Please try again.' });
        return;
      }

      // Login successful
      console.log('LoginPage: Login successful');

      // Check if there's a stored request context to retry
      if (hasStoredContext) {
        setSuccessMessage('Login successful! Resuming your action...');
        setRetrying(true);

        try {
          // Retry the stored request
          await retryStoredRequest();
          console.log('LoginPage: Successfully retried stored request');
          setSuccessMessage('Action completed successfully! Redirecting...');
        } catch (retryError) {
          console.error('LoginPage: Failed to retry stored request:', retryError);
          clearStoredRequestContext();
          setSuccessMessage('Login successful! Redirecting...');
        }
      } else {
        setSuccessMessage('Login successful! Redirecting...');
      }

      // Wait briefly to show success message, then redirect
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);

    } catch (error) {
      console.error('LoginPage: Unexpected error during login:', error);
      setErrors({
        general: error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* General error message */}
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4" role="status">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Remember me and Forgot password (optional for future) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading || retrying}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading || retrying ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="h-5 w-5 border-b-2 border-white rounded-full animate-spin"></div>
                  </span>
                  {retrying ? 'Resuming action...' : 'Logging in...'}
                </>
              ) : (
                'Log in'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500">
          Secure authentication powered by Better Auth
        </p>
      </div>
    </div>
  );
}
