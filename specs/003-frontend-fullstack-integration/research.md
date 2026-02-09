# Research: Frontend Application & Full-Stack Integration

**Feature**: 003-frontend-fullstack-integration
**Date**: 2026-02-09
**Research Lead**: Claude

## Research Objectives

1. **Better Auth Integration**: Research best practices for Next.js 16+ App Router integration
2. **JWT Handling**: Investigate centralized API client patterns with automatic JWT attachment
3. **Protected Routes**: Study Next.js App Router authentication middleware patterns
4. **API Client Design**: Find optimal patterns for REST API integration with error handling
5. **Environment Configuration**: Determine secure configuration patterns for BETTER_AUTH_SECRET

## Research Findings

### Decision 1: Better Auth Configuration and Integration
- **Decision**: Implement Better Auth with JWT tokens and session management
- **Rationale**: Better Auth provides secure JWT-based authentication with built-in session management, supporting the stateless authentication requirement from the constitution. It offers easy Next.js integration with App Router middleware.
- **Alternatives considered**:
  - Custom JWT implementation (reinventing security wheel)
  - NextAuth.js (already established, but Better Auth is newer and designed for better security)
  - Firebase Auth (overkill for this use case)
- **Implementation approach**: Use Better Auth's Next.js integration with `authMiddleware` for protected route handling

### Decision 2: Centralized API Client Architecture
- **Decision**: Create a centralized API client module (`lib/api-client.ts`) with automatic JWT handling
- **Rationale**: Ensures all API requests include JWT tokens consistently without manual intervention. Enables unified error handling for 401/403 responses per spec requirements.
- **Alternatives considered**:
  - Manual JWT inclusion in each request (error-prone, inconsistent)
  - Third-party libraries like axios interceptors (adds complexity)
  - Built-in fetch with repeated headers (violates DRY principle)
- **Implementation approach**: Create wrapper functions that automatically extract JWT from Better Auth session and attach to requests

### Decision 3: Protected Route Implementation
- **Decision**: Use Next.js 16+ App Router with middleware for route protection
- **Rationale**: Leverages Next.js native middleware for efficient route protection without client-side flashes of content. Aligns with Next.js best practices for App Router.
- **Alternatives considered**:
  - Client-side HOC protection (causes flash of content before redirect)
  - Server Components with session checks (less flexible)
  - Custom auth provider (redundant with Better Auth)
- **Implementation approach**: Implement `middleware.ts` that uses Better Auth's session verification to protect routes

### Decision 4: API Endpoint Structure
- **Decision**: Use `/api/{user_id}/tasks` pattern as specified in the backend API
- **Rationale**: Maintains consistency with backend API contract from previous feature (002-jwt-auth-integration). Ensures proper user data isolation as required by constitution.
- **Alternatives considered**:
  - Simpler `/api/tasks` with JWT-based user ID extraction (violates backend contract)
  - GraphQL instead of REST (not specified in requirements)
  - Different URL patterns (breaks consistency)
- **Implementation approach**: Extract user_id from Better Auth session and construct API URLs dynamically

### Decision 5: Error Handling Strategy
- **Decision**: Implement global error handler that processes 401/403 responses appropriately
- **Rationale**: Meets spec requirements for handling authentication (401) and authorization (403) failures with proper redirects and user feedback.
- **Alternatives considered**:
  - Per-request error handling (inconsistent behavior)
  - Simple try/catch blocks (misses global patterns)
  - Third-party error handling libraries (unnecessary complexity)
- **Implementation approach**: Create error boundary components and API client interceptors that handle different error codes

### Decision 6: Environment Configuration
- **Decision**: Store BETTER_AUTH_SECRET in environment variables shared between frontend and backend
- **Rationale**: Follows security best practices and enables JWT verification between frontend and backend as required by constitution.
- **Alternatives considered**:
  - Hardcoded secrets (security violation)
  - Different secrets per environment (unnecessary complexity)
  - External secret management (overkill for this project)
- **Implementation approach**: Use `.env.local` for frontend and `.env` for backend with the same BETTER_AUTH_SECRET value

## Technology Stack Confirmation

### Frontend
- **Framework**: Next.js 16+ with App Router
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS or CSS Modules
- **Type Safety**: TypeScript
- **HTTP Client**: Native fetch or axios with interceptors

### Backend Dependencies (already implemented in feature 002)
- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT verification with PyJWT

## Integration Patterns

### Frontend-Backend Communication
1. **Authentication Flow**: User signs up/logs in → Better Auth issues JWT → Stored in Better Auth session
2. **API Requests**: API client extracts JWT → Attaches to Authorization header → Sends request to backend
3. **Authorization**: Backend validates JWT → Verifies signature and expiry → Compares user_id in token with URL → Returns data or error
4. **Error Handling**: 401 → Clear session → Redirect to login; 403 → Show access denied message

### Security Considerations
- JWT tokens stored securely via Better Auth session management
- No manual JWT handling to prevent exposure
- HTTPS in production (enforced by constitution)
- Input sanitization to prevent XSS
- Proper CORS configuration

## Best Practices Identified

### Next.js App Router
- Use `authMiddleware` for protecting routes
- Implement loading states for better UX
- Use Server Actions where appropriate
- Implement proper error boundaries

### Better Auth Integration
- Configure with JWT tokens enabled
- Set appropriate expiration times (7 days per spec)
- Use secure session storage
- Handle session expiry gracefully

### API Client Design
- Singleton pattern for consistency
- Automatic retry mechanisms for transient failures
- Request/response logging for debugging
- Timeout handling

## Risks and Mitigations

### JWT Exposure Risk
- **Risk**: Accidental logging of JWT tokens to console
- **Mitigation**: Implement strict logging policies, never log tokens, use secure HTTP-only cookies where possible

### Session Hijacking Risk
- **Risk**: JWT interception via XSS or network sniffing
- **Mitigation**: HTTPS only in production, Content Security Policy, input sanitization

### Cross-User Data Access
- **Risk**: User accessing another user's data via URL manipulation
- **Mitigation**: Backend validation of JWT user_id against URL user_id (already implemented in feature 002)

## Implementation Prerequisites

1. Backend API (feature 002) must be operational with JWT verification
2. BETTER_AUTH_SECRET must be configured in both frontend and backend environments
3. Database must be connected and accessible to backend
4. Better Auth must be properly configured with JWT support enabled