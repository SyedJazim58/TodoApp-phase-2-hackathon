# Implementation Plan: Authentication & JWT Integration

**Branch**: `002-jwt-auth-integration` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-jwt-auth-integration/spec.md`

## Summary

Implement JWT-based stateless authentication between Next.js frontend (Better Auth) and FastAPI backend. Enable secure token issuance, transmission, verification, and user identity enforcement. All API endpoints will require valid JWT tokens. Backend will verify token signatures, validate expiry, extract user identity, and enforce user_id matching between JWT claims and URL parameters. Cross-user data access will be impossible through mandatory user_id validation.

**Technical Approach**: Implement FastAPI middleware for JWT verification, configure Better Auth for JWT issuance with user_id/email claims, establish shared secret via environment variables, enforce 401/403 error responses for auth failures.

## Technical Context

**Language/Version**:

- Frontend: TypeScript with Next.js 16+ (App Router)
- Backend: Python 3.11+

**Primary Dependencies**:

- Frontend: Better Auth (authentication library), Next.js 16+, TypeScript
- Backend: FastAPI 0.109+, PyJWT (JWT encoding/decoding), Python-dotenv (environment variables)

**Storage**:

- Neon Serverless PostgreSQL (established in Feature 001)
- No session storage (stateless authentication)

**Testing**:

- Backend: pytest with test coverage for JWT verification, user_id enforcement, error handling
- Frontend: Jest/React Testing Library for token attachment and error handling
- Integration: End-to-end tests for full authentication flow

**Target Platform**:

- Frontend: Web browsers (modern browsers with ES6+ support)
- Backend: Linux server (Docker containers)

**Project Type**: Web application (frontend + backend)

**Performance Goals**:

- Token verification adds < 10ms to API response time (SC-003 from spec)
- System handles concurrent requests without token interference
- Zero latency impact from stateless architecture (no session lookups)

**Constraints**:

- Stateless authentication only - no backend session storage
- No refresh tokens - users re-authenticate after 7-day expiry
- JWT tokens limited to 7KB size (standard JWT size limit)
- BETTER_AUTH_SECRET must be at least 32 characters

**Scale/Scope**:

- Multi-user system with complete data isolation
- Supports unlimited concurrent users (stateless architecture scales horizontally)
- 100% of authenticated endpoints enforce JWT verification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Security-First Design (Zero Trust Architecture)

✅ **PASS** - JWT verification middleware implements zero trust: every request independently verified, no implicit trust, signature validation using shared secret.

### Principle II: User Data Isolation (Mandatory)

✅ **PASS** - User identity extracted from verified JWT token only. URL user_id validated against JWT user_id. Database queries filtered by authenticated user_id. Cross-user access returns HTTP 403.

### Principle III: Spec-Driven Development (Implementation Contract)

✅ **PASS** - All implementation derived from explicit spec (002-jwt-auth-integration/spec.md). 28 functional requirements (FR-001 to FR-028) define behavior. All code traceable to spec requirements.

### Principle IV: Stateless Authentication (JWT-Based)

✅ **PASS** - JWT tokens issued by Better Auth with 7-day expiry. Backend verifies signature, validates expiry, decodes user identity. No session storage. Each request independently verified.

### Principle V: Clear Separation of Concerns

✅ **PASS** - Frontend handles Better Auth configuration and token attachment. Backend handles verification and authorization enforcement. API contract documented in spec (Authorization header, error responses).

### Principle VI: Predictable RESTful API Behavior

✅ **PASS** - Consistent error responses: 401 for missing/invalid/expired tokens, 403 for valid token with user mismatch. Error format standardized (AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED, AUTH_FORBIDDEN codes).

### Principle VII: Smallest Viable Change

✅ **PASS** - Implementation limited to JWT auth only. No refresh tokens, no RBAC, no user management (see spec Out of Scope). Minimal middleware for token verification.

### Principle VIII: Automated Git Workflow with Verification

✅ **PASS** - Will run `/sp.git.commit_pr` after successful implementation with zero runtime errors. Tests must pass before commit.

**Gate Result**: ✅ ALL CHECKS PASSED - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/002-jwt-auth-integration/
├── spec.md                    # Feature specification (DONE)
├── plan.md                    # This file (IN PROGRESS)
├── research.md                # Phase 0 output (PENDING)
├── data-model.md              # Phase 1 output (PENDING)
├── quickstart.md              # Phase 1 output (PENDING)
├── contracts/                 # Phase 1 output (PENDING)
│   ├── jwt-middleware.md      # Backend middleware contract
│   └── auth-responses.md      # Error response formats
└── tasks.md                   # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── auth/                          # NEW: Authentication module
│   │   ├── __init__.py
│   │   ├── jwt_middleware.py          # JWT verification middleware
│   │   ├── dependencies.py            # FastAPI dependencies for auth
│   │   └── exceptions.py              # Auth-specific exception classes
│   ├── models/                        # EXISTING (Feature 001)
│   │   └── task.py
│   ├── repositories/                  # EXISTING (Feature 001)
│   │   └── task_repository.py
│   ├── exceptions/                    # EXISTING (Feature 001)
│   │   └── __init__.py
│   └── database/                      # EXISTING (Feature 001)
│       └── connection.py
├── tests/
│   ├── test_jwt_middleware.py         # NEW: JWT middleware tests
│   ├── test_auth_dependencies.py      # NEW: Auth dependency tests
│   └── test_user_isolation.py         # NEW: Cross-user access tests
├── .env.example                       # UPDATE: Add BETTER_AUTH_SECRET
└── requirements.txt                   # UPDATE: Add PyJWT

frontend/
├── src/                               # NEW: Frontend structure
│   ├── lib/
│   │   └── auth/
│   │       ├── better-auth-config.ts  # Better Auth configuration
│   │       └── auth-client.ts         # API client with JWT attachment
│   ├── middleware.ts                  # Next.js middleware for auth
│   └── app/
│       ├── (auth)/
│       │   ├── login/
│       │   │   └── page.tsx           # Login page
│       │   └── signup/
│       │       └── page.tsx           # Signup page (out of scope for Feature 002)
│       └── api/
│           └── auth/
│               └── [...all].ts        # Better Auth API routes
├── .env.local.example                 # NEW: Frontend env variables
└── package.json                       # UPDATE: Add Better Auth dependency
```

