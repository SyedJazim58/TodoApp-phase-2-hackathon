# Data Model: Frontend Application & Full-Stack Integration

**Feature**: 003-frontend-fullstack-integration
**Date**: 2026-02-09

## Frontend-Specific Data Models

These represent the frontend's view of data structures and state management, corresponding to backend entities.

### UserSession

Represents the authenticated user state managed by Better Auth.

- **id**: string - Session identifier from Better Auth
- **user_id**: string - Unique identifier for the authenticated user (from JWT)
- **email**: string - User's email address (from JWT)
- **expires_at**: Date - Expiration timestamp of the session/JWT
- **access_token**: string - JWT token (stored by Better Auth, not manually handled)

**Validation Rules**:
- user_id must be present and non-empty
- email must be a valid email format
- expires_at must be in the future
- access_token must be a valid JWT format

**State Transitions**:
- Anonymous → Authenticated (on successful login/signup)
- Authenticated → Expired (when token expires)
- Expired → Authenticated (on re-authentication)

### ApiRequest

Represents a frontend-to-backend API communication.

- **method**: string (GET|POST|PUT|DELETE|PATCH)
- **url**: string - Target URL with user_id properly set from session
- **headers**: object - Including Authorization: Bearer <token>
- **body**: object|null - Request payload for POST/PUT
- **timestamp**: Date - When request was initiated

**Validation Rules**:
- method must be a valid HTTP method
- url must follow /api/{user_id}/tasks pattern
- headers must include valid Authorization header
- body must conform to endpoint requirements when present

### ApiResponse

Represents backend response processed by frontend.

- **status**: number - HTTP status code
- **data**: object|array|null - Response payload
- **error**: string|null - Error message if status indicates error
- **timestamp**: Date - When response was received

**Validation Rules**:
- status must be valid HTTP status
- data must match expected structure for endpoint
- error must be present for error statuses (4xx, 5xx)

### TaskView

Represents user's task as displayed in UI, mirroring backend Task entity.

- **id**: string - Unique identifier from backend
- **user_id**: string - Owner's user_id (from API response, must match session)
- **title**: string - Task title (max 255 chars)
- **description**: string - Optional task description
- **completed**: boolean - Completion status
- **created_at**: Date - Creation timestamp
- **updated_at**: Date - Last update timestamp

**Validation Rules**:
- id must be non-empty
- user_id must match authenticated user_id from session
- title must be present and non-empty
- completed defaults to false if not provided

### ProtectedRoute

Represents authenticated route requiring session validation.

- **path**: string - Route path requiring authentication
- **allowed_roles**: array - Not used (all authenticated users have same access)
- **redirect_to**: string - Destination for unauthenticated access (typically /login)

**Validation Rules**:
- path must be a valid route pattern
- redirect_to must be a valid route

## State Management Patterns

### Session State
- Managed by Better Auth (not custom implementation)
- Persists across browser refresh
- Validates automatically on route access

### API State
- Loading states during requests
- Error states for failed requests
- Success states for completed requests
- Automatic retries for certain error types

### UI State
- Form inputs for task creation/editing
- Task list filtering and sorting
- Error messages display
- Success notifications