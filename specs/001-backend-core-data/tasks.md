---
description: "Task list for backend core & data layer implementation"
---

# Tasks: Backend Core & Data Layer for Task Management API

**Input**: Design documents from `/specs/001-backend-core-data/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included based on the spec's emphasis on independent testing and ownership verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `database/schema/`
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure per plan.md (backend/src/{models,database,repositories,exceptions}, backend/tests/, database/schema/)
- [X] T002 [P] Initialize Python project with requirements.txt (fastapi==0.109.0, sqlmodel==0.0.14, psycopg2-binary==2.9.9, python-dotenv==1.0.0)
- [X] T003 [P] Add development dependencies to requirements.txt (pytest==7.4.3, pytest-cov==4.1.0)
- [X] T004 [P] Create .env.example file with DATABASE_URL and LOG_LEVEL templates
- [X] T005 [P] Create .gitignore file with .env, venv/, __pycache__/, *.pyc, .pytest_cache/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create database schema file database/schema/001_initial_schema.sql with tasks table (id SERIAL, user_id VARCHAR(255) NOT NULL, title VARCHAR(500) NOT NULL, description TEXT, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMP, updated_at TIMESTAMP)
- [X] T007 [P] Create Task SQLModel in backend/src/models/task.py with TaskBase, Task, TaskCreate, TaskUpdate, TaskRead classes per data-model.md
- [X] T008 [P] Create database connection module in backend/src/database/connection.py with create_engine (pool_size=5, max_overflow=10, pool_pre_ping=True) and get_session dependency
- [X] T009 [P] Create custom exceptions in backend/src/exceptions/__init__.py with DatabaseError and ResourceNotFoundError classes per contracts/exceptions.md
- [X] T010 [P] Create empty __init__.py files in backend/src/, backend/src/models/, backend/src/database/, backend/src/repositories/, backend/src/exceptions/, backend/tests/
- [X] T011 Create pytest configuration in backend/pytest.ini with test discovery paths and coverage settings
- [X] T012 [P] Create pytest fixtures in backend/tests/conftest.py with db_session fixture (SQLite in-memory), user_a_id fixture, user_b_id fixture

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Personal Task (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to create tasks that belong exclusively to them, with ownership verification preventing cross-user access

**Independent Test**: Authenticate as User A, create a task, verify it's stored with correct user_id, confirm User B cannot see or access it

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US1] Create test_task_model.py in backend/tests/ with tests for Task creation with all fields, minimal fields (title only), validation failures (title too long), and default values (completed=False, timestamps auto-set)
- [X] T014 [P] [US1] Create test_task_repository.py in backend/tests/ with test fixtures for task_repository (TaskRepository with test session)

### Implementation for User Story 1

- [X] T015 [US1] Implement TaskRepository.create() method in backend/src/repositories/task_repository.py that accepts user_id and task_data, creates Task with user_id, wraps exceptions in DatabaseError
- [X] T016 [US1] Add test case test_create_task_with_user_id() in backend/tests/test_task_repository.py that verifies task persisted with correct user_id
- [X] T017 [US1] Add test case test_create_task_ownership_isolation() in backend/tests/test_task_repository.py that verifies User A's task is not accessible by User B using get_by_id
- [X] T018 [US1] Add test case test_create_task_validates_required_fields() in backend/tests/test_task_repository.py that verifies Pydantic validation for required title field
- [ ] T019 [US1] Execute schema against Neon PostgreSQL database using psql or database client
- [X] T020 [US1] Add logging for task creation operations in TaskRepository.create() method

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create tasks with ownership enforcement

---

## Phase 4: User Story 2 - Retrieve User's Task List (Priority: P1)

**Goal**: Implement data access logic that retrieves all tasks for an authenticated user, filtered at the query level

**Independent Test**: Create 3 tasks for User A and 2 tasks for User B, verify each user's retrieval returns only their tasks

### Tests for User Story 2

- [X] T021 [P] [US2] Create test_ownership.py in backend/tests/ for cross-user isolation tests

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement TaskRepository.get_all() method in backend/src/repositories/task_repository.py that filters by user_id at query level using select(Task).where(Task.user_id == user_id)
- [X] T023 [P] [US2] Implement TaskRepository.get_by_id() method in backend/src/repositories/task_repository.py that filters by both task_id AND user_id, returns None if not found
- [X] T024 [US2] Add test case test_get_all_filters_by_user() in backend/tests/test_task_repository.py that creates tasks for User A and User B, verifies each user only sees their own tasks
- [X] T025 [US2] Add test case test_get_by_id_ownership_filter() in backend/tests/test_task_repository.py that verifies User A cannot access User B's task (returns None)
- [X] T026 [US2] Add test case test_get_all_empty_list() in backend/tests/test_task_repository.py that verifies empty list returned for user with no tasks
- [X] T027 [US2] Add test case test_cross_user_data_leakage() in backend/tests/test_ownership.py that creates 1000 tasks across multiple users, verifies query filtering at database level

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - create and retrieve with ownership

---

## Phase 5: User Story 3 - Update Task with Ownership Verification (Priority: P2)

**Goal**: Implement update logic that verifies task ownership before allowing modifications

**Independent Test**: User A updates their own task successfully, User B attempts to update User A's task and receives None (404 pattern)

### Implementation for User Story 3

- [X] T028 [US3] Implement TaskRepository.update() method in backend/src/repositories/task_repository.py that fetches task with ownership check, applies updates (excluding user_id, id, created_at), refreshes updated_at timestamp
- [X] T029 [US3] Add test case test_update_task_with_ownership() in backend/tests/test_task_repository.py that verifies User A can update their own task title
- [X] T030 [US3] Add test case test_update_task_ownership_failure() in backend/tests/test_task_repository.py that verifies User B cannot update User A's task (returns None)
- [X] T031 [US3] Add test case test_update_task_immutable_user_id() in backend/tests/test_task_repository.py that verifies user_id cannot be changed via update (excluded from update_data)
- [X] T032 [US3] Add test case test_update_refreshes_updated_at() in backend/tests/test_task_repository.py that verifies updated_at timestamp changes on modification

**Checkpoint**: All create, retrieve, and update operations enforce ownership

---

## Phase 6: User Story 4 - Toggle Task Completion Status (Priority: P2)

**Goal**: Implement a specific operation to toggle task completion status while enforcing ownership

**Independent Test**: Create task with completed=false, toggle to true, verify persistence, toggle back to false, confirm another user cannot toggle

### Implementation for User Story 4

- [X] T033 [US4] Implement TaskRepository.toggle_complete() method in backend/src/repositories/task_repository.py that fetches task with ownership check, flips completed boolean, refreshes updated_at
- [X] T034 [US4] Add test case test_toggle_complete_false_to_true() in backend/tests/test_task_repository.py that verifies incomplete task becomes completed
- [X] T035 [US4] Add test case test_toggle_complete_true_to_false() in backend/tests/test_task_repository.py that verifies completed task becomes incomplete
- [X] T036 [US4] Add test case test_toggle_complete_ownership_failure() in backend/tests/test_task_repository.py that verifies User B cannot toggle User A's task (returns None)
- [X] T037 [US4] Add test case test_toggle_complete_refreshes_timestamp() in backend/tests/test_task_repository.py that verifies updated_at changes on toggle

**Checkpoint**: All CRUD operations except delete are complete with ownership enforcement

---

## Phase 7: User Story 5 - Delete Task with Ownership Verification (Priority: P3)

**Goal**: Implement delete logic that removes a task only if the authenticated user owns it

**Independent Test**: User A deletes their own task successfully (removed from database), User B attempts to delete User A's task and receives False

### Implementation for User Story 5

- [X] T038 [US5] Implement TaskRepository.delete() method in backend/src/repositories/task_repository.py that fetches task with ownership check, permanently removes from database, returns True if deleted or False if not found
- [X] T039 [US5] Add test case test_delete_task_with_ownership() in backend/tests/test_task_repository.py that verifies User A can delete their own task
- [X] T040 [US5] Add test case test_delete_task_ownership_failure() in backend/tests/test_task_repository.py that verifies User B cannot delete User A's task (returns False)
- [X] T041 [US5] Add test case test_delete_nonexistent_task() in backend/tests/test_task_repository.py that verifies delete of non-existent task returns False without error
- [X] T042 [US5] Add test case test_delete_task_permanent_removal() in backend/tests/test_task_repository.py that verifies subsequent queries for deleted task return None

**Checkpoint**: All user stories (US1-US5) are complete with full CRUD operations and ownership enforcement

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

- [ ] T043 [P] Add database error handling tests in backend/tests/test_task_repository.py that simulate connection failures and verify DatabaseError is raised
- [ ] T044 [P] Add edge case tests in backend/tests/test_task_repository.py for title length validation, concurrent updates (last-write-wins), NULL user_id rejection
- [ ] T045 [P] Add timing consistency tests in backend/tests/test_ownership.py that verify "not found" and "wrong owner" have similar response times
- [ ] T046 Run full test suite with pytest backend/tests/ -v --cov=src --cov-report=html and verify >90% coverage
- [ ] T047 [P] Add docstrings to all TaskRepository methods in backend/src/repositories/task_repository.py following contracts/repository-interface.md
- [ ] T048 [P] Verify database indexes exist on tasks table (user_id, composite user_id+id) using psql \d tasks
- [ ] T049 Validate implementation against quickstart.md verification checklist (schema, environment, repository methods, exceptions, tests, ownership isolation)
- [ ] T050 [P] Update .env.example with actual Neon connection string format if different from template

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P2 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses TaskRepository from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Builds on create/retrieve but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Special case of update but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Completes CRUD set but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before repositories
- Repository methods before tests that use them
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T002, T003, T004, T005 can all run in parallel (different files)

**Foundational Phase (Phase 2)**:
- T007, T008, T009, T010, T012 can run in parallel (different files)

**User Story 1 (Phase 3)**:
- T013, T014 can run in parallel (different test files)

**User Story 2 (Phase 4)**:
- T021, T022, T023 can run in parallel (different files/methods)

**Polish Phase (Phase 8)**:
- T043, T044, T045, T047, T048, T050 can run in parallel (different files)

**Cross-Story Parallelization**:
Once Foundational phase completes, User Stories 1-5 could be worked on in parallel by different team members, as each story is independently testable.

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational components together:
Task: "Create Task SQLModel in backend/src/models/task.py"
Task: "Create database connection module in backend/src/database/connection.py"
Task: "Create custom exceptions in backend/src/exceptions/__init__.py"
Task: "Create pytest fixtures in backend/tests/conftest.py"
```

