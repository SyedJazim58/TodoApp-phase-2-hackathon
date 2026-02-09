/**
 * Root Layout Component
 *
 * This is the root layout for the Next.js App Router application.
 * It wraps all pages and provides the basic HTML structure.
 *
 * Features:
 * - Metadata configuration for SEO
 * - Global CSS imports
 * - Better Auth session context for authentication state management
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T021
 * Updated: 2026-02-09
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import './globals.css';
import { getSession } from '@/lib/better-auth';

/**
 * Auth Context Provider
 *
 * Wraps the application to provide Better Auth session context.
 * While Better Auth manages sessions internally, this component ensures
 * session verification happens on app load and provides a loading state.
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    /**
     * Initialize session on app load
     * Better Auth handles session persistence automatically,
     * but we verify it's available for the app
     */
    async function initSession() {
      try {
        // Check if session exists
        const session = await getSession();
        console.log('RootLayout: Session initialized', session ? 'Active' : 'None');
      } catch (error) {
        console.error('RootLayout: Error initializing session:', error);
      } finally {
        setSessionChecked(true);
      }
    }

    initSession();
  }, []);

  // Show minimal loading state during session check
  // This prevents flash of unauthenticated content
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Root Layout
 *
 * Provides the HTML structure and wraps the app with AuthProvider.
 * Since this is a Client Component, we can't export metadata directly.
 * Instead, we use the <head> tag in the HTML or set metadata in each page.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Multi-user task management application with secure authentication" />
        <title>Todo App - Task Management</title>
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
