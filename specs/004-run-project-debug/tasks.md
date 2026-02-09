---
description: "Task list for Run Whole Project & Debug feature"
---

# Tasks: Run Whole Project & Debug

**Input**: Design documents from `/specs/004-run-project-debug/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are NOT included in this feature as it focuses on manual validation and debugging rather than automated testing.

**Organization**: Tasks are grouped by user story to enable independent validation of each system capability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with:
- Backend: `backend/` (Python FastAPI)
- Frontend: `frontend/` (Next.js 16+)
- Documentation: `docs/`
- Scripts: `scripts/`

---

## Phase 1: Setup (Documentation and Validation Infrastructure)

**Purpose**: Create validation tools and documentation for running and debugging the complete system

- [ ] T001 Create docs directory structure at repository root (docs/)
- [ ] T002 Create scripts directory structure at repository root (scripts/)
- [ ] T003 [P] Create environment variable validation script at scripts/validate-config.py
- [ ] T004 [P] Create service health check script at scripts/health-check.sh

---

## Phase 2: Foundational (Configuration Documentation)

**Purpose**: Document all configuration requirements that MUST be satisfied before ANY validation can proceed

**⚠️ CRITICAL**: No validation work can begin until environment configuration is documented and validated

- [ ] T005 [P] Create backend environment template at backend/.env.example
- [ ] T006 [P] Create frontend environment template at frontend/.env.local.example
- [ ] T007 Document startup procedures in docs/startup-guide.md
- [ ] T008 Create validation checklist at specs/004-run-project-debug/contracts/validation-checklist.md

**Checkpoint**: Configuration documentation complete - validation work can now begin

---

## Phase 3: User Story 1 - Initial System Validation (Priority: P1) 🎯

**Goal**: Verify all services start successfully and report healthy status

**Independent Test**: Start all services and access health endpoints to confirm system is operational

### Implementation for User Story 1

- [ ] T009 [P] [US1] Add health check endpoint to backend at backend/app/main.py
- [ ] T010 [P] [US1] Verify frontend startup configuration in frontend/package.json
- [ ] T011 [US1] Document service startup commands in docs/startup-guide.md (backend section)
- [ ] T012 [US1] Document service startup commands in docs/startup-guide.md (frontend section)
- [ ] T013 [US1] Validate DATABASE_URL environment variable checking in backend startup
- [ ] T014 [US1] Test and document startup failure scenarios in docs/debugging-guide.md
- [ ] T015 [US1] Verify health check endpoint returns correct status in backend/app/main.py
- [ ] T016 [US1] Document expected health check responses in docs/startup-guide.md

**Checkpoint**: All services can be started and health verified - system is operational

---

## Phase 4: User Story 2 - End-to-End Authentication Flow Validation (Priority: P1)

**Goal**: Verify JWT token issuance, transmission, and verification work correctly across frontend and backend

**Independent Test**: Create account, sign in, make authenticated API call with JWT token in Authorization header

### Implementation for User Story 2

- [ ] T017 [P] [US2] Verify JWT token issuance in Better Auth configuration at frontend/lib/auth.ts
- [ ] T018 [P] [US2] Verify JWT verification middleware exists in backend/app/auth.py
- [ ] T019 [US2] Document JWT token flow in docs/debugging-guide.md (authentication section)
- [ ] T020 [US2] Verify Authorization header injection in frontend API client at frontend/lib/api-client.ts
- [ ] T021 [US2] Test missing token scenario and verify 401 "Missing token" response
- [ ] T022 [US2] Test invalid token scenario and verify 401 "Invalid token" response
- [ ] T023 [US2] Test expired token scenario and verify 401 "Expired token" response
- [ ] T024 [US2] Document authentication failure scenarios in docs/debugging-guide.md
- [ ] T025 [US2] Document BETTER_AUTH_SECRET mismatch troubleshooting in docs/debugging-guide.md
- [ ] T026 [US2] Add authentication validation section to specs/004-run-project-debug/contracts/validation-checklist.md

**Checkpoint**: Authentication flow fully validated - JWT tokens work end-to-end

---

## Phase 5: User Story 3 - Multi-User Data Isolation Validation (Priority: P1)

**Goal**: Verify users can only access their own data and cross-user access is properly blocked

**Independent Test**: Create two user accounts and attempt cross-user data access to verify 403 Forbidden responses

### Implementation for User Story 3

- [ ] T027 [P] [US3] Verify user_id validation in backend API routes at backend/app/api/tasks.py
- [ ] T028 [P] [US3] Verify JWT user_id extraction in backend auth middleware at backend/app/auth.py
- [ ] T029 [US3] Document multi-user testing procedure in docs/debugging-guide.md
- [ ] T030 [US3] Test User A creating task and User B attempting access (expect 403)
- [ ] T031 [US3] Test User A attempting to access User B's user_id endpoint (expect 403)
- [ ] T032 [US3] Verify database queries filter by authenticated user_id in backend/app/api/tasks.py
- [ ] T033 [US3] Document data isolation validation in specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T034 [US3] Document cross-user access scenarios in docs/debugging-guide.md

**Checkpoint**: Multi-user data isolation verified - users cannot access other users' data

---

## Phase 6: User Story 4 - Complete Task CRUD Flow Validation (Priority: P2)

**Goal**: Verify all task operations work correctly for authenticated users

**Independent Test**: Perform all CRUD operations (create, read, update, delete) as single authenticated user

### Implementation for User Story 4

- [ ] T035 [P] [US4] Verify task creation endpoint at backend/app/api/tasks.py
- [ ] T036 [P] [US4] Verify task listing endpoint at backend/app/api/tasks.py
- [ ] T037 [P] [US4] Verify task update endpoint at backend/app/api/tasks.py
- [ ] T038 [P] [US4] Verify task deletion endpoint at backend/app/api/tasks.py
- [ ] T039 [US4] Test create task operation and verify persistence
- [ ] T040 [US4] Test list tasks operation and verify filtering
- [ ] T041 [US4] Test update task operation and verify changes persist
- [ ] T042 [US4] Test mark task complete operation and verify status update
- [ ] T043 [US4] Test delete task operation and verify 404 on subsequent access
- [ ] T044 [US4] Document CRUD validation steps in specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T045 [US4] Document CRUD operations in docs/startup-guide.md (testing section)

**Checkpoint**: All CRUD operations verified - core functionality works end-to-end

---

## Phase 7: User Story 5 - Integration Failure Diagnosis (Priority: P2)

**Goal**: Verify error messages are clear and actionable for common failure scenarios

**Independent Test**: Intentionally misconfigure services and verify error messages provide clear diagnostic information

### Implementation for User Story 5

- [ ] T046 [P] [US5] Verify backend database connection error handling at backend/app/database.py
- [ ] T047 [P] [US5] Verify frontend API error handling at frontend/lib/api-client.ts
- [ ] T048 [US5] Document database connection failure scenario in docs/debugging-guide.md
- [ ] T049 [US5] Document frontend network error scenario in docs/debugging-guide.md
- [ ] T050 [US5] Document BETTER_AUTH_SECRET mismatch scenario in docs/debugging-guide.md
- [ ] T051 [US5] Verify database errors don't leak sensitive information in backend error responses
- [ ] T052 [US5] Test and document missing database table scenario
- [ ] T053 [US5] Verify backend request logging includes user_id and endpoint at backend/app/main.py
- [ ] T054 [US5] Add error diagnosis validation to specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T055 [US5] Create troubleshooting flowchart in docs/debugging-guide.md

**Checkpoint**: Error messages validated - developers can diagnose issues quickly

---

## Phase 8: User Story 6 - Environment Configuration Validation (Priority: P3)

**Goal**: Validate environment variables are correctly configured before runtime

**Independent Test**: Run configuration validation script and verify all required variables are detected

### Implementation for User Story 6

- [ ] T056 [US6] Enhance environment validation script at scripts/validate-config.py
- [ ] T057 [US6] Add DATABASE_URL format validation to scripts/validate-config.py
- [ ] T058 [US6] Add BETTER_AUTH_SECRET consistency check to scripts/validate-config.py
- [ ] T059 [US6] Add missing variable detection to scripts/validate-config.py
- [ ] T060 [US6] Document configuration validation workflow in docs/startup-guide.md
- [ ] T061 [US6] Test validation script with missing variables
- [ ] T062 [US6] Test validation script with mismatched secrets
- [ ] T063 [US6] Test validation script with malformed DATABASE_URL
- [ ] T064 [US6] Add configuration validation to specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T065 [US6] Document running validation script in docs/startup-guide.md

**Checkpoint**: Configuration validation complete - errors caught proactively

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation improvements and validation of complete system

- [ ] T066 [P] Create comprehensive startup guide at docs/startup-guide.md
- [ ] T067 [P] Create comprehensive debugging guide at docs/debugging-guide.md
- [ ] T068 Review and complete validation checklist at specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T069 Add common failure scenarios section to docs/debugging-guide.md
- [ ] T070 Verify all health check endpoints respond within 200ms
- [ ] T071 Test concurrent user scenario (10 users performing CRUD operations)
- [ ] T072 Verify startup completes within 30 seconds
- [ ] T073 Verify authentication flow completes within 10 seconds
- [ ] T074 Document all success criteria verification in specs/004-run-project-debug/contracts/validation-checklist.md
- [ ] T075 Run complete validation checklist end-to-end
- [ ] T076 Update CLAUDE.md with validation tools information

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all validation stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1-US3 (P1) should be validated first as they are critical system requirements
  - US4-US5 (P2) can proceed after P1 stories are validated
  - US6 (P3) can proceed independently but provides proactive error detection
- **Polish (Phase 9)**: Depends on all user stories being validated

### User Story Dependencies

- **User Story 1 (P1 - System Validation)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1 - Authentication)**: Can start after US1 (requires running system) - May run in parallel with US1 health checks
- **User Story 3 (P1 - Multi-User Isolation)**: Depends on US2 (requires authentication working) - Critical security validation
- **User Story 4 (P2 - CRUD Flow)**: Depends on US2 (requires authentication) - Can run after US2 completes
- **User Story 5 (P2 - Error Diagnosis)**: Can run in parallel with other stories - Tests failure scenarios
- **User Story 6 (P3 - Config Validation)**: Independent - Can run at any time after Foundational

### Within Each User Story

- Documentation tasks can run in parallel with implementation verification
- Testing tasks must wait for implementation verification to complete
- Validation checklist updates come after testing is complete

### Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel (different files)
- Phase 2: T005 and T006 can run in parallel (different files)
- Within US1: T009 and T010 can run in parallel (different services)
- Within US2: T017 and T018 can run in parallel (different services)
- Within US3: T027 and T028 can run in parallel (different concerns)
- Within US4: T035, T036, T037, T038 can run in parallel (verification tasks)
- Within US5: T046 and T047 can run in parallel (different services)
- Phase 9: T066 and T067 can run in parallel (different documentation files)

---

## Parallel Example: User Story 1

```bash
# Launch health endpoint verification for both services together:
Task: "Add health check endpoint to backend at backend/app/main.py"
Task: "Verify frontend startup configuration in frontend/package.json"
```

---

## Parallel Example: User Story 2

```bash
# Verify JWT configuration in both services together:
Task: "Verify JWT token issuance in Better Auth configuration at frontend/lib/auth.ts"
Task: "Verify JWT verification middleware exists in backend/app/auth.py"
```

---

## Implementation Strategy

### MVP Validation (User Stories 1-3 Only - P1 Stories)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all validation)
3. Complete Phase 3: User Story 1 (System starts)
4. Complete Phase 4: User Story 2 (Authentication works)
5. Complete Phase 5: User Story 3 (Multi-user security verified)
6. **STOP and VALIDATE**: Test complete P1 validation flow
7. System ready for demo/submission

### Incremental Validation

1. Complete Setup + Foundational → Documentation infrastructure ready
2. Validate User Story 1 → System operational
3. Validate User Story 2 → Authentication verified
4. Validate User Story 3 → Security verified (MVP!)
5. Validate User Story 4 → CRUD operations confirmed
6. Validate User Story 5 → Error handling verified
7. Validate User Story 6 → Configuration validation complete
8. Each story adds validation coverage without breaking previous validations

### Parallel Validation Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (System Validation)
   - Developer B: User Story 5 (Error Diagnosis - independent)
   - Developer C: User Story 6 (Config Validation - independent)
3. After US1 completes:
   - Developer A: User Story 2 (Authentication)
4. After US2 completes:
   - Developer A: User Story 3 (Multi-User Isolation)
   - Developer B: User Story 4 (CRUD Flow)
5. Stories validate independently and integrate

---

## Summary Statistics

- **Total Tasks**: 76
- **Setup Phase**: 4 tasks
- **Foundational Phase**: 4 tasks (BLOCKS all validation)
- **User Story 1 (P1)**: 8 tasks - System validation
- **User Story 2 (P1)**: 10 tasks - Authentication flow
- **User Story 3 (P1)**: 8 tasks - Multi-user security
- **User Story 4 (P2)**: 11 tasks - CRUD operations
- **User Story 5 (P2)**: 10 tasks - Error diagnosis
- **User Story 6 (P3)**: 10 tasks - Configuration validation
- **Polish Phase**: 11 tasks

**Parallel Opportunities**: 20+ tasks can run in parallel (marked with [P])

**MVP Scope**: Phases 1-5 (User Stories 1-3) = 34 tasks covering critical P1 validation

**Independent Test Criteria**:
- US1: Start services and verify health endpoints return 200 OK
- US2: Sign up, sign in, make authenticated API call successfully
- US3: Create two users and verify cross-user access returns 403
- US4: Perform all CRUD operations as authenticated user
- US5: Trigger configuration errors and verify clear error messages
- US6: Run validation script and verify all required variables detected

---

## Notes

- This feature focuses on **validation and debugging** rather than building new functionality
- All tasks involve verifying existing implementations from features 001-003
- Tests are **NOT included** as this is manual validation, not automated testing
- [P] tasks = different files or independent verification activities
- [Story] label maps task to specific validation scenario
- Each user story should be independently validatable
- Commit documentation updates after each logical group of tasks
- Stop at any checkpoint to validate story independently
- All validation should result in clear documentation for future debugging
