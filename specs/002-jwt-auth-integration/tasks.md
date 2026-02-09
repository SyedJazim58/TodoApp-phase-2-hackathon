# Tasks: Authentication & JWT Integration

**Feature**: 002-jwt-auth-integration
**Branch**: `002-jwt-auth-integration`
**Date**: 2026-02-08
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Task Summary

**Total Tasks**: 30
**Parallelizable Tasks**: 18 (marked with [P])
**User Stories**: 4 (2x P1, 2x P2)

**Task Distribution by User Story**:
- Setup & Foundational: 6 tasks
- User Story 1 (P1): 8 tasks
- User Story 2 (P1): 7 tasks
- User Story 3 (P2): 4 tasks
- User Story 4 (P2): 3 tasks
- Polish & Cross-Cutting: 2 tasks

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**Recommended First Delivery**: User Story 1 + User Story 2 (P1 stories only)
- Enables core authentication flow
- JWT token issuance and verification functional
- User can log in and access protected endpoints
- Foundation for all subsequent features

### Incremental Delivery Path
1. **Phase 1-2**: Setup + Foundational (blocking tasks)
2. **Phase 3**: User Story 1 - Login flow with JWT issuance
3. **Phase 4**: User Story 2 - Token verification and user isolation
4. **Phase 5**: User Story 3 - Token expiry handling
5. **Phase 6**: User Story 4 - Cross-user access prevention validation
6. **Phase 7**: Polish and documentation

### Parallel Execution Opportunities
- Backend and frontend can be developed in parallel after Setup
- Multiple test files can be written in parallel
- Independent service/middleware implementations can run concurrently
- Frontend components (Better Auth config, API client) are parallelizable

---

## Dependency Graph

```
Setup (Phase 1)
    ├─> Foundational (Phase 2)
         ├─> US1: Login & Token Issuance (Phase 3) ─┐
         ├─> US2: Token Verification (Phase 4) ─────┤
         │                                           ├─> US3: Token Expiry (Phase 5)
         │                                           └─> US4: Cross-User Isolation (Phase 6)
         └─> Polish & Cross-Cutting (Phase 7)
```

**Story Dependencies**:
- US2 depends on US1 (needs JWT tokens to verify)
- US3 independent after Foundational
- US4 independent after Foundational
- US3 and US4 can be implemented in parallel

---

## Phase 1: Setup & Environment Configuration

**Goal**: Initialize project structure, configure environment variables, install dependencies

**Completion Criteria**:
- ✅ Backend auth module structure created
- ✅ Frontend lib/auth directory created
- ✅ PyJWT installed in backend
- ✅ Better Auth installed in frontend
- ✅ BETTER_AUTH_SECRET configured in both services
- ✅ Environment variable files created

### Tasks

- [X] T001 Generate BETTER_AUTH_SECRET (32+ character random string) using `openssl rand -hex 32`
- [X] T002 [P] Create backend auth module structure: backend/src/auth/__init__.py, backend/src/auth/exceptions.py, backend/src/auth/jwt_middleware.py, backend/src/auth/dependencies.py
- [ ] T003 [P] Create frontend auth library structure: frontend/src/lib/auth/better-auth-config.ts, frontend/src/lib/auth/auth-client.ts
- [X] T004 [P] Add PyJWT==2.8.0 to backend/requirements.txt and run `pip install -r requirements.txt`
- [ ] T005 [P] Add better-auth@^1.0.0 to frontend/package.json and run `npm install`
- [X] T006 Configure BETTER_AUTH_SECRET in backend/.env and frontend/.env.local (use value from T001)

---

## Phase 2: Foundational Components

**Goal**: Implement core authentication infrastructure that all user stories depend on

**Completion Criteria**:
- ✅ Auth exception classes defined
- ✅ JWT token verification logic implemented
- ✅ FastAPI auth dependency created
- ✅ Better Auth configuration file created
- ✅ All foundational components unit tested

### Tasks

