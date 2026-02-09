/**
 * Task Entity Types
 *
 * TypeScript types for the Task entity matching the backend schema.
 * Based on backend model defined in backend/src/models/task.py
 *
 * Feature: 003-frontend-fullstack-integration
 * Created: 2026-02-09
 */

/**
 * Task entity representing a user's task
 * Matches the backend Task model from SQLModel
 */
export interface Task {
  /** Unique identifier (UUID string from backend) */
  id: string;

  /** Owner's user ID (must match authenticated user) */
  user_id: string;

  /** Task title (max 255 characters) */
  title: string;

  /** Optional task description */
  description: string | null;

  /** Completion status */
  completed: boolean;

  /** Creation timestamp (ISO 8601 string) */
  created_at: string;

  /** Last update timestamp (ISO 8601 string) */
  updated_at: string;
}

/**
 * Task creation data (sent to POST /api/{user_id}/tasks)
 * Required fields for creating a new task
 */
export interface TaskCreateData {
  /** Task title (required, max 255 characters) */
  title: string;

  /** Optional task description */
  description?: string | null;

  /** Optional completion status (defaults to false) */
  completed?: boolean;
}

/**
 * Task update data (sent to PUT /api/{user_id}/tasks/{id})
 * All fields are optional for partial updates
 */
export interface TaskUpdateData {
  /** Optional new title */
  title?: string;

  /** Optional new description */
  description?: string | null;

  /** Optional new completion status */
  completed?: boolean;
}

/**
 * Client-side task view with Date objects instead of strings
 * Used for UI components that need Date manipulation
 */
export interface TaskView extends Omit<Task, 'created_at' | 'updated_at'> {
  /** Creation date as Date object */
  created_at: Date;

  /** Last update date as Date object */
  updated_at: Date;
}

/**
 * Task filter options for client-side filtering
 */
export interface TaskFilter {
  /** Filter by completion status */
  completed?: boolean;

  /** Search in title or description */
  search?: string;

  /** Sort field */
  sortBy?: 'created_at' | 'updated_at' | 'title';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Validation rules for task fields
 */
export const TASK_VALIDATION = {
  /** Maximum length for task title */
  TITLE_MAX_LENGTH: 255,

  /** Minimum length for task title */
  TITLE_MIN_LENGTH: 1,

  /** Maximum length for task description (if enforced) */
  DESCRIPTION_MAX_LENGTH: 10000,
} as const;

/**
 * Helper function to validate task title
 * @param title - Task title to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTaskTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return 'Task title is required';
  }

  if (title.length > TASK_VALIDATION.TITLE_MAX_LENGTH) {
    return `Task title must be ${TASK_VALIDATION.TITLE_MAX_LENGTH} characters or less`;
  }

  return null;
}

/**
 * Helper function to validate task description
 * @param description - Task description to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTaskDescription(description: string | null): string | null {
  if (description && description.length > TASK_VALIDATION.DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${TASK_VALIDATION.DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  return null;
}

/**
 * Helper function to convert Task (with string dates) to TaskView (with Date objects)
 * @param task - Task from API with string timestamps
 * @returns TaskView with Date objects
 */
export function taskToView(task: Task): TaskView {
  return {
    ...task,
    created_at: new Date(task.created_at),
    updated_at: new Date(task.updated_at),
  };
}

/**
 * Type guard to check if value is a Task
 * @param value - Value to check
 * @returns True if value is a valid Task object
 */
export function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === 'string' &&
    typeof task.user_id === 'string' &&
    typeof task.title === 'string' &&
    (task.description === null || typeof task.description === 'string') &&
    typeof task.completed === 'boolean' &&
    typeof task.created_at === 'string' &&
    typeof task.updated_at === 'string'
  );
}
