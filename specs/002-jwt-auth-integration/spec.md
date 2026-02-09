# Feature Specification: Authentication & JWT Integration

**Feature Branch**: `002-jwt-auth-integration`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Authentication & JWT Integration - End-to-end JWT-based authentication between Better Auth (Next.js) and FastAPI backend with stateless token verification and user isolation enforcement"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Login with JWT Token Issuance (Priority: P1)

A user logs in through the Next.js frontend, Better Auth issues a JWT token, and the user can immediately make authenticated API requests to access their personal data.

**Why this priority**: This is the core authentication flow - without it, no other authenticated features can function. This establishes the foundation for all user-specific operations.

**Independent Test**: Can be fully tested by logging in via the frontend and verifying that a valid JWT token is received in the response. Success is measured by the ability to immediately call a protected endpoint (e.g., GET /api/{user_id}/tasks) using the received token and receiving user-specific data.

**Acceptance Scenarios**:

1. **Given** a valid user account exists, **When** the user submits correct login credentials, **Then** Better Auth issues a JWT token containing user_id and email with 7-day expiry
2. **Given** a JWT token was just issued, **When** the frontend makes an API request with "Authorization: Bearer {token}" header, **Then** the backend successfully verifies the token and returns user-specific data
3. **Given** a user logs in successfully, **When** the token payload is decoded, **Then** it contains user_id, email, issued_at timestamp, and expiry timestamp

---

### User Story 2 - Token Verification and User Identity Enforcement (Priority: P1)

The backend receives an API request with a JWT token, verifies its authenticity using the shared secret, extracts the user identity, and enforces that the requesting user can only access their own data.

**Why this priority**: This is equally critical as login - it's the security boundary that prevents unauthorized data access. Without proper verification, the entire authentication system is compromised.

**Independent Test**: Can be tested by making API requests with various tokens (valid, expired, tampered, mismatched user_id) and verifying correct responses: 200 for valid+matching, 401 for invalid/expired, 403 for valid but mismatched user_id.

**Acceptance Scenarios**:

1. **Given** a valid JWT token for user A, **When** user A requests /api/user-a-id/tasks, **Then** the backend returns user A's tasks with HTTP 200
2. **Given** a valid JWT token for user A, **When** user A requests /api/user-b-id/tasks, **Then** the backend returns HTTP 403 Forbidden
3. **Given** an expired JWT token, **When** any API request is made, **Then** the backend returns HTTP 401 Unauthorized with message "Token expired"
4. **Given** a JWT token with invalid signature, **When** any API request is made, **Then** the backend returns HTTP 401 Unauthorized with message "Invalid token signature"
5. **Given** no JWT token provided, **When** a protected API request is made, **Then** the backend returns HTTP 401 Unauthorized with message "Missing authentication token"

---

### User Story 3 - Token Expiry and Re-authentication (Priority: P2)

When a user's JWT token expires after 7 days, the backend rejects requests with that token, and the frontend prompts the user to log in again to receive a fresh token.

**Why this priority**: Token expiry is a critical security feature but doesn't block initial implementation. It ensures tokens don't remain valid indefinitely, limiting the window of opportunity if a token is compromised.

**Independent Test**: Can be tested by creating a token with a 1-second expiry, waiting for it to expire, making an API request, and verifying the backend returns 401 and the frontend redirects to login.

**Acceptance Scenarios**:

1. **Given** a JWT token that expired 1 minute ago, **When** the user makes an API request, **Then** the backend returns HTTP 401 with "Token expired" and the frontend redirects to login
2. **Given** a JWT token will expire in 5 minutes, **When** the user makes an API request, **Then** the backend accepts the token and processes the request normally
3. **Given** a user's token has expired, **When** they log in again, **Then** a new JWT token is issued with a fresh 7-day expiry

---

### User Story 4 - Cross-User Data Isolation Verification (Priority: P2)

The system enforces that no user can access, modify, or delete another user's data, even if they manually craft requests with different user_id parameters.

**Why this priority**: This validates the security guarantee of user isolation. While covered implicitly in P1, explicit testing scenarios ensure edge cases are handled.

**Independent Test**: Can be tested by creating two user accounts, logging in as user A, then attempting to access/modify/delete resources belonging to user B using user B's IDs in the URL while authenticated as user A.

**Acceptance Scenarios**:

