/**
 * Debounce Utility
 *
 * Provides debouncing functionality to prevent rapid duplicate function calls.
 * Useful for form submissions, search inputs, and API requests.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T067
 * Created: 2026-02-09
 */

/**
 * Debounce function
 *
 * Creates a debounced version of the provided function that delays its execution
 * until after the specified delay has elapsed since the last time it was invoked.
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // Call multiple times - only last call after 300ms executes
 * debouncedSearch('test');
 * debouncedSearch('test2');
 * debouncedSearch('test3'); // Only this executes after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>): void {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function
 *
 * Creates a throttled version of the provided function that only executes
 * at most once per specified time period.
 *
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 *
 * // Executes at most once every 100ms even if called repeatedly
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function throttled(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Async debounce function
 *
 * Debounces async functions while preserving Promise behavior.
 * Only the last call's Promise will resolve.
 *
 * @param func - Async function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced async function
 *
 * @example
 * ```typescript
 * const debouncedFetch = debounceAsync(async (id: string) => {
 *   return await fetchData(id);
 * }, 300);
 *
 * const result = await debouncedFetch('123');
 * ```
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let rejectPrevious: ((reason?: any) => void) | null = null;

  return function debouncedAsync(...args: Parameters<T>): Promise<ReturnType<T>> {
    // Reject previous pending promise
    if (rejectPrevious) {
      rejectPrevious(new Error('Debounced: new call made'));
    }

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Return new promise
    return new Promise<ReturnType<T>>((resolve, reject) => {
      rejectPrevious = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
          rejectPrevious = null;
        } catch (error) {
          reject(error);
          rejectPrevious = null;
        }
        timeoutId = null;
      }, delay);
    });
  };
}

/**
 * Form submission debounce hook
 *
 * Prevents rapid form submissions by enforcing a minimum delay between submissions.
 * Returns a boolean indicating if submission is allowed.
 *
 * @param delay - Minimum delay between submissions in milliseconds
 * @returns Object with isSubmitting flag and submit function
 *
 * @example
 * ```typescript
 * const { isSubmitting, canSubmit, submit } = useSubmitDebounce(1000);
 *
 * async function handleSubmit(e: FormEvent) {
 *   e.preventDefault();
 *   if (!canSubmit()) return;
 *
 *   await submit(async () => {
 *     await saveData();
 *   });
 * }
 * ```
 */
export function createSubmitDebouncer(delay: number = 1000) {
  let lastSubmitTime = 0;
  let isCurrentlySubmitting = false;

  return {
    /**
     * Check if submission is allowed (not currently submitting and delay has passed)
     */
    canSubmit(): boolean {
      const now = Date.now();
      const timeSinceLastSubmit = now - lastSubmitTime;
      return !isCurrentlySubmitting && timeSinceLastSubmit >= delay;
    },

    /**
     * Execute submission with debouncing
     */
    async submit<T>(submitFunc: () => Promise<T>): Promise<T> {
      if (isCurrentlySubmitting) {
        throw new Error('Submission already in progress');
      }

      const now = Date.now();
      const timeSinceLastSubmit = now - lastSubmitTime;

      if (timeSinceLastSubmit < delay) {
        throw new Error(`Please wait ${Math.ceil((delay - timeSinceLastSubmit) / 1000)} seconds before submitting again`);
      }

      isCurrentlySubmitting = true;
      lastSubmitTime = now;

      try {
        const result = await submitFunc();
        return result;
      } finally {
        isCurrentlySubmitting = false;
      }
    },

    /**
     * Check if currently submitting
     */
    get isSubmitting(): boolean {
      return isCurrentlySubmitting;
    },

    /**
     * Reset debouncer state
     */
    reset(): void {
      lastSubmitTime = 0;
      isCurrentlySubmitting = false;
    },
  };
}
