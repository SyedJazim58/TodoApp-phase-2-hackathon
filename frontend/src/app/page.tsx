import Link from 'next/link';

/**
 * Home Page (Landing Page)
 *
 * This is the root page of the application (/).
 * It serves as a landing page with links to signup and login.
 *
 * Server Component: This is a Server Component by default in Next.js App Router.
 * No client-side interactivity needed here.
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Todo App
          </h1>
          <p className="text-lg text-gray-600">
            Manage your tasks efficiently with secure authentication
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/signup"
            className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Get Started - Sign Up
          </Link>

          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Already have an account? Log In
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Secure multi-user task management with Better Auth
        </p>
      </div>
    </main>
  );
}
