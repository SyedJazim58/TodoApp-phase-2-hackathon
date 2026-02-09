/**
 * Centralized API Client with Automatic JWT Handling
 *
 * This module provides a unified HTTP client for all backend API requests
 * with automatic JWT token extraction, attachment, and comprehensive error handling.
 *
 * Features:
 * - Automatic JWT token extraction from Better Auth session
 * - Token attachment to all API requests via Authorization header
 * - Comprehensive error handling for 401, 403, 500, and network errors
 * - Automatic session clearing and redirect on token expiry
 * - Type-safe request/response handling
 * - Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)
 *
 * Security:
 * - JWT tokens are securely extracted from Better Auth session
 * - Tokens are never stored in localStorage or sessionStorage
 * - Session automatically cleared on authentication failures
 * - Redirects to login on expired/invalid tokens
 *
 * @module services/api-client
 */

import { getAccessToken, authClient } from "@/lib/better-auth";

/**
 * API Configuration
 * Base URL is loaded from environment variable
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * HTTP Methods supported by the API client
 */
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Context preservation for retry after re-authentication
 * Stores the last failed request context in sessionStorage for retry
 */
interface RequestContext {
  endpoint: string;
  config: ApiRequestConfig;
  timestamp: number;
}

/**
 * Store request context for retry after re-authentication
 * @param endpoint - API endpoint
 * @param config - Request configuration
 */
function storeRequestContext(endpoint: string, config: ApiRequestConfig): void {
  if (typeof window === "undefined") return;

  const context: RequestContext = {
    endpoint,
    config,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem("pending_request_context", JSON.stringify(context));
  } catch (error) {
    console.error("Failed to store request context:", error);
  }
}

/**
 * Retrieve stored request context for retry after re-authentication
 * @returns Stored request context or null if not found
 */
export function getStoredRequestContext(): RequestContext | null {
  if (typeof window === "undefined") return null;

  try {
    const contextJson = sessionStorage.getItem("pending_request_context");
    if (!contextJson) return null;

    const context: RequestContext = JSON.parse(contextJson);

    // Only return context if it's less than 5 minutes old
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - context.timestamp > fiveMinutes) {
      sessionStorage.removeItem("pending_request_context");
      return null;
    }

    return context;
  } catch (error) {
    console.error("Failed to retrieve request context:", error);
    return null;
  }
}

/**
 * Clear stored request context after successful retry
 */
export function clearStoredRequestContext(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem("pending_request_context");
  } catch (error) {
    console.error("Failed to clear request context:", error);
  }
}

/**
 * Retry a stored request after re-authentication
 * @returns Promise resolving to the response data
 */
export async function retryStoredRequest<T>(): Promise<T | null> {
  const context = getStoredRequestContext();
  if (!context) return null;

  try {
    const result = await apiRequest<T>(context.endpoint, context.config);
    clearStoredRequestContext();
    return result;
  } catch (error) {
    clearStoredRequestContext();
    throw error;
  }
}

/**
 * API Request configuration options
 */
interface ApiRequestConfig {
  /**
   * HTTP method for the request
   */
  method: HttpMethod;

  /**
   * Request body data (will be JSON stringified)
   */
  body?: unknown;

  /**
   * Additional headers to merge with default headers
   */
  headers?: Record<string, string>;

  /**
   * Whether to include JWT token in Authorization header
   * @default true
   */
  requiresAuth?: boolean;
}

/**
 * API Error class with additional context
 * Extends Error with status code and error code information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Standard error response format from backend API
 */
interface ErrorResponse {
  error: string;
  code?: string;
}

/**
 * Handle HTTP error responses with appropriate actions
 *
 * Error Handling Strategy:
 * - 401 Unauthorized: Clear session and redirect to login with "session expired" message
 * - 403 Forbidden: Return error for component to display "access denied"
 * - 500 Server Error: Return generic error message
 * - Network errors: Return connectivity error message
 *
 * @param response - HTTP Response object
 * @throws ApiError with appropriate message and status code
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorData: ErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    // If response body is not valid JSON, use status text
    errorData = {
      error: response.statusText || "An error occurred",
      code: "UNKNOWN_ERROR",
    };
  }

  const { error: errorMessage, code: errorCode } = errorData;

  // Handle 401 Unauthorized - Session expired or invalid token
  if (response.status === 401) {
    console.error("Authentication failed: Token expired or invalid");

    // Clear the Better Auth session
    try {
      await authClient.signOut();
    } catch (signOutError) {
      console.error("Failed to clear session:", signOutError);
    }

    // Redirect to login with session expired message
    // Using query parameter to display message on login page
    if (typeof window !== "undefined") {
      const loginUrl = `/login?expired=true&redirect=${encodeURIComponent(window.location.pathname)}`;
      window.location.href = loginUrl;
    }

    throw new ApiError(
      errorMessage || "Your session has expired. Please log in again.",
      401,
      errorCode || "AUTH_EXPIRED"
    );
  }

  // Handle 403 Forbidden - Authorization failure (accessing another user's resources)
  if (response.status === 403) {
    console.error("Authorization failed: Access denied to resource");

    throw new ApiError(
      errorMessage || "Access Denied: You cannot access another user's resources.",
      403,
      errorCode || "ACCESS_DENIED"
    );
  }

  // Handle 404 Not Found - Resource doesn't exist
  if (response.status === 404) {
    throw new ApiError(
      errorMessage || "The requested resource was not found.",
      404,
      errorCode || "RESOURCE_NOT_FOUND"
    );
  }

  // Handle 422 Validation Error - Request data validation failed
  if (response.status === 422) {
    throw new ApiError(
      errorMessage || "Request validation failed. Please check your input.",
      422,
      errorCode || "VALIDATION_ERROR"
    );
  }

  // Handle 500+ Server Errors - Internal server error
  if (response.status >= 500) {
    throw new ApiError(
      errorMessage || "A server error occurred. Please try again later.",
      response.status,
      errorCode || "SERVER_ERROR"
    );
  }

  // Handle other client errors (400, etc.)
  throw new ApiError(
    errorMessage || "An error occurred while processing your request.",
    response.status,
    errorCode
  );
}

/**
 * Handle network errors (connection failures, timeouts, etc.)
 *
 * @param error - Error object from fetch
 * @throws ApiError with network error details
 */