- [X] T007 [P] [US1] Implement auth exception classes in backend/src/auth/exceptions.py (AuthenticationError for 401, AuthorizationError for 403)
- [X] T008 [P] [US2] Implement JWT verification function in backend/src/auth/jwt_middleware.py (verify_jwt_token with signature and expiry validation)
- [X] T009 [US2] Implement FastAPI auth dependency in backend/src/auth/dependencies.py (get_current_user function with token extraction and user_id matching)
- [ ] T010 [P] [US1] Create Better Auth configuration in frontend/src/lib/auth/better-auth-config.ts (JWT strategy, 7-day expiry, user_id/email in payload)
- [X] T011 [P] Write unit tests for JWT verification in backend/tests/test_jwt_middleware.py (valid token, expired token, invalid signature, missing claims)
- [X] T012 [P] Write unit tests for auth dependency in backend/tests/test_auth_dependencies.py (header extraction, user_id matching, error cases)

---

## Phase 3: User Story 1 - Successful Login with JWT Token Issuance (P1)

**Story Goal**: A user logs in through the Next.js frontend, Better Auth issues a JWT token, and the user can immediately make authenticated API requests to access their personal data.

**Independent Test Criteria**:
- ✅ User can log in via frontend
- ✅ JWT token is issued containing user_id, email, iat, exp
- ✅ Token can be used immediately for API requests
- ✅ Protected endpoint returns user-specific data with valid token

**Acceptance Scenarios** (from spec.md):
1. Valid user logs in → Better Auth issues JWT with 7-day expiry
2. Frontend makes API request with "Authorization: Bearer {token}" → Backend verifies and returns data
3. Token payload contains user_id, email, iat, exp

### Tasks

- [ ] T013 [P] [US1] Configure Better Auth JWT callbacks in frontend/src/lib/auth/better-auth-config.ts (add user_id and email to token payload)
- [ ] T014 [P] [US1] Create API client wrapper in frontend/src/lib/auth/auth-client.ts (AuthenticatedClient class with automatic JWT attachment)
- [ ] T015 [P] [US1] Implement token storage logic in frontend/src/lib/auth/auth-client.ts (save to localStorage after login, retrieve for API requests)
- [ ] T016 [P] [US1] Create basic login UI in frontend/src/app/(auth)/login/page.tsx (form with email/password, Better Auth integration)
- [ ] T017 [P] [US1] Create Better Auth API route in frontend/src/app/api/auth/[...all].ts (handle Better Auth requests)
- [X] T018 [US1] Apply auth dependency to existing task GET endpoint in backend/src/api/tasks.py (add `current_user: dict = Depends(get_current_user)`)
- [ ] T019 [P] [US1] Write integration test for login flow in backend/tests/test_auth_integration.py (login → receive token → make API request → verify success)
- [ ] T020 [US1] Manual test: Log in via frontend, verify JWT token in localStorage, call GET /api/{user_id}/tasks, confirm 200 response

---

## Phase 4: User Story 2 - Token Verification and User Identity Enforcement (P1)

**Story Goal**: The backend receives an API request with a JWT token, verifies its authenticity using the shared secret, extracts the user identity, and enforces that the requesting user can only access their own data.

**Independent Test Criteria**:
- ✅ Valid token with matching user_id → 200 OK
- ✅ Valid token with mismatched user_id → 403 Forbidden
- ✅ Expired token → 401 Unauthorized with AUTH_EXPIRED
- ✅ Invalid signature → 401 Unauthorized with AUTH_INVALID
- ✅ Missing token → 401 Unauthorized with AUTH_MISSING

**Acceptance Scenarios** (from spec.md):
1. User A requests /api/user-a-id/tasks → 200 OK with user A's tasks
2. User A requests /api/user-b-id/tasks → 403 Forbidden
3. Expired token → 401 with "Token expired"
4. Invalid signature → 401 with "Invalid token signature"
5. No token → 401 with "Missing authentication token"

### Tasks

