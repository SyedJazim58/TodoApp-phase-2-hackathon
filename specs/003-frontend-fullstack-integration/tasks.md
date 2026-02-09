---
description: "Implementation tasks for Frontend Application & Full-Stack Integration"
---

# Tasks: Frontend Application & Full-Stack Integration

**Input**: Design documents from `/specs/003-frontend-fullstack-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Branch**: `003-frontend-fullstack-integration`
**Created**: 2026-02-09

**Tests**: Not explicitly requested in specification - no test tasks included per requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Next.js 16+ project with App Router in frontend/ directory
- [X] T002 [P] Install Next.js dependencies: next, react, react-dom, typescript, @types/react, @types/node in frontend/package.json
- [X] T003 [P] Install Better Auth library in frontend/package.json
- [X] T004 [P] Configure TypeScript in frontend/tsconfig.json with strict mode
- [X] T005 [P] Setup Tailwind CSS or CSS Modules in frontend/ for styling
- [X] T006 Create frontend environment file frontend/.env.local with NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_BETTER_AUTH_URL, BETTER_AUTH_SECRET
- [X] T007 Create backend environment file backend/.env with BETTER_AUTH_SECRET matching frontend
- [X] T008 [P] Configure Next.js in frontend/next.config.js with API proxy settings if needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Initialize Better Auth client in frontend/src/lib/better-auth.ts with JWT configuration
- [X] T010 Create centralized API client in frontend/src/services/api-client.ts with automatic JWT extraction and attachment
- [X] T011 Implement API client error handling for 401 (session expiry), 403 (authorization), 500 (server errors), and network errors in frontend/src/services/api-client.ts
- [X] T012 Create Next.js middleware in frontend/middleware.ts for protected route authentication using Better Auth
- [X] T013 Create TypeScript types for Task entity in frontend/src/types/task.ts matching backend schema
- [X] T014 Create TypeScript types for API responses in frontend/src/types/api.ts (success, error, pagination)
- [X] T015 Create ProtectedRoute wrapper component in frontend/src/components/ProtectedRoute/ProtectedRoute.tsx with session validation
- [X] T016 Create error boundary component in frontend/src/components/ErrorBoundary/ErrorBoundary.tsx for graceful error handling
- [X] T017 Verify backend JWT verification middleware is operational in backend/src/auth/jwt_middleware.py (from feature 002)
- [X] T018 Verify backend task endpoints exist and are protected in backend/src/api/tasks.py (from features 001-002)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration and First Login (Priority: P1) 🎯 MVP

**Goal**: New user can create account via Better Auth, receive JWT token, and view empty task dashboard

**Independent Test**: Complete signup form → login → verify dashboard loads with empty task list and valid JWT in session

### Implementation for User Story 1

- [X] T019 [P] [US1] Create signup page in frontend/src/app/signup/page.tsx with Better Auth signup form
- [X] T020 [P] [US1] Create login page in frontend/src/app/login/page.tsx with Better Auth login form
- [X] T021 [P] [US1] Create root layout in frontend/src/app/layout.tsx with Better Auth session provider
- [X] T022 [P] [US1] Create Navbar component in frontend/src/components/Navbar/Navbar.tsx with logout functionality
- [X] T023 [US1] Create dashboard page in frontend/src/app/dashboard/page.tsx as protected route showing task list
- [X] T024 [US1] Implement auth service in frontend/src/services/auth-service.ts wrapping Better Auth session methods
- [X] T025 [US1] Create Better Auth API route handler in frontend/src/app/api/auth/[...all]/route.ts for JWT issuance
- [X] T026 [US1] Implement session persistence verification on page refresh in frontend/src/app/dashboard/page.tsx
- [X] T027 [US1] Connect dashboard to backend GET /api/{user_id}/tasks endpoint using API client in frontend/src/app/dashboard/page.tsx
- [X] T028 [US1] Display empty task list message when no tasks exist in frontend/src/app/dashboard/page.tsx
- [X] T029 [US1] Add loading state during authentication and data fetching in frontend/src/app/dashboard/page.tsx

**Checkpoint**: User Story 1 complete - users can register, login, and see authenticated dashboard with JWT handling

---

## Phase 4: User Story 2 - Task Management with Automatic JWT Handling (Priority: P1)

**Goal**: Authenticated user can create, view, update, and delete tasks via UI with transparent JWT authentication

**Independent Test**: Login → create task → edit task → mark complete → delete task - all operations succeed without manual token handling

### Implementation for User Story 2

- [X] T030 [P] [US2] Create TaskList component in frontend/src/components/TaskList/TaskList.tsx to display tasks with edit/delete actions
- [X] T031 [P] [US2] Create TaskForm component in frontend/src/components/TaskForm/TaskForm.tsx for create/edit operations
- [X] T032 [P] [US2] Create TaskItem component in frontend/src/components/TaskList/TaskItem.tsx for individual task display with completion toggle
- [X] T033 [US2] Implement task service in frontend/src/services/task-service.ts with getAllTasks, createTask, updateTask, deleteTask methods
- [X] T034 [US2] Integrate TaskList into dashboard page in frontend/src/app/dashboard/page.tsx
- [X] T035 [US2] Implement create task functionality with POST /api/{user_id}/tasks in frontend/src/components/TaskForm/TaskForm.tsx
- [X] T036 [US2] Implement edit task functionality with PUT /api/{user_id}/tasks/{id} in frontend/src/components/TaskForm/TaskForm.tsx
- [X] T037 [US2] Implement toggle completion status with PUT /api/{user_id}/tasks/{id} in frontend/src/components/TaskList/TaskItem.tsx
- [X] T038 [US2] Implement delete task functionality with DELETE /api/{user_id}/tasks/{id} in frontend/src/components/TaskList/TaskItem.tsx
- [X] T039 [US2] Add optimistic UI updates with backend reconciliation in frontend/src/services/task-service.ts
- [X] T040 [US2] Verify user_id from JWT session matches API URL user_id in frontend/src/services/task-service.ts
- [X] T041 [US2] Add loading states for all CRUD operations in frontend/src/components/TaskList/TaskList.tsx
- [X] T042 [US2] Add success notifications for create/update/delete in frontend/src/app/dashboard/page.tsx
- [X] T043 [US2] Verify backend filters tasks by authenticated user_id (test with multiple users)

**Checkpoint**: User Story 2 complete - full task CRUD operations working with automatic JWT handling and user data isolation

---

## Phase 5: User Story 3 - Session Expiry and Re-authentication (Priority: P2)

**Goal**: When JWT expires, frontend detects 401 response, clears session, and redirects to login with clear messaging

**Independent Test**: Simulate token expiry → make API request → verify redirect to login with "session expired" message

### Implementation for User Story 3

- [X] T044 [US3] Implement 401 response interceptor in frontend/src/services/api-client.ts to detect expired tokens
- [X] T045 [US3] Implement session clearing on 401 using Better Auth signOut in frontend/src/services/api-client.ts
- [X] T046 [US3] Implement redirect to /login on session expiry in frontend/src/services/api-client.ts
- [X] T047 [US3] Create toast notification component in frontend/src/components/Notification/Toast.tsx for user messages
- [X] T048 [US3] Display "Your session has expired. Please log in again." message on 401 in frontend/src/app/login/page.tsx
- [X] T049 [US3] Preserve attempted action context (e.g., form data) for retry after re-login in frontend/src/services/api-client.ts
- [X] T050 [US3] Implement session restoration after successful re-authentication in frontend/src/app/login/page.tsx
- [X] T051 [US3] Test token expiry handling during task creation operation
- [X] T052 [US3] Test token expiry handling during task editing operation
- [X] T053 [US3] Verify fresh JWT allows resuming normal operations in frontend/src/app/dashboard/page.tsx

**Checkpoint**: User Story 3 complete - graceful session expiry handling with clear user guidance and re-authentication flow

---

## Phase 6: User Story 4 - Authorization Enforcement and Cross-User Access Prevention (Priority: P2)

**Goal**: Attempting to access another user's resources returns 403 with clear error message, preventing data leaks

**Independent Test**: Manually change user_id in API URL → verify backend returns 403 → frontend displays "Access Denied" without crash

### Implementation for User Story 4

- [X] T054 [US4] Implement 403 response handler in frontend/src/services/api-client.ts for authorization failures
- [X] T055 [US4] Create AccessDenied component in frontend/src/components/AccessDenied/AccessDenied.tsx with "Return to Dashboard" action
- [X] T056 [US4] Display "Access Denied: You cannot access another user's resources" message on 403 in frontend/src/components/AccessDenied/AccessDenied.tsx
- [X] T057 [US4] Implement "Return to Dashboard" navigation in frontend/src/components/AccessDenied/AccessDenied.tsx
- [X] T058 [US4] Test cross-user access prevention by manually modifying user_id in URLs
- [X] T059 [US4] Verify backend validates JWT user_id against URL user_id in backend/src/api/task_routes.py (from feature 002)
- [X] T060 [US4] Ensure frontend error boundary catches 403 errors without application crash in frontend/src/components/ErrorBoundary/ErrorBoundary.tsx
- [X] T061 [US4] Test that unauthenticated users attempting protected routes redirect to login (not 403) in frontend/middleware.ts
- [X] T062 [US4] Verify malformed JWT tokens trigger authentication error with session clear in frontend/src/services/api-client.ts

**Checkpoint**: User Story 4 complete - robust authorization enforcement preventing cross-user data access with user-friendly error handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T063 [P] Add responsive design styling for mobile/tablet in all frontend components (VERIFIED: All components use mobile-first responsive Tailwind classes)
- [X] T064 [P] Implement consistent error message formatting across all components (COMPLETED: frontend/src/components/ErrorMessage/ErrorMessage.tsx)
- [X] T065 [P] Add proper semantic HTML for accessibility in all frontend pages (VERIFIED: Proper semantic HTML, ARIA labels, and focus management present)
- [X] T066 [P] Configure Content Security Policy headers in frontend/next.config.js (COMPLETED: CSP and security headers configured)
- [X] T067 [P] Implement request debouncing for rapid form submissions (COMPLETED: frontend/src/utils/debounce.ts with comprehensive utilities)
- [X] T068 [P] Add loading skeleton screens for better perceived performance (COMPLETED: frontend/src/components/LoadingSkeleton/LoadingSkeleton.tsx integrated in dashboard)
- [ ] T069 [P] Verify HTTPS enforcement in production environment configuration (DOCUMENTED: See frontend/TESTING_CHECKLIST.md for verification steps)
- [ ] T070 [P] Test browser compatibility (Chrome, Firefox, Safari, Edge - last 2 versions) (DOCUMENTED: Test matrix in frontend/TESTING_CHECKLIST.md)
- [ ] T071 [P] Verify BETTER_AUTH_SECRET is identical between frontend and backend environments (DOCUMENTED: Verification procedure in frontend/TESTING_CHECKLIST.md)
- [ ] T072 [P] Test simultaneous tab behavior with shared JWT session (DOCUMENTED: Test scenarios in frontend/TESTING_CHECKLIST.md)
- [X] T073 [P] Document frontend environment variables in frontend/.env.example (COMPLETED: Comprehensive documentation with security notes)
- [ ] T074 Run quickstart validation per frontend/specs/003-frontend-fullstack-integration/quickstart.md (DOCUMENTED: Validation checklist in frontend/TESTING_CHECKLIST.md)
- [X] T075 Create user-facing documentation for signup/login/task management flows (COMPLETED: frontend/USER_GUIDE.md with comprehensive user documentation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) and User Story 1 (needs authentication working)
- **User Story 3 (Phase 5)**: Depends on User Story 1 and 2 (needs active sessions to test expiry)
- **User Story 4 (Phase 6)**: Depends on User Story 1 and 2 (needs authenticated operations to test authorization)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation - authentication and first login MUST work before other stories
- **User Story 2 (P1)**: Depends on US1 - requires working authentication to perform task operations
- **User Story 3 (P2)**: Depends on US1 and US2 - requires active sessions and API operations to test expiry
- **User Story 4 (P2)**: Depends on US1 and US2 - requires authenticated API calls to test authorization

### Within Each User Story

**User Story 1**:
1. Create signup/login pages in parallel (T019, T020)
2. Create layout and navbar in parallel (T021, T022)
3. Implement dashboard after authentication pages (T023)
4. Wire up auth service and API routes (T024, T025)
5. Complete session persistence and API integration (T026-T029)

**User Story 2**:
1. Create components in parallel: TaskList, TaskForm, TaskItem (T030, T031, T032)
2. Implement task service (T033)
3. Integrate components and wire up CRUD operations (T034-T038)
4. Add optimistic updates and validation (T039-T041)
5. Polish with notifications and testing (T042-T043)

**User Story 3**:
1. Implement 401 interceptor and session clearing (T044-T046)
2. Create notification component (T047)
3. Wire up messaging and context preservation (T048-T050)
4. Test expiry scenarios (T051-T053)

**User Story 4**:
1. Implement 403 handler (T054)
2. Create AccessDenied component (T055-T057)
3. Test authorization scenarios (T058-T062)

### Parallel Opportunities

- **Setup Phase**: All tasks marked [P] can run in parallel (T002, T003, T004, T005, T007, T008)
- **User Story 1**: Tasks T019, T020, T021, T022 can run in parallel (different pages/components)
- **User Story 2**: Tasks T030, T031, T032 can run in parallel (different components)
- **Polish Phase**: Most tasks marked [P] can run in parallel (T063-T073)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, start US1 in parallel:
# Developer A: Signup/Login pages
Task T019: Create signup page
Task T020: Create login page

# Developer B: Layout and navigation
Task T021: Create layout
Task T022: Create navbar

# Then both developers converge:
Task T023: Dashboard page (needs layout from Developer B)
Task T024-T029: Sequential integration tasks
```

