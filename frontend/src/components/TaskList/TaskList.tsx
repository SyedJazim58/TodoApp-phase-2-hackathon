/**
 * TaskList Component
 *
 * Main component for displaying and managing tasks.
 * Handles all CRUD operations with optimistic UI updates.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T030, T034-T043
 * Created: 2026-02-09
 */

'use client';

import { useState, useCallback } from 'react';
import { Task, TaskCreateData } from '@/types/task';
import {
  getAllTasks,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask
} from '@/services/task-service';
import { ApiError } from '@/services/api-client';
import TaskItem from './TaskItem';
import TaskForm from '@/components/TaskForm/TaskForm';
import Toast, { ToastType } from '@/components/Toast/Toast';

/**
 * TaskList component props
 */
interface TaskListProps {
  /** Initial tasks to display */
  initialTasks: Task[];

  /** Callback when tasks are updated (for parent state management) */
  onTasksUpdated?: (tasks: Task[]) => void;
}

/**
 * Toast notification state
 */
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

/**
 * TaskList Component
 *
 * Comprehensive task management component with:
 * - Display all tasks in a scrollable list
 * - Create new tasks via modal form
 * - Edit existing tasks via modal form
 * - Toggle completion status with single click
 * - Delete tasks with confirmation dialog
 * - Optimistic UI updates with backend reconciliation
 * - Loading states for all operations
 * - Success/error notifications
 * - Responsive design for mobile and desktop
 * - Empty state when no tasks exist
 *
 * Optimistic Updates:
 * - UI updates immediately on user action
 * - Backend request happens in background
 * - On success: keep optimistic changes
 * - On failure: revert to previous state and show error
 *
 * T040: User ID verification happens automatically in task service
 * T043: Backend filters tasks by authenticated user_id (enforced server-side)
 */
export default function TaskList({ initialTasks, onTasksUpdated }: TaskListProps) {
  // Task state
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false
  });

  /**
   * Show toast notification
   */
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  }, []);

  /**
   * Hide toast notification
   */
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  /**
   * Update tasks state and notify parent
   */
  const updateTasksState = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    onTasksUpdated?.(newTasks);
  }, [onTasksUpdated]);

  /**
   * Add task ID to updating set
   */
  const markTaskAsUpdating = useCallback((taskId: string) => {
    setUpdatingTaskIds(prev => new Set(prev).add(taskId));
  }, []);

  /**
   * Remove task ID from updating set
   */
  const unmarkTaskAsUpdating = useCallback((taskId: string) => {
    setUpdatingTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, []);

  /**
   * Handle create new task button click
   * T035: Implement create task functionality
   */
  function handleCreateClick() {
    setEditingTask(undefined);
    setShowForm(true);
  }

  /**
   * Handle edit task button click
   * T036: Implement edit task functionality
   */
  function handleEditClick(task: Task) {
    setEditingTask(task);
    setShowForm(true);
  }

  /**
   * Handle form cancel
   */
  function handleFormCancel() {
    setShowForm(false);
    setEditingTask(undefined);
  }

  /**
   * Handle form submission (create or update)
   * T035, T036, T039: Implement CRUD with optimistic updates
   * T041: Loading states
   * T042: Success notifications
   */
  async function handleFormSubmit(taskData: TaskCreateData) {
    setIsFormSubmitting(true);

    try {
      if (editingTask) {
        // Update existing task
        // T039: Optimistic update - update UI immediately
        const optimisticTask: Task = {
          ...editingTask,
          ...taskData,
          updated_at: new Date().toISOString()
        };

        updateTasksState(
          tasks.map(t => (t.id === editingTask.id ? optimisticTask : t))
        );

        // Backend request
        const updatedTask = await updateTask(editingTask.id, taskData);

        // T039: Reconcile with backend response
        updateTasksState(
          tasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
        );

        // T042: Success notification
        showToast('Task updated successfully', 'success');
      } else {
        // Create new task
        const newTask = await createTask(taskData);

        // Add to task list
        updateTasksState([newTask, ...tasks]);

        // T042: Success notification
        showToast('Task created successfully', 'success');
      }

      // Close form
      setShowForm(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error('TaskList: Error submitting form:', error);

      // Revert optimistic update on error
      if (editingTask) {
        updateTasksState(
          tasks.map(t => (t.id === editingTask.id ? editingTask : t))
        );
      }

      // Show error notification
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : editingTask
          ? 'Failed to update task'
          : 'Failed to create task';

      showToast(errorMessage, 'error');
    } finally {
      setIsFormSubmitting(false);
    }
  }

  /**
   * Handle toggle task completion
   * T037, T039: Implement completion toggle with optimistic update
   * T041: Loading states
   */
  async function handleToggleComplete(taskId: string, currentCompleted: boolean) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // T041: Mark as updating
    markTaskAsUpdating(taskId);

    try {
      // T039: Optimistic update - toggle immediately
      const optimisticTask: Task = {
        ...task,
        completed: !currentCompleted,
        updated_at: new Date().toISOString()
      };

      updateTasksState(tasks.map(t => (t.id === taskId ? optimisticTask : t)));

      // Backend request
      const updatedTask = await toggleTaskCompletion(taskId, currentCompleted);

      // T039: Reconcile with backend response
      updateTasksState(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    } catch (error) {
      console.error('TaskList: Error toggling completion:', error);

      // Revert optimistic update
      updateTasksState(tasks.map(t => (t.id === taskId ? task : t)));

      // Show error notification
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Failed to update task status';

      showToast(errorMessage, 'error');
    } finally {
      unmarkTaskAsUpdating(taskId);
    }
  }

  /**
   * Handle delete task button click
   * T038: Implement delete with confirmation
   */
  function handleDeleteClick(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      handleDeleteConfirmed(taskId);
    }
  }

  /**
   * Handle delete task after confirmation
   * T038, T039: Delete with optimistic update
   * T041: Loading states
   * T042: Success notifications
   */
  async function handleDeleteConfirmed(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Store original task for potential revert
    const originalTask = task;

    // Mark as deleting
    setDeletingTaskId(taskId);

    try {
      // T039: Optimistic update - remove from UI immediately
      updateTasksState(tasks.filter(t => t.id !== taskId));

      // Backend request
      await deleteTask(taskId);

      // T042: Success notification
      showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('TaskList: Error deleting task:', error);

      // Revert optimistic update - restore task
      updateTasksState([...tasks, originalTask].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

      // Show error notification
      const errorMessage =
        error instanceof ApiError ? error.message : 'Failed to delete task';

      showToast(errorMessage, 'error');
    } finally {
      setDeletingTaskId(null);
    }
  }

  /**
   * Empty state when no tasks exist
   */
  if (tasks.length === 0) {
    return (
      <>
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No tasks yet</h2>
          <p className="mt-2 text-gray-600">
            Get started by creating your first task
          </p>
          <button
            onClick={handleCreateClick}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
            Create Task
          </button>
        </div>

        {/* Task form modal */}
        {showForm && (
          <TaskForm
            task={editingTask}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isFormSubmitting}
          />
        )}

        {/* Toast notifications */}
        {toast.visible && (
          <Toast message={toast.message} type={toast.type} onClose={hideToast} />
        )}
      </>
    );
  }

  /**
   * Task list view
   */
  return (
    <>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 divide-y divide-gray-200">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isUpdating={
              updatingTaskIds.has(task.id) || deletingTaskId === task.id
            }
          />
        ))}
      </div>

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isFormSubmitting}
        />
      )}

      {/* Toast notifications */}
      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