function handleNetworkError(error: unknown): never {
  console.error("Network error:", error);

  const message = error instanceof Error
    ? error.message
    : "Network error. Please check your internet connection.";

  throw new ApiError(
    "Unable to connect to the server. Please check your internet connection and try again.",
    0,
    "NETWORK_ERROR"
  );
}

/**
 * Make an authenticated API request with automatic JWT handling
 *
 * This is the core method that:
 * 1. Extracts JWT token from Better Auth session (if required)
 * 2. Attaches token to Authorization header
 * 3. Makes the HTTP request
 * 4. Handles all error scenarios appropriately
 *
 * @param endpoint - API endpoint path (e.g., "/api/123/tasks")
 * @param config - Request configuration options
 * @returns Promise resolving to the response data
 * @throws ApiError for any request failures
 *
 * @example
 * ```typescript
 * // GET request
 * const tasks = await apiRequest<Task[]>('/api/user-123/tasks', {
 *   method: 'GET'
 * });
 *
 * // POST request
 * const newTask = await apiRequest<Task>('/api/user-123/tasks', {
 *   method: 'POST',
 *   body: { title: 'New task', description: 'Task details' }
 * });
 * ```
 */
async function apiRequest<T>(
  endpoint: string,
  config: ApiRequestConfig
): Promise<T> {
  const { method, body, headers = {}, requiresAuth = true } = config;

  try {
    // Build request headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Extract and attach JWT token if authentication is required
    if (requiresAuth) {
      const token = await getAccessToken();

      if (!token) {
        // No token available - redirect to login
        if (typeof window !== "undefined") {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        throw new ApiError("Authentication required", 401, "AUTH_REQUIRED");
      }

      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;

    // Make the HTTP request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // Include cookies for cross-origin requests
    });

    // Handle error responses
    if (!response.ok) {
      // Store request context for 401 errors (session expiry) to allow retry after re-auth
      if (response.status === 401 && method !== "GET") {
        storeRequestContext(endpoint, config);
      }

      await handleErrorResponse(response);
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse and return JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    handleNetworkError(error);
  }
}

/**
 * Convenience method for GET requests
 *
 * @param endpoint - API endpoint path
 * @param requiresAuth - Whether to include JWT token (default: true)
 * @returns Promise resolving to the response data
 *
 * @example
 * ```typescript
 * const tasks = await get<Task[]>('/api/user-123/tasks');
 * ```
 */
export async function get<T>(
  endpoint: string,
  requiresAuth = true
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET", requiresAuth });
}

/**
 * Convenience method for POST requests
 *
 * @param endpoint - API endpoint path
 * @param body - Request body data
 * @param requiresAuth - Whether to include JWT token (default: true)
 * @returns Promise resolving to the response data
 *
 * @example
 * ```typescript
 * const newTask = await post<Task>('/api/user-123/tasks', {
 *   title: 'New task',
 *   description: 'Task details'
 * });
 * ```
 */
export async function post<T>(
  endpoint: string,
  body: unknown,
  requiresAuth = true
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "POST", body, requiresAuth });
}

/**
 * Convenience method for PUT requests
 *
 * @param endpoint - API endpoint path
 * @param body - Request body data
 * @param requiresAuth - Whether to include JWT token (default: true)
 * @returns Promise resolving to the response data
 *
 * @example
 * ```typescript
 * const updatedTask = await put<Task>('/api/user-123/tasks/task-456', {
 *   title: 'Updated title',
 *   completed: true
 * });
 * ```
 */
export async function put<T>(
  endpoint: string,
  body: unknown,
  requiresAuth = true
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "PUT", body, requiresAuth });
}

/**
 * Convenience method for PATCH requests
 *
 * @param endpoint - API endpoint path
 * @param body - Request body data (partial updates)
 * @param requiresAuth - Whether to include JWT token (default: true)
 * @returns Promise resolving to the response data
 *
 * @example
 * ```typescript
 * const updatedTask = await patch<Task>('/api/user-123/tasks/task-456', {
 *   completed: true
 * });
 * ```
 */
export async function patch<T>(
  endpoint: string,
  body: unknown,
  requiresAuth = true
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "PATCH", body, requiresAuth });
}

/**
 * Convenience method for DELETE requests
 *
 * @param endpoint - API endpoint path
 * @param requiresAuth - Whether to include JWT token (default: true)
 * @returns Promise resolving when deletion is complete
 *
 * @example
 * ```typescript
 * await del('/api/user-123/tasks/task-456');
 * ```
 */
export async function del(
  endpoint: string,
  requiresAuth = true
): Promise<void> {
  return apiRequest<void>(endpoint, { method: "DELETE", requiresAuth });
}

/**
 * Health check endpoint (no authentication required)
 *
 * @returns Promise resolving to health check response
 *
 * @example
 * ```typescript
 * const health = await healthCheck();
 * console.log(health.status); // "healthy"
 * ```
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return get<{ status: string; timestamp: string }>("/health", false);
}

/**
 * Export default API client with all methods
 */
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  healthCheck,
};

export default apiClient;
