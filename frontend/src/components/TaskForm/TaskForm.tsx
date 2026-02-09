/**
 * TaskForm Component
 *
 * Form component for creating and editing tasks.
 * Provides validation and handles both create and update operations.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T031
 * Created: 2026-02-09
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Task, TaskCreateData, validateTaskTitle, validateTaskDescription, TASK_VALIDATION } from '@/types/task';

/**
 * TaskForm component props
 */
interface TaskFormProps {
  /** Existing task to edit (undefined for create mode) */
  task?: Task;

  /** Callback when form is submitted with valid data */
  onSubmit: (data: TaskCreateData) => void;

  /** Callback when form is cancelled */
  onCancel: () => void;

  /** Whether form is currently submitting */
  isSubmitting?: boolean;
}

/**
 * TaskForm Component
 *
 * Responsive modal form for creating or editing tasks.
 *
 * Features:
 * - Create and edit modes
 * - Client-side validation
 * - Loading state during submission
 * - Keyboard shortcuts (Escape to cancel)
 * - Responsive design (full-screen on mobile, modal on desktop)
 * - Auto-focus on title field
 * - Character count for title
 * - Proper error messaging
 *
 * Validation:
 * - Title: required, max 255 characters
 * - Description: optional, max 10000 characters
 * - Completion status: checkbox
 */
export default function TaskForm({
  task,
  onSubmit,
  onCancel,
  isSubmitting = false
}: TaskFormProps) {
  // Form state
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [completed, setCompleted] = useState(task?.completed || false);

  // Validation errors
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // Determine if in edit mode
  const isEditMode = !!task;

  /**
   * Reset form when task prop changes
   */
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setCompleted(task.completed);
    } else {
      setTitle('');
      setDescription('');
      setCompleted(false);
    }
    setTitleError(null);
    setDescriptionError(null);
  }, [task]);

  /**
   * Handle Escape key to cancel
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isSubmitting]);

  /**
   * Validate title field
   */
  function validateTitle(): boolean {
    const error = validateTaskTitle(title);
    setTitleError(error);
    return error === null;
  }

  /**
   * Validate description field
   */
  function validateDescriptionField(): boolean {
    const error = validateTaskDescription(description);
    setDescriptionError(error);
    return error === null;
  }

  /**
   * Handle form submission
   */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validate all fields
    const isTitleValid = validateTitle();
    const isDescriptionValid = validateDescriptionField();

    if (!isTitleValid || !isDescriptionValid) {
      return;
    }

    // Prepare task data
    const taskData: TaskCreateData = {
      title: title.trim(),
      description: description.trim() || null,
      completed
    };

    // Submit form
    onSubmit(taskData);
  }

  /**
   * Handle backdrop click to close modal
   */
  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onCancel();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Form header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title field */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(null);
              }}
              onBlur={validateTitle}
              disabled={isSubmitting}
              maxLength={TASK_VALIDATION.TITLE_MAX_LENGTH}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                titleError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Enter task title..."
              autoFocus
              required
            />
            <div className="mt-1 flex items-center justify-between">
              <div>
                {titleError && (
                  <p className="text-sm text-red-600">{titleError}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {title.length}/{TASK_VALIDATION.TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError(null);
              }}
              onBlur={validateDescriptionField}
              disabled={isSubmitting}
              maxLength={TASK_VALIDATION.DESCRIPTION_MAX_LENGTH}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none ${
                descriptionError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Enter task description (optional)..."
            />
            <div className="mt-1 flex items-center justify-between">
              <div>
                {descriptionError && (
                  <p className="text-sm text-red-600">{descriptionError}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {description.length}/{TASK_VALIDATION.DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Completed checkbox (only in edit mode) */}
          {isEditMode && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="task-completed"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <label
                htmlFor="task-completed"
                className="ml-2 text-sm text-gray-700"
              >
                Mark as completed
              </label>
            </div>
          )}

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting && (
                <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                ? 'Save Changes'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
