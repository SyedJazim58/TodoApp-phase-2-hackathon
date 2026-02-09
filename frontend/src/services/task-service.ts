/**
 * Task Service
 *
 * Service layer for task CRUD operations with automatic JWT handling.
 * Provides high-level methods for interacting with the backend task API.
 *
 * Features:
 * - Automatic JWT token handling via API client
 * - User ID validation from session
 * - Type-safe request/response handling
 * - Comprehensive error handling
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T033
 * Created: 2026-02-09
 */

import { get, post, put, del } from '@/services/api-client';
import { getUserId } from '@/lib/better-auth';
import { Task, TaskCreateData, TaskUpdateData } from '@/types/task';

/**
 * Get all tasks for the authenticated user
 *
 * Fetches the user ID from the Better Auth session and retrieves
 * all tasks belonging to that user from the backend.
 *
 * @returns Promise resolving to array of tasks
 * @throws ApiError if request fails
 *
 * @example
 * ```typescript
 * const tasks = await getAllTasks();
 * ```
 */
export async function getAllTasks(): Promise<Task[]> {
  // Get authenticated user ID
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Fetch tasks from backend
  // API client automatically attaches JWT token
  return get<Task[]>(`/api/${userId}/tasks`);
}

/**
 * Get a specific task by ID
 *
 * @param taskId - ID of the task to retrieve
 * @returns Promise resolving to the task
 * @throws ApiError if request fails or task not found
 *
 * @example
 * ```typescript
 * const task = await getTask('task-123');
 * ```
 */
export async function getTask(taskId: string): Promise<Task> {
  // Get authenticated user ID
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Fetch task from backend
  return get<Task>(`/api/${userId}/tasks/${taskId}`);
}

/**
 * Create a new task
 *
 * Creates a new task for the authenticated user.
 * The user_id is automatically extracted from the JWT token.
 *
 * @param taskData - Task creation data (title, description, completed)
 * @returns Promise resolving to the created task
 * @throws ApiError if request fails or validation error
 *
 * @example
 * ```typescript
 * const newTask = await createTask({
 *   title: 'Buy groceries',
 *   description: 'Milk, eggs, bread',
 *   completed: false
 * });
 * ```
 */
export async function createTask(taskData: TaskCreateData): Promise<Task> {
  // Get authenticated user ID
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Create task via backend
  // API client automatically attaches JWT token
  return post<Task>(`/api/${userId}/tasks`, taskData);
}

/**
 * Update an existing task
 *
 * Updates a task with partial data. Only provided fields are updated.
 * The backend verifies that the task belongs to the authenticated user.
 *
 * @param taskId - ID of the task to update
 * @param updateData - Partial task data to update
 * @returns Promise resolving to the updated task
 * @throws ApiError if request fails, task not found, or access denied
 *
 * @example
 * ```typescript
 * const updatedTask = await updateTask('task-123', {
 *   completed: true
 * });
 * ```
 */
export async function updateTask(
  taskId: string,
  updateData: TaskUpdateData
): Promise<Task> {
  // Get authenticated user ID
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Update task via backend
  // API client automatically attaches JWT token
  return put<Task>(`/api/${userId}/tasks/${taskId}`, updateData);
}

/**
 * Toggle task completion status
 *
 * Convenience method to toggle a task's completed status.
 * Fetches the current status and updates it to the opposite value.
 *
 * @param taskId - ID of the task to toggle
 * @param currentCompleted - Current completion status
 * @returns Promise resolving to the updated task
 * @throws ApiError if request fails or task not found
 *
 * @example
 * ```typescript
 * const updatedTask = await toggleTaskCompletion('task-123', false);
 * ```
 */
export async function toggleTaskCompletion(
  taskId: string,
  currentCompleted: boolean
): Promise<Task> {
  return updateTask(taskId, {
    completed: !currentCompleted
  });
}

/**
 * Delete a task
 *
 * Permanently deletes a task belonging to the authenticated user.
 * The backend verifies ownership before deletion.
 *
 * @param taskId - ID of the task to delete
 * @returns Promise resolving when deletion is complete
 * @throws ApiError if request fails, task not found, or access denied
 *
 * @example
 * ```typescript
 * await deleteTask('task-123');
 * ```
 */
export async function deleteTask(taskId: string): Promise<void> {
  // Get authenticated user ID
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Delete task via backend
  // API client automatically attaches JWT token
  return del(`/api/${userId}/tasks/${taskId}`);
}

/**
 * Export default service object with all methods
 */
export const taskService = {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
};

export default taskService;