- [X] T021 [P] [US2] Apply auth dependency to POST /api/{user_id}/tasks endpoint in backend/src/api/tasks.py
- [X] T022 [P] [US2] Apply auth dependency to PUT /api/{user_id}/tasks/{id} endpoint in backend/src/api/tasks.py
- [X] T023 [P] [US2] Apply auth dependency to DELETE /api/{user_id}/tasks/{id} endpoint in backend/src/api/tasks.py
- [X] T024 [P] [US2] Write test for valid token with matching user_id in backend/tests/test_jwt_middleware.py (should return 200)
- [X] T025 [P] [US2] Write test for valid token with mismatched user_id in backend/tests/test_user_isolation.py (should return 403 AUTH_FORBIDDEN)
- [X] T026 [P] [US2] Write test for missing Authorization header in backend/tests/test_jwt_middleware.py (should return 401 AUTH_MISSING)
- [ ] T027 [US2] Integration test: Make API request with each error scenario (expired, invalid, missing, mismatch) and verify correct HTTP status and error code

---

## Phase 5: User Story 3 - Token Expiry and Re-authentication (P2)

**Story Goal**: When a user's JWT token expires after 7 days, the backend rejects requests with that token, and the frontend prompts the user to log in again to receive a fresh token.

**Independent Test Criteria**:
- ✅ Expired token is rejected with 401 AUTH_EXPIRED
- ✅ Frontend clears expired token from storage
- ✅ Frontend redirects to login page on 401
- ✅ User can re-login to receive fresh token

**Acceptance Scenarios** (from spec.md):
1. Expired token → Backend returns 401 with "Token expired" + Frontend redirects to login
2. Token with 5 minutes remaining → Backend accepts and processes normally
3. User re-logs in → New JWT issued with fresh 7-day expiry

### Tasks

- [ ] T028 [P] [US3] Implement 401 error handling in frontend/src/lib/auth/auth-client.ts (clear token from localStorage, redirect to /login)
- [X] T029 [P] [US3] Write test for expired token handling in backend/tests/test_jwt_middleware.py (generate token with exp in past, verify AUTH_EXPIRED)
- [ ] T030 [US3] Write frontend test for 401 redirect in frontend/src/lib/auth/auth-client.test.ts (mock 401 response, verify localStorage clear and redirect)
- [ ] T031 [US3] Integration test: Create token with 1-second expiry, wait for expiry, make API request, verify 401 and frontend redirect

---

## Phase 6: User Story 4 - Cross-User Data Isolation Verification (P2)

**Story Goal**: The system enforces that no user can access, modify, or delete another user's data, even if they manually craft requests with different user_id parameters.

**Independent Test Criteria**:
- ✅ User A cannot GET user B's resources → 403
- ✅ User A cannot PUT user B's resources → 403
- ✅ User A cannot DELETE user B's resources → 403
- ✅ User A cannot POST to user B's resource collection → 403

**Acceptance Scenarios** (from spec.md):
1. User A attempts GET /api/user-b-id/tasks/123 → 403 Forbidden
2. User A attempts PUT /api/user-b-id/tasks/123 → 403 Forbidden
3. User A attempts DELETE /api/user-b-id/tasks/123 → 403 Forbidden
4. User A attempts POST /api/user-b-id/tasks → 403 Forbidden

### Tasks

- [X] T032 [P] [US4] Write test for cross-user GET attempt in backend/tests/test_user_isolation.py (user-a token → /api/user-b/tasks → 403)
- [X] T033 [P] [US4] Write test for cross-user PUT attempt in backend/tests/test_user_isolation.py (user-a token → PUT /api/user-b/tasks/123 → 403)
- [X] T034 [P] [US4] Write test for cross-user DELETE attempt in backend/tests/test_user_isolation.py (user-a token → DELETE /api/user-b/tasks/123 → 403)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Documentation, error message refinement, logging, final validation

**Completion Criteria**:
- ✅ All error messages follow standard format
- ✅ Authentication failures are logged
- ✅ README updated with setup instructions
- ✅ All tests passing

### Tasks