1. **Given** user A is authenticated with valid JWT, **When** user A attempts GET /api/user-b-id/tasks/123, **Then** backend returns HTTP 403 Forbidden
2. **Given** user A is authenticated with valid JWT, **When** user A attempts PUT /api/user-b-id/tasks/123, **Then** backend returns HTTP 403 Forbidden before processing any update
3. **Given** user A is authenticated with valid JWT, **When** user A attempts DELETE /api/user-b-id/tasks/123, **Then** backend returns HTTP 403 Forbidden and the resource remains unchanged
4. **Given** user A is authenticated with valid JWT, **When** user A attempts POST /api/user-b-id/tasks, **Then** backend returns HTTP 403 Forbidden

---

### Edge Cases

- **What happens when a user logs in on multiple devices?**
  Each login generates a new independent JWT token. All tokens remain valid until their individual expiry times. Backend validates each token independently without tracking sessions.

- **What happens when the BETTER_AUTH_SECRET is rotated?**
  All previously issued tokens become immediately invalid (signature verification fails). All users must log in again to receive tokens signed with the new secret.

- **What happens if Authorization header is malformed (e.g., missing "Bearer" prefix)?**
  Backend returns HTTP 401 Unauthorized with message "Invalid authorization header format. Expected: Authorization: Bearer <token>".

- **What happens if JWT payload is valid but doesn't contain required claims (user_id, email)?**
  Backend returns HTTP 401 Unauthorized with message "Token missing required claims".

- **How does the system handle concurrent requests from the same user with the same token?**
  All concurrent requests are independently verified. Each request validates the token signature and expiry. No request interference occurs.

- **What happens if a token is valid but the user account has been deleted from the database?**
  This is out of scope for this feature (user management not included), but the expected behavior would be: backend verifies token successfully but subsequent database queries return no user data, resulting in appropriate 404 responses.

## Requirements *(mandatory)*

### Functional Requirements

#### Frontend (Next.js + Better Auth)

- **FR-001**: Frontend MUST configure Better Auth to issue JWT tokens upon successful user authentication
- **FR-002**: JWT tokens MUST include user_id and email in the payload
- **FR-003**: JWT tokens MUST have a configurable expiry time (default: 7 days)
- **FR-004**: Frontend MUST store the received JWT token securely (localStorage or httpOnly cookie)
- **FR-005**: Frontend MUST attach the JWT token to every protected API request using the Authorization header format: "Authorization: Bearer {token}"
- **FR-006**: Frontend MUST handle 401 Unauthorized responses by clearing the stored token and redirecting the user to the login page
- **FR-007**: Frontend MUST handle 403 Forbidden responses by displaying an appropriate error message to the user
- **FR-008**: Frontend MUST NOT send user_id or other user identity in request body/parameters that differs from the authenticated user's identity in the JWT

#### Backend (FastAPI)

- **FR-009**: Backend MUST extract the JWT token from the Authorization header of incoming requests
- **FR-010**: Backend MUST verify the JWT token signature using the BETTER_AUTH_SECRET environment variable
- **FR-011**: Backend MUST validate that the JWT token has not expired
- **FR-012**: Backend MUST decode the user_id and email from the verified JWT token
- **FR-013**: Backend MUST compare the user_id from the JWT token against the user_id in the request URL path
- **FR-014**: Backend MUST reject requests where URL user_id does not match JWT user_id with HTTP 403 Forbidden
- **FR-015**: Backend MUST return HTTP 401 Unauthorized for missing, invalid, or expired tokens
- **FR-016**: Backend MUST return HTTP 403 Forbidden for valid tokens with mismatched user_id
- **FR-017**: Backend MUST filter all database queries by the authenticated user_id from the JWT token
- **FR-018**: Backend MUST NOT trust any client-provided user identity except the user_id extracted from the verified JWT token

#### Security & Configuration

- **FR-019**: Both frontend and backend MUST share the same BETTER_AUTH_SECRET value via environment variables
- **FR-020**: BETTER_AUTH_SECRET MUST be at least 32 characters long and cryptographically random
- **FR-021**: BETTER_AUTH_SECRET MUST be stored in .env files and MUST NOT be committed to version control
- **FR-022**: System MUST use stateless authentication - no session storage on backend or frontend
- **FR-023**: Error responses MUST NOT leak sensitive information (e.g., don't reveal whether a user exists, don't expose token contents)

#### Error Handling

