/**
 * API Response Types
 *
 * TypeScript types for API responses, errors, and pagination.
 * Matches the API contract defined in contracts/api-contract.md
 *
 * Feature: 003-frontend-fullstack-integration
 * Created: 2026-02-09
 */

/**
 * Standard error response format from backend
 * Matches the error format in contracts/api-contract.md
 */
export interface ApiErrorResponse {
  /** Descriptive error message */
  error: string;

  /** Error code for programmatic handling */
  code: string;
}

/**
 * Error codes from the backend API
 * Defined in contracts/api-contract.md
 */
export enum ApiErrorCode {
  /** JWT token has expired (401) */
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  /** JWT token is invalid or malformed (401) */
  AUTH_INVALID = 'AUTH_INVALID',

  /** Attempted to access different user's resources (403) */
  ACCESS_DENIED = 'ACCESS_DENIED',

  /** Requested resource doesn't exist for user (404) */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  /** Request data doesn't meet validation requirements (422) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /** Internal server error (500) */
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * HTTP status codes used by the API
 */
export enum HttpStatus {
  /** Success */
  OK = 200,

  /** Resource created */
  CREATED = 201,

  /** Success with no content */
  NO_CONTENT = 204,

  /** Bad request */
  BAD_REQUEST = 400,

  /** Authentication required or failed */
  UNAUTHORIZED = 401,

  /** Authenticated but not authorized */
  FORBIDDEN = 403,

  /** Resource not found */
  NOT_FOUND = 404,

  /** Validation error */
  UNPROCESSABLE_ENTITY = 422,

  /** Server error */
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Generic success response wrapper
 * Can be used for endpoints that return additional metadata
 */
export interface ApiSuccessResponse<T> {
  /** Response data */
  data: T;

  /** Optional success message */
  message?: string;

  /** Response timestamp */
  timestamp?: string;
}

/**
 * Pagination metadata for list endpoints
 * For future pagination support
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of items */
  totalItems: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there's a next page */
  hasNext: boolean;

  /** Whether there's a previous page */
  hasPrevious: boolean;
}

/**
 * Paginated response wrapper
 * For future pagination support on list endpoints
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];

  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Health check response
 * From GET /health endpoint
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'unhealthy';

  /** Response timestamp */
  timestamp: string;

  /** Optional additional info */
  version?: string;
}

/**
 * API request state for UI components
 * Helps manage loading, error, and success states
 */
export interface ApiRequestState<T> {
  /** Request is in progress */
  loading: boolean;

  /** Response data (null if not loaded or error occurred) */
  data: T | null;

  /** Error if request failed (null if successful or not yet attempted) */
  error: string | null;

  /** Error code if request failed */
  errorCode: string | null;

  /** HTTP status code from response */
  statusCode: number | null;
}

/**
 * Initial state for API request state
 * Use this as the default state in components
 */
export const INITIAL_API_STATE: ApiRequestState<never> = {
  loading: false,
  data: null,
  error: null,
  errorCode: null,
  statusCode: null,
};

/**
 * Helper function to create initial API state with proper typing
 * @returns Initial API state
 */
export function createInitialApiState<T>(): ApiRequestState<T> {
  return {
    loading: false,
    data: null,
    error: null,
    errorCode: null,
    statusCode: null,
  };
}

/**
 * Helper function to create loading state
 * @returns Loading state
 */
export function createLoadingState<T>(): ApiRequestState<T> {
  return {
    loading: true,
    data: null,
    error: null,
    errorCode: null,
    statusCode: null,
  };
}

/**
 * Helper function to create success state
 * @param data - Response data
 * @returns Success state with data
 */
export function createSuccessState<T>(data: T): ApiRequestState<T> {
  return {
    loading: false,
    data,
    error: null,
    errorCode: null,
    statusCode: 200,
  };
}

/**
 * Helper function to create error state
 * @param error - Error message
 * @param errorCode - Error code
 * @param statusCode - HTTP status code
 * @returns Error state
 */
export function createErrorState<T>(
  error: string,
  errorCode: string | null = null,
  statusCode: number | null = null
): ApiRequestState<T> {
  return {
    loading: false,
    data: null,
    error,
    errorCode,
    statusCode,
  };
}

/**
 * Type guard to check if response is an error response
 * @param response - Response to check
 * @returns True if response is an error
 */
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const error = response as Record<string, unknown>;

  return typeof error.error === 'string' && typeof error.code === 'string';
}

/**
 * Type guard to check if response is a success response
 * @param response - Response to check
 * @returns True if response is a success response
 */
export function isApiSuccessResponse<T>(response: unknown): response is ApiSuccessResponse<T> {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const success = response as Record<string, unknown>;

  return 'data' in success;
}
