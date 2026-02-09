/**
 * TaskItem Component
 *
 * Individual task display component with completion toggle.
 * Displays task information and provides actions for edit and delete.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T032
 * Created: 2026-02-09
 */

'use client';

import { Task } from '@/types/task';

/**
 * TaskItem component props
 */
interface TaskItemProps {
  /** Task to display */
  task: Task;

  /** Callback when task completion is toggled */
  onToggleComplete: (taskId: string, currentCompleted: boolean) => void;

  /** Callback when edit button is clicked */
  onEdit: (task: Task) => void;

  /** Callback when delete button is clicked */
  onDelete: (taskId: string) => void;

  /** Whether the task is currently being updated */
  isUpdating?: boolean;
}

/**
 * TaskItem Component
 *
 * Displays a single task with:
 * - Completion checkbox with toggle functionality
 * - Task title (strikethrough if completed)
 * - Task description
 * - Creation and update timestamps
 * - Edit and delete action buttons
 * - Loading state during updates
 * - Responsive design for mobile and desktop
 *
 * Accessibility:
 * - Semantic HTML with proper aria labels
 * - Keyboard accessible buttons
 * - Focus visible states
 * - Screen reader friendly labels
 */
export default function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isUpdating = false
}: TaskItemProps) {
  /**
   * Handle checkbox toggle
   */
  function handleToggle() {
    if (!isUpdating) {
      onToggleComplete(task.id, task.completed);
    }
  }

  /**
   * Handle edit button click
   */
  function handleEdit() {
    if (!isUpdating) {
      onEdit(task);
    }
  }

  /**
   * Handle delete button click
   */
  function handleDelete() {
    if (!isUpdating) {
      onDelete(task.id);
    }
  }

  /**
   * Format date for display
   */
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div
      className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: checkbox and content */}
        <div className="flex-1 min-w-0 flex items-start gap-3">
          {/* Completion checkbox */}
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleToggle}
              disabled={isUpdating}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              aria-label={
                task.completed
                  ? `Mark "${task.title}" as incomplete`
                  : `Mark "${task.title}" as complete`
              }
            />
          </div>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            {/* Task title */}
            <h3
              className={`text-base sm:text-lg font-medium break-words ${
                task.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>

            {/* Task description */}
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 break-words">
                {task.description}
              </p>
            )}

            {/* Task metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center">
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Created: {formatDate(task.created_at)}
              </span>
              {task.updated_at !== task.created_at && (
                <span className="flex items-center">
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Updated: {formatDate(task.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: action buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Edit button */}
          <button
            onClick={handleEdit}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Edit "${task.title}"`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Delete "${task.title}"`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading indicator overlay when updating */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