- [X] T035 [P] Implement authentication failure logging in backend/src/auth/dependencies.py (log 401/403 errors with endpoint, IP, user_agent - do NOT log JWT token)
- [ ] T036 Update README.md with JWT authentication setup instructions (reference quickstart.md)

---

## Testing Strategy

### Test Organization
- **Unit Tests**: backend/tests/test_jwt_middleware.py, backend/tests/test_auth_dependencies.py
- **Integration Tests**: backend/tests/test_auth_integration.py, backend/tests/test_user_isolation.py
- **Frontend Tests**: frontend/src/lib/auth/auth-client.test.ts (if tests requested)

### Test Coverage Requirements
- ✅ JWT verification logic (valid, expired, invalid signature)
- ✅ FastAPI auth dependency (header extraction, user_id matching)
- ✅ All error scenarios (AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED, AUTH_FORBIDDEN)
- ✅ Cross-user access prevention (all HTTP methods)
- ✅ Token expiry and re-authentication flow
- ✅ End-to-end login → API request flow

### Manual Testing Checklist
- [ ] Generate BETTER_AUTH_SECRET and configure in both services
- [ ] Start backend server (`uvicorn src.main:app --reload`)
- [ ] Start frontend server (`npm run dev`)
- [ ] Log in via frontend UI
- [ ] Verify JWT token in browser localStorage
- [ ] Make API request to GET /api/{user_id}/tasks
- [ ] Verify 200 response with user data
- [ ] Attempt to access another user's resources (expect 403)
- [ ] Use expired token (expect 401 and redirect to login)

---

## Parallel Execution Examples

### Setup Phase (All Parallel)
```bash
# Can run simultaneously
T002: Create backend auth module structure
T003: Create frontend auth library structure
T004: Install PyJWT in backend
T005: Install Better Auth in frontend
```

### User Story 1 (Maximum Parallelism)
```bash
# After T007-T012 complete, these can run in parallel:
T013: Configure Better Auth JWT callbacks
T014: Create API client wrapper
T015: Implement token storage
T016: Create login UI
T017: Create Better Auth API route
T019: Write integration test

# Sequential dependency: T018 after T013-T017
```

### User Story 2 (All Parallel After Foundational)
```bash
# All these can run simultaneously:
T021: Apply auth to POST endpoint
T022: Apply auth to PUT endpoint
T023: Apply auth to DELETE endpoint
T024: Test valid token matching
T025: Test user_id mismatch
T026: Test missing header
```

---

## Acceptance Criteria (Feature Complete)

**Feature is DONE when**:
- ✅ All 36 tasks completed
- ✅ All 4 user stories independently testable
- ✅ All unit tests passing (100% coverage of auth logic)
- ✅ All integration tests passing
- ✅ Manual testing checklist completed
- ✅ Backend verifies JWT signature, expiry, and user_id matching
- ✅ Frontend issues JWT tokens via Better Auth
- ✅ Frontend attaches JWT to all API requests
- ✅ Cross-user access impossible (403 Forbidden)
- ✅ Invalid/missing/expired tokens rejected (401 Unauthorized)
- ✅ Constitution check passes all 8 principles
- ✅ Zero runtime errors in test execution

---

## Risk Mitigation Tasks

**Embedded in task list**:
- T001: Addresses Risk 3 (BETTER_AUTH_SECRET exposure) - secure generation
- T011-T012: Addresses Risk 2 (clock skew) - expiry validation tests
- T024-T027: Addresses Risk 1 (token size) - payload validation
- T013: Addresses Risk 4 (Better Auth complexity) - follow JWT strategy

---

## Notes

- **Tests are comprehensive**: Unit, integration, and manual tests cover all error scenarios
- **Independent user stories**: Each phase can be tested independently
- **Parallel execution**: 18 tasks marked [P] can run concurrently with others
- **MVP scope**: Phase 1-4 (Setup + Foundational + US1 + US2) delivers core authentication
- **Security-first**: User_id validation and JWT verification in every task
- **Constitution-aligned**: All tasks traceable to spec requirements (FR-001 to FR-028)

Ready for implementation via `/sp.implement` or manual task execution.
