/**
 * Dashboard Page
 *
 * Protected route displaying user's task list.
 * Main page for authenticated users to view and manage their tasks.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T023, T026-T043
 * Created: 2026-02-09
 * Updated: 2026-02-09 (User Story 2: Task Management)
 */

'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/lib/better-auth';
import { getAllTasks } from '@/services/task-service';
import { Task } from '@/types/task';
import { ApiError } from '@/services/api-client';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Navbar from '@/components/Navbar/Navbar';
import TaskList from '@/components/TaskList/TaskList';
import { InlineAccessDenied } from '@/components/AccessDenied/AccessDenied';
import { DashboardSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

/**
 * Dashboard Content Component
 *
 * Contains the main dashboard UI with task list display.
 * Separated from DashboardPage to keep protection logic clean.
 *
 * T034: Integrate TaskList into dashboard page
 */
function DashboardContent() {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  /**
   * Fetch user ID and tasks on component mount
   * T026: Session persistence verification happens automatically via Better Auth
   * T027: Connect to backend GET /api/{user_id}/tasks endpoint
   * T040: User ID from JWT session matches API URL user_id (enforced in task service)
   */
  useEffect(() => {
    async function fetchTasks() {
      try {
        // Get authenticated user ID
        const currentUserId = await getUserId();

        if (!currentUserId) {
          setError('Unable to identify user. Please log in again.');
          setLoading(false);
          return;
        }

        setUserId(currentUserId);

        // Fetch tasks from backend using task service
        // T027: Using task service which calls API client with automatic JWT attachment
        // T043: Backend filters tasks by authenticated user_id (enforced server-side)
        const fetchedTasks = await getAllTasks();

        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        console.error('DashboardContent: Error fetching tasks:', err);

        // T060: Handle 403 errors specifically (authorization failure)
        if (err instanceof ApiError && err.statusCode === 403) {
          setIsAccessDenied(true);
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load tasks. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  /**
   * Handle tasks updated from TaskList component
   * Updates local state to keep UI in sync
   */
  function handleTasksUpdated(updatedTasks: Task[]) {
    setTasks(updatedTasks);
  }

  /**
   * T029: Loading state during authentication and data fetching
   * T068: Loading skeleton screens for better perceived performance
   */
  if (loading) {
    return (
      <>
        <Navbar />
        <DashboardSkeleton taskCount={5} />
      </>
    );
  }

  /**
   * Error state - T060: Show AccessDenied for 403 errors
   */
  if (error) {
    // T056: Display access denied message for 403 errors
    if (isAccessDenied) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InlineAccessDenied message={error} />
          </div>
        </div>
      );
    }

    // Generic error display for other errors
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="rounded-md bg-red-50 p-4 max-w-md mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Tasks</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Task list view with integrated TaskList component
   * T028: Empty state is now handled by TaskList component
   * T034: TaskList component integrated
   */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="mt-2 text-gray-600">
              {tasks.length === 0
                ? 'No tasks yet'
                : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
            </p>
          </div>
          {tasks.length > 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Task
            </button>
          )}
        </div>

        {/* TaskList component with all CRUD operations */}
        {/* T030-T043: Full task management implementation */}
        <TaskList
          initialTasks={tasks}
          onTasksUpdated={handleTasksUpdated}
        />
      </div>
    </div>
  );
}

/**
 * Dashboard Page
 *
 * Protected route wrapper for the dashboard.
 * Ensures only authenticated users can access this page.
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