**Structure Decision**: Web application structure (Option 2) selected. Backend (FastAPI) and frontend (Next.js) are separate codebases. New `auth/` module in backend for JWT verification. New `lib/auth/` in frontend for Better Auth configuration and token management.

## Complexity Tracking

> No violations detected - all constitution principles satisfied

---

## Phase 0: Research & Technology Decisions

### Research Topics

1. **PyJWT Library Configuration**
   - Decision: Use PyJWT for backend JWT verification
   - Rationale: Standard Python JWT library, well-maintained, supports all required algorithms (HS256)
   - Alternatives considered: python-jose (more complex, unnecessary features), authlib (over-engineered for stateless JWT)

2. **Better Auth JWT Configuration**
   - Decision: Configure Better Auth with JWT session strategy
   - Rationale: Better Auth supports JWT natively, integrates with Next.js App Router, handles token issuance
   - Alternatives considered: NextAuth.js (deprecated, migrated to Auth.js), Auth.js (similar but Better Auth has better TypeScript support)

3. **JWT Algorithm Selection**
   - Decision: HS256 (HMAC with SHA-256)
   - Rationale: Symmetric algorithm, shared secret between frontend/backend, sufficient security for token verification
   - Alternatives considered: RS256 (asymmetric, unnecessary complexity for single backend), HS512 (overkill for 7-day tokens)

4. **Middleware Implementation Pattern**
   - Decision: FastAPI dependency injection for JWT verification
   - Rationale: FastAPI native pattern, enables route-level auth control, testable, reusable
   - Alternatives considered: Global middleware (all-or-nothing approach, less flexible), decorator pattern (repetitive, not FastAPI idiomatic)

5. **Error Response Format**
   - Decision: JSON with error/code fields
   - Rationale: Consistent with REST conventions, machine-parseable, human-readable
   - Alternatives considered: Plain text (not parseable), HTTP status only (insufficient detail)

### Technology Stack Finalized

**Backend**:

- FastAPI 0.109+ (existing)
- PyJWT 2.8+ (new dependency)
- Python-dotenv 1.0+ (existing)
- Pydantic 2.0+ (existing, for error response models)

**Frontend**:

- Next.js 16+ with App Router (new)
- Better Auth 1.0+ (new dependency)
- TypeScript 5.0+ (new)
- Fetch API (native, for HTTP requests)

**Shared**:

- BETTER_AUTH_SECRET environment variable (minimum 32 characters)
- JWT token format: `{user_id, email, iat, exp}`

---

## Phase 1: Design & Contracts

### Data Model

**See**: [data-model.md](./data-model.md)

**Entity: AuthenticatedUser** (derived from JWT token)

