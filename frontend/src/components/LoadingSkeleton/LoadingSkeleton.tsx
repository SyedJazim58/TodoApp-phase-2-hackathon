/**
 * Loading Skeleton Components
 *
 * Skeleton screens for better perceived performance during data loading.
 * Provides visual feedback while content is being fetched.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T068
 * Created: 2026-02-09
 */

'use client';

/**
 * Base skeleton component for creating custom skeletons
 */
interface SkeletonProps {
  /** Width of the skeleton */
  width?: string;

  /** Height of the skeleton */
  height?: string;

  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  /** Additional CSS classes */
  className?: string;
}

/**
 * Base Skeleton Component
 *
 * Creates an animated skeleton placeholder with pulsing effect.
 *
 * Usage:
 * ```tsx
 * <Skeleton width="100%" height="20px" rounded="md" />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
}: SkeletonProps) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`bg-gray-200 animate-pulse ${roundedClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Task Item Skeleton
 *
 * Skeleton placeholder for a task item in the task list.
 * Mimics the structure of the actual TaskItem component.
 */
export function TaskItemSkeleton() {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Checkbox skeleton */}
        <Skeleton width="20px" height="20px" rounded="sm" className="mt-1 flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <Skeleton width="70%" height="20px" rounded="md" className="mb-3" />

          {/* Description skeleton */}
          <div className="space-y-2 mb-3">
            <Skeleton width="100%" height="16px" rounded="md" />
            <Skeleton width="85%" height="16px" rounded="md" />
          </div>

          {/* Metadata skeleton */}
          <div className="flex items-center gap-4 text-sm">
            <Skeleton width="120px" height="14px" rounded="md" />
            <Skeleton width="100px" height="14px" rounded="md" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton width="32px" height="32px" rounded="md" />
          <Skeleton width="32px" height="32px" rounded="md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Task List Skeleton
 *
 * Skeleton placeholder for the entire task list.
 * Shows multiple task item skeletons.
 */
interface TaskListSkeletonProps {
  /** Number of skeleton items to display */
  count?: number;
}

export function TaskListSkeleton({ count = 5 }: TaskListSkeletonProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 divide-y divide-gray-200">
      {Array.from({ length: count }).map((_, index) => (
        <TaskItemSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Dashboard Header Skeleton
 *
 * Skeleton placeholder for the dashboard header section.
 */
export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and count skeleton */}
        <div className="space-y-2">
          <Skeleton width="200px" height="32px" rounded="md" />
          <Skeleton width="120px" height="20px" rounded="md" />
        </div>

        {/* Button skeleton */}
        <Skeleton width="140px" height="40px" rounded="md" className="hidden sm:block" />
      </div>
    </div>
  );
}

/**
 * Full Dashboard Skeleton
 *
 * Complete skeleton for the dashboard page including header and task list.
 */
interface DashboardSkeletonProps {
  /** Number of task skeletons to show */
  taskCount?: number;
}

export function DashboardSkeleton({ taskCount = 5 }: DashboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton is handled by actual Navbar component */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeaderSkeleton />
        <TaskListSkeleton count={taskCount} />
      </div>
    </div>
  );
}

/**
 * Card Skeleton
 *
 * Generic card skeleton for various card-based layouts.
 */
interface CardSkeletonProps {
  /** Whether to show a header section */
  showHeader?: boolean;

  /** Number of content lines */
  lines?: number;
}

export function CardSkeleton({ showHeader = true, lines = 3 }: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      {showHeader && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <Skeleton width="60%" height="24px" rounded="md" />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '75%' : '100%'}
            height="16px"
            rounded="md"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Form Skeleton
 *
 * Skeleton for form loading states.
 */
interface FormSkeletonProps {
  /** Number of form fields */
  fields?: number;
}

export function FormSkeleton({ fields = 3 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="120px" height="16px" rounded="md" />
          <Skeleton width="100%" height="40px" rounded="md" />
        </div>
      ))}

      {/* Button skeleton */}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton width="100px" height="40px" rounded="md" />
        <Skeleton width="120px" height="40px" rounded="md" />
      </div>
    </div>
  );
}

/**
 * Text Skeleton
 *
 * Simple text line skeleton with optional lines.
 */
interface TextSkeletonProps {
  /** Number of lines */
  lines?: number;

  /** Width of the last line (percentage) */
  lastLineWidth?: string;
}

export function TextSkeleton({ lines = 1, lastLineWidth = '75%' }: TextSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height="16px"
          rounded="md"
        />
      ))}
    </div>
  );
}

/**
 * Avatar Skeleton
 *
 * Circular skeleton for user avatars.
 */
interface AvatarSkeletonProps {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarSkeleton({ size = 'md' }: AvatarSkeletonProps) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return <Skeleton width="auto" height="auto" rounded="full" className={sizeClass} />;
}

/**
 * Button Skeleton
 *
 * Skeleton for button elements.
 */
interface ButtonSkeletonProps {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Width of the button */
  width?: string;
}

export function ButtonSkeleton({ size = 'md', width = '120px' }: ButtonSkeletonProps) {
  const heightClass = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  }[size];

  return <Skeleton width={width} height={heightClass} rounded="md" />;
}

export default {
  Skeleton,
  TaskItemSkeleton,
  TaskListSkeleton,
  DashboardHeaderSkeleton,
  DashboardSkeleton,
  CardSkeleton,
  FormSkeleton,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
};