- **FR-024**: System MUST return consistent error response format for all authentication failures
- **FR-025**: Error response for missing token MUST be: `{"error": "Missing authentication token", "code": "AUTH_MISSING"}`
- **FR-026**: Error response for invalid signature MUST be: `{"error": "Invalid token signature", "code": "AUTH_INVALID"}`
- **FR-027**: Error response for expired token MUST be: `{"error": "Token expired", "code": "AUTH_EXPIRED"}`
- **FR-028**: Error response for user mismatch MUST be: `{"error": "Forbidden: Cannot access another user's resources", "code": "AUTH_FORBIDDEN"}`

### Key Entities

- **User**: Represents an authenticated user in the system
  - Identified by unique user_id (string)
  - Has an email address (string)
  - Associated with JWT tokens for authentication
  - Owns Task resources in the system

- **JWT Token**: Cryptographic token representing user authentication
  - Contains user_id (string): Unique identifier for the user
  - Contains email (string): User's email address
  - Contains iat (number): Issued-at timestamp
  - Contains exp (number): Expiration timestamp
  - Signed with BETTER_AUTH_SECRET
  - Transmitted via Authorization header
  - Stateless - no backend storage required

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of authenticated API requests verify JWT signature before processing
- **SC-002**: 0% of cross-user data access attempts succeed (all return 403 Forbidden)
- **SC-003**: Token verification adds less than 10ms to average API response time
- **SC-004**: System handles token expiry gracefully - expired tokens are rejected with 401 and user is prompted to re-authenticate
- **SC-005**: Authentication flow requires zero backend session management - all user identity is derived from JWT
- **SC-006**: Frontend successfully attaches JWT to API requests with 100% consistency
- **SC-007**: Invalid tokens (missing, expired, tampered) are rejected with appropriate HTTP status codes (401 or 403)
- **SC-008**: Users can remain authenticated for the full 7-day token lifetime without forced re-login
- **SC-009**: All protected endpoints enforce user_id matching between JWT and URL parameters

### Qualitative Outcomes

- Engineers can implement JWT middleware without ambiguity - all behavior is explicitly specified
- Security audit reveals no authentication bypass vulnerabilities
- User experience is seamless - authentication happens transparently after login
- Error messages are clear and actionable for both users and developers

## Assumptions

- **ASM-001**: Better Auth is already installed and configured in the Next.js frontend
- **ASM-002**: PyJWT library (or equivalent) is available in the FastAPI backend for JWT verification
- **ASM-003**: URL pattern for protected endpoints follows: `/api/{user_id}/[resource]/[id]`
- **ASM-004**: HTTPS is enforced in production to protect JWT tokens in transit
- **ASM-005**: Frontend framework (Next.js) handles secure token storage (localStorage or httpOnly cookies)
- **ASM-006**: Database already has a user_id column on all user-owned resources (established in Feature 001: Backend Core Data)
- **ASM-007**: No refresh token mechanism is required - users re-authenticate after 7-day expiry

## Dependencies

- **Feature 001: Backend Core & Data Layer** - Provides the database models with user_id fields and repository pattern
- **Better Auth** - External authentication library for Next.js (frontend)
- **PyJWT** - Python library for JWT encoding/decoding (backend)
- **Environment configuration** - Shared BETTER_AUTH_SECRET between frontend and backend

## Out of Scope

The following are explicitly NOT part of this feature:

- User registration and signup UI
- Password reset flows
- Email verification
- User profile management
- Role-based access control (RBAC)
- Permissions beyond user ownership
- OAuth provider integration details (Google, GitHub, etc.)
- Refresh token rotation mechanism
- Multi-factor authentication (MFA)
- Rate limiting or brute-force protection
- Account lockout mechanisms
- Session management or tracking
- "Remember me" functionality
- Device fingerprinting
- Audit logging of authentication events (may be added in future feature)

## Notes

This specification defines the authentication contract between frontend and backend. It focuses on the "what" (user flows, security requirements, error handling) rather than the "how" (specific implementation details).

Key design decisions:
- **Stateless over stateful**: JWT tokens eliminate the need for backend session storage, improving scalability
- **Zero trust**: Every request is independently verified - no implicit trust based on previous requests
- **User isolation first**: Security architecture prioritizes preventing cross-user data access
- **Explicit over implicit**: All behavior (success and error cases) is explicitly defined

This specification is ready for planning (`/sp.plan`) where technical architecture decisions will be made.