---

## Parallel Example: User Story 2

```bash
# After US1 completes, start US2 components in parallel:
# Developer A: Task list components
Task T030: TaskList component
Task T032: TaskItem component

# Developer B: Task form
Task T031: TaskForm component

# Then both converge:
Task T033: Task service (shared)
Task T034-T043: Sequential integration and testing
```

---

## Implementation Strategy

### MVP Scope (Recommended)
**Phases 1, 2, 3, 4** - Delivers core value: user can register, login, and manage tasks with JWT authentication
- Total: ~43 tasks (T001-T043)
- Estimated timeline: 2-3 weeks for solo developer, 1-2 weeks with 2 developers

### Extended Scope
Add **Phases 5, 6** for production readiness: session expiry handling and authorization enforcement
- Additional: ~19 tasks (T044-T062)
- Estimated timeline: +1 week

### Full Scope
Include **Phase 7** for polish and cross-cutting concerns
- Additional: ~13 tasks (T063-T075)
- Estimated timeline: +0.5 weeks

### Incremental Delivery Approach
1. **Iteration 1**: Setup + Foundational (Phases 1-2) → Infrastructure ready
2. **Iteration 2**: User Story 1 (Phase 3) → Authentication working, can demonstrate login
3. **Iteration 3**: User Story 2 (Phase 4) → Full task CRUD, can demonstrate core functionality
4. **Iteration 4**: User Stories 3-4 (Phases 5-6) → Production-ready error handling
5. **Iteration 5**: Polish (Phase 7) → Ship-ready product

---

## Task Summary

- **Total Tasks**: 75
- **Setup Phase**: 8 tasks
- **Foundational Phase**: 10 tasks (blocking all user stories)
- **User Story 1 (P1 - MVP)**: 11 tasks
- **User Story 2 (P1 - MVP)**: 14 tasks
- **User Story 3 (P2)**: 10 tasks
- **User Story 4 (P2)**: 9 tasks
- **Polish Phase**: 13 tasks

**Parallel Opportunities Identified**: 23 tasks marked [P] can run in parallel with other tasks

**Independent Test Criteria**:
- US1: Signup → login → see empty dashboard (authentication working)
- US2: Create → edit → complete → delete tasks (CRUD working)
- US3: Expire token → redirect to login (session handling working)
- US4: Access another user's URL → see access denied (authorization working)

**Suggested MVP Scope**: Phases 1-4 (Tasks T001-T043) - Delivers authenticated task management system