- `user_id`: string (unique identifier)
- `email`: string (user's email address)
- `iat`: integer (issued-at timestamp, Unix epoch)
- `exp`: integer (expiration timestamp, Unix epoch)

**Note**: No database model required - authentication is stateless. User identity exists only in JWT token during request lifecycle.

### API Contracts

**See**: [contracts/](./contracts/)

#### JWT Middleware Contract

**Input**:

- HTTP header: `Authorization: Bearer <jwt_token>`
- URL parameter: `user_id` (path parameter)

**Output**:

- Success: Authenticated user object available in request context
- Failure: HTTP 401 or 403 with JSON error response

**Verification Steps**:

1. Extract token from Authorization header
2. Verify token signature using BETTER_AUTH_SECRET
3. Validate token expiry (exp claim)
4. Decode user_id and email from payload
5. Compare URL user_id with JWT user_id
6. Return authenticated user or raise exception

#### Error Response Contract

**Format**:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

**Error Codes**:

- `AUTH_MISSING`: No Authorization header provided (HTTP 401)
- `AUTH_INVALID`: Invalid token signature or malformed token (HTTP 401)
- `AUTH_EXPIRED`: Token expiry time (exp) has passed (HTTP 401)
- `AUTH_FORBIDDEN`: Valid token but user_id mismatch (HTTP 403)

### Quickstart Guide

**See**: [quickstart.md](./quickstart.md)

**Setup Steps**:

1. Generate BETTER_AUTH_SECRET (32+ character random string)
2. Configure backend: Add PyJWT to requirements.txt, set env variable
3. Configure frontend: Add Better Auth to package.json, create auth config
4. Implement JWT middleware in backend
5. Configure Better Auth to issue JWT tokens in frontend
6. Attach JWT to all API requests in frontend
7. Test authentication flow end-to-end

### Agent Context Update

**Technologies Added** (to be appended to CLAUDE.md):

- PyJWT 2.8+ (Python JWT library for backend verification)
- Better Auth 1.0+ (Next.js authentication library with JWT support)
- JWT token format: `{user_id, email, iat, exp}` with HS256 algorithm

**Command**: Run `.specify/scripts/bash/update-agent-context.sh claude` after Phase 1 completion

---

## Implementation Roadmap

### Phase 2: Task Generation (via `/sp.tasks`)

**High-Level Task Categories**:

1. **Backend JWT Middleware** (6-8 tasks)
   - Create auth module structure
   - Implement JWT verification logic
   - Create FastAPI dependencies for auth
   - Define custom auth exceptions
   - Add PyJWT to dependencies
   - Write middleware unit tests

2. **Backend Route Protection** (4-6 tasks)
   - Apply auth dependency to existing task routes
   - Update route signatures with authenticated user
   - Enforce user_id matching in routes
   - Add integration tests for protected routes

3. **Frontend Better Auth Configuration** (5-7 tasks)
   - Install Better Auth dependency
   - Create auth configuration file
   - Configure JWT session strategy
   - Implement login UI (basic)
   - Add environment variable handling

4. **Frontend API Client** (4-5 tasks)
   - Create authenticated API client wrapper
   - Implement automatic JWT attachment
   - Handle 401/403 responses (clear token, redirect)
   - Add error handling for auth failures

5. **Integration & Testing** (5-6 tasks)
   - End-to-end authentication flow test
   - Cross-user access prevention test
   - Token expiry handling test
   - Concurrent request handling test
   - Error response validation test

**Estimated Total**: 24-32 tasks

---

## Risk Analysis

### Risk 1: Token Size Exceeds Limits

**Likelihood**: Low
**Impact**: Medium
**Mitigation**: JWT payload limited to user_id + email + timestamps (< 1KB). Standard JWT size limit is 7KB.

### Risk 2: Clock Skew Between Frontend and Backend

**Likelihood**: Medium
**Impact**: Low
**Mitigation**: PyJWT allows clock skew tolerance (default 0s, configurable). Backend validates exp claim with current time.

### Risk 3: BETTER_AUTH_SECRET Exposure

**Likelihood**: Low
**Impact**: Critical
**Mitigation**: Secret stored in .env files (not committed). Different secrets for dev/staging/prod. Secret rotation invalidates all tokens (users re-login).

### Risk 4: Better Auth Configuration Complexity

**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Follow Better Auth documentation for JWT strategy. Comprehensive testing of token issuance. Validate JWT payload contains required claims.

---

## Non-Functional Requirements

### Security

- JWT tokens transmitted over HTTPS only (TLS 1.2+)
- BETTER_AUTH_SECRET minimum 32 characters, cryptographically random
- Token expiry enforced (7 days, configurable)
- No sensitive data in JWT payload (only user_id and email)

### Performance

- JWT verification < 10ms per request (spec SC-003)
- Stateless architecture enables horizontal scaling
- Zero database lookups for authentication (token verification only)

### Observability

- Log authentication failures (invalid tokens, user_id mismatches)
- Do not log JWT tokens (sensitive data)
- Track authentication error rates (401/403 responses)

### Testability

- All JWT verification logic unit tested
- Mock JWT tokens for integration tests
- Test invalid/expired/tampered tokens
- Test cross-user access prevention

---

## Acceptance Criteria

**Implementation complete when**:

- ✅ All 28 functional requirements (FR-001 to FR-028) from spec implemented
- ✅ All 9 success criteria (SC-001 to SC-009) from spec satisfied
- ✅ All 4 user stories (P1 and P2) testable end-to-end
- ✅ JWT verification middleware operational in backend
- ✅ Better Auth configured and issuing JWT tokens in frontend
- ✅ All protected API routes require valid JWT
- ✅ Cross-user data access returns HTTP 403
- ✅ Invalid/missing/expired tokens return HTTP 401
- ✅ Zero runtime errors in test execution
- ✅ Constitution check passes all 8 principles

**Ready for `/sp.tasks` command**: Generate detailed, dependency-ordered task list for implementation.

---

## Notes

This plan implements Principle IV (Stateless Authentication) and Principle I (Zero Trust Architecture) from the constitution. Every API request is independently verified. No implicit trust exists. User identity is derived solely from the verified JWT token.

Key architectural decisions prioritize security (signature verification), user isolation (user_id matching), and simplicity (no refresh tokens, no session storage). The design enables horizontal scaling and maintains clear separation between frontend (auth configuration) and backend (auth verification).