---

## Parallel Example: User Story 1

```bash
# Launch all test files for User Story 1 together:
Task: "Create test_task_model.py in backend/tests/"
Task: "Create test_task_repository.py in backend/tests/"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

**Why US1 + US2**: These two P1 stories together form a minimal viable backend - create and retrieve operations

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create)
4. Complete Phase 4: User Story 2 (Retrieve)
5. **STOP and VALIDATE**: Test create + retrieve independently
6. Deploy/demo if ready

**Result**: Users can create and view their tasks with ownership enforcement

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational → Infrastructure ready
2. **MVP (US1+US2)**: Add create + retrieve → Test independently → Deploy/Demo
3. **Updates (US3)**: Add update capability → Test independently → Deploy/Demo
4. **Toggle (US4)**: Add completion toggle → Test independently → Deploy/Demo
5. **Delete (US5)**: Add delete capability → Test independently → Deploy/Demo
6. **Polish (Phase 8)**: Add edge cases, documentation, validation

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

**Option 1 - Story per Developer**:
- Developer A: User Story 1 (Create)
- Developer B: User Story 2 (Retrieve)
- Developer C: User Story 3 (Update)

**Option 2 - Layer per Developer** (within single story):
- Developer A: Models and database for US1
- Developer B: Repository methods for US1
- Developer C: Tests for US1

**Option 3 - Sequential Priority**:
- All developers: Complete US1 together → US2 → US3 → US4 → US5

---

## Task Count Summary

- **Total Tasks**: 50
- **Setup Phase**: 5 tasks (T001-T005)
- **Foundational Phase**: 7 tasks (T006-T012)
- **User Story 1**: 8 tasks (T013-T020)
- **User Story 2**: 7 tasks (T021-T027)
- **User Story 3**: 5 tasks (T028-T032)
- **User Story 4**: 5 tasks (T033-T037)
- **User Story 5**: 5 tasks (T038-T042)
- **Polish Phase**: 8 tasks (T043-T050)

**Parallel Opportunities**: 19 tasks marked with [P] can run in parallel when dependencies are met

**MVP Scope**: Phases 1-4 (Tasks T001-T027) = 27 tasks for minimal viable backend

---

## Notes

- **[P] tasks**: Different files, no dependencies within phase
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story**: Independently completable and testable
- **Tests fail first**: Verify tests fail before implementing (TDD approach)
- **Commit frequently**: After each task or logical group
- **Validate at checkpoints**: Stop at any checkpoint to test story independently
- **File paths**: All paths are exact and follow plan.md structure (backend/src/, backend/tests/, database/schema/)
- **Ownership verification**: Core security requirement tested in every user story
- **Database-level filtering**: All queries filter by user_id at query construction, not post-retrieval
- **Error handling**: Repository methods wrap exceptions in DatabaseError, return None for ownership failures
- **Timestamps**: created_at immutable, updated_at refreshed on modifications
