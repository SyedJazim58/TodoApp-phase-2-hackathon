# Feature Specification: Backend Core & Data Layer for Task Management API

**Feature Branch**: `001-backend-core-data`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Backend Core & Data Layer for Task Management API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Personal Task (Priority: P1)

A backend engineer creates the core data model that allows authenticated users to create their own tasks that belong exclusively to them.

**Why this priority**: This is the foundational capability - without user-scoped task creation, no other operations are possible. This establishes the core ownership model.

**Independent Test**: Can be fully tested by authenticating as User A, creating a task, verifying it's stored in the database with correct user_id, and confirming User B cannot see or access it.

**Acceptance Scenarios**:

1. **Given** an authenticated user with user_id="user123", **When** they create a task with title="Buy groceries", **Then** the task is persisted with user_id="user123" and can be retrieved only by that user
2. **Given** an authenticated user creates a task, **When** another user tries to query all tasks, **Then** they only see their own tasks, never tasks belonging to other users
3. **Given** a task creation request without authentication context, **When** the system processes it, **Then** the operation fails with appropriate error (no orphaned tasks allowed)

---

### User Story 2 - Retrieve User's Task List (Priority: P1)

A backend engineer implements data access logic that retrieves all tasks for an authenticated user, filtered at the query level.

**Why this priority**: Reading task data is equally foundational to writing it. This validates the ownership filtering works correctly for read operations.

**Independent Test**: Can be fully tested by creating 3 tasks for User A and 2 tasks for User B, then verifying each user's retrieval returns only their tasks (User A gets 3, User B gets 2).

**Acceptance Scenarios**:

1. **Given** User A has 5 tasks and User B has 3 tasks, **When** User A queries their tasks, **Then** they receive exactly 5 tasks, all with user_id matching User A
2. **Given** a database with 1000 tasks across 100 users, **When** User X queries their tasks, **Then** the query is filtered by user_id at the database level (not in application code) and returns only User X's tasks
3. **Given** an authenticated user with zero tasks, **When** they query their task list, **Then** they receive an empty array without errors

---

### User Story 3 - Update Task with Ownership Verification (Priority: P2)

A backend engineer implements update logic that verifies task ownership before allowing modifications.

**Why this priority**: Once creation and retrieval work, users need to modify their data. This validates the ownership model extends to write operations.

**Independent Test**: Can be fully tested by User A updating their own task successfully, then User B attempting to update User A's task and receiving a 404 error (task appears not to exist for User B).

**Acceptance Scenarios**:

1. **Given** User A owns task with id=42, **When** User A updates the task title, **Then** the update succeeds and the task reflects the new title
2. **Given** User A owns task with id=42, **When** User B attempts to update task id=42, **Then** the operation fails with 404 Not Found (preventing enumeration)
3. **Given** a task update request that changes user_id, **When** the system processes it, **Then** the operation fails (user_id is immutable after creation)

---

### User Story 4 - Toggle Task Completion Status (Priority: P2)

A backend engineer implements a specific operation to toggle a task's completion status while enforcing ownership.

**Why this priority**: This is a high-frequency operation in task management and validates the ownership model for state transitions.

**Independent Test**: Can be fully tested by creating a task with completed=false, toggling it to true, verifying the change persists, toggling back to false, and confirming another user cannot toggle this task.

**Acceptance Scenarios**:

1. **Given** User A owns an incomplete task (completed=false), **When** User A toggles completion, **Then** the task becomes completed=true and updated_at timestamp is refreshed
2. **Given** User A owns a completed task, **When** User A toggles completion again, **Then** the task becomes incomplete (completed=false)
3. **Given** User B attempts to toggle User A's task, **When** the operation executes, **Then** it fails with 404 Not Found

---

### User Story 5 - Delete Task with Ownership Verification (Priority: P3)

A backend engineer implements delete logic that removes a task only if the authenticated user owns it.

**Why this priority**: Deletion is less frequent than other operations but still critical. This completes the CRUD operation set with ownership enforcement.

**Independent Test**: Can be fully tested by User A deleting their own task successfully (task removed from database), then User B attempting to delete User A's (different) task and receiving 404.

**Acceptance Scenarios**:

1. **Given** User A owns task with id=99, **When** User A deletes it, **Then** the task is removed from the database and subsequent queries return 404
2. **Given** User A owns task id=99, **When** User B attempts to delete task id=99, **Then** the operation fails with 404 Not Found
3. **Given** a delete request for a non-existent task ID, **When** the system processes it, **Then** it returns 404 without revealing whether the task ever existed or belongs to another user

---

### Edge Cases

- What happens when a user_id is provided but doesn't match the authenticated user's ID? (Reject at authorization layer, before data access)
- How does the system handle concurrent updates to the same task by the same user? (Last-write-wins with updated_at timestamp)
- What happens when a query attempts to filter by user_id=NULL or omit user_id? (Fail safe - no query executes without explicit user_id filter)
- How does the system handle database connection failures? (Return 503 Service Unavailable with generic error message)
- What happens when a task title exceeds database column limits? (Validation error at Pydantic layer before database interaction)
- How does the system prevent timing attacks that reveal task existence? (All ownership failures return identical 404 response with consistent timing)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend core MUST be implemented using FastAPI framework
- **FR-002**: Data models MUST be defined using SQLModel (which combines Pydantic and SQLAlchemy)
- **FR-003**: Database persistence MUST use Neon Serverless PostgreSQL
- **FR-004**: Every task entity MUST include: id (unique identifier), user_id (non-nullable foreign key), title (required string), description (optional string), completed (boolean, default false), created_at (timestamp), updated_at (timestamp)
- **FR-005**: Task.user_id MUST be non-nullable and required at creation time - no orphaned tasks allowed
- **FR-006**: All database queries for tasks MUST filter by user_id at the query construction level, not in application logic after retrieval
- **FR-007**: Create operation MUST accept user_id from authentication context and persist new task with that user_id
- **FR-008**: Retrieve operation MUST return only tasks where task.user_id matches authenticated user_id
- **FR-009**: Update operation MUST verify task existence AND ownership (task.user_id == authenticated user_id) before applying changes
- **FR-010**: Toggle-complete operation MUST verify ownership, flip completed boolean, and update updated_at timestamp
- **FR-011**: Delete operation MUST verify ownership before removing task from database
- **FR-012**: Any ownership verification failure MUST return 404 Not Found (never 403 Forbidden) to prevent task ID enumeration
- **FR-013**: Errors MUST NOT reveal whether a task exists for a different user - all unauthorized access attempts receive identical 404 responses
- **FR-014**: Database connection errors and internal exceptions MUST be handled gracefully without exposing stack traces or internal details to clients
- **FR-015**: Task.user_id MUST be immutable after creation - updates that attempt to change user_id MUST be rejected
- **FR-016**: Updated_at timestamp MUST be automatically refreshed on any task modification
- **FR-017**: Backend MUST NOT implement authentication, JWT verification, or user management - these are handled by separate authentication layer

### Key Entities

- **Task**: Represents a user's todo item with completion tracking. Core attributes: unique identifier, owning user reference (non-nullable), title (required), optional description, completion status (boolean), creation timestamp, last-modified timestamp. Tasks are strictly single-owner - one task belongs to exactly one user.

- **User Reference**: Backend does NOT manage user entities. user_id is treated as an opaque identifier provided by authentication layer. Backend enforces referential integrity but delegates authentication and user lifecycle to separate system.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All task operations (create, read, update, toggle, delete) correctly filter by user_id at database query level, verified by query inspection
- **SC-002**: Zero cross-user data leakage - 100% of test cases where User A attempts to access User B's tasks result in 404 responses
- **SC-003**: Backend can persist and retrieve task data reliably with 99.9% success rate under normal operating conditions (excluding infrastructure failures)
- **SC-004**: Database schema supports all required task operations without requiring schema changes after initial implementation
- **SC-005**: All ownership validation failures return consistent 404 responses with no information leakage about task existence
- **SC-006**: System handles database errors gracefully without exposing internal implementation details (100% of database errors return appropriate 5xx responses)
- **SC-007**: Data model prevents orphaned tasks - 100% of task records have valid, non-null user_id values
- **SC-008**: Implementation can be completed directly from this specification without requiring clarification on data model, ownership rules, or error handling

## Assumptions *(mandatory)*

- **A-001**: User authentication and JWT token verification are handled by a separate authentication middleware that provides user_id to backend routes
- **A-002**: The authentication layer guarantees that user_id is valid and corresponds to an authenticated user (backend trusts this value)
- **A-003**: Database migrations and schema management tooling exist separately and are not part of this backend core implementation
- **A-004**: Neon PostgreSQL connection is configured externally (connection string, credentials, pool settings)
- **A-005**: Error responses follow standard HTTP status code conventions (404, 403, 500, 503)
- **A-006**: FastAPI application structure follows standard patterns (router, dependency injection, Pydantic models for request/response)
- **A-007**: SQLModel handles ORM mapping and database session management
- **A-008**: Task ID generation uses database auto-increment or UUID strategy (decision deferred to implementation)
- **A-009**: Timestamp fields use UTC timezone
- **A-010**: "Toggle complete" operation is a convenience endpoint that reads current state and flips it - not a separate data operation

## Scope & Boundaries *(mandatory)*

### In Scope

- Task data model definition (SQLModel classes)
- Database query logic with user_id filtering
- CRUD operations for tasks (create, read, update, delete)
- Toggle-complete operation
- Ownership verification at data access layer
- Error handling for database and ownership violations
- Data integrity rules (non-null user_id, immutable ownership)

### Out of Scope

- Authentication logic, JWT verification, user management
- Frontend API endpoints (routes, request validation, response formatting)
- Database migration tooling and scripts
- Connection pooling configuration
- Performance optimization (caching, indexing strategies)
- Analytics, reporting, or aggregation queries
- Soft deletes or task archival
- Multi-tenant admin access or cross-user operations
- Background jobs, task queues, scheduled operations
- Task sharing, collaboration, or permissions beyond single-owner model

## Dependencies *(mandatory)*

### External Dependencies

- **Neon Serverless PostgreSQL**: Cloud database service providing PostgreSQL instance
- **FastAPI**: Python web framework for building the API layer
- **SQLModel**: ORM library combining Pydantic and SQLAlchemy for data models
- **Authentication Layer**: Separate system providing JWT verification and user_id extraction (not part of this feature)

### Internal Dependencies

- **Database Schema**: Requires initial schema with tasks table matching the data model
- **Database Connection**: Requires configured connection to Neon PostgreSQL (connection string, credentials)
- **Authentication Context**: Requires user_id to be available in request context (provided by auth middleware)

## Non-Functional Requirements *(if applicable)*

### Security

- **NFR-S-001**: All database queries MUST use parameterized queries to prevent SQL injection
- **NFR-S-002**: User_id filtering MUST be enforced at the ORM/query level, not post-retrieval, to prevent accidental data leakage
- **NFR-S-003**: Error messages MUST NOT expose internal implementation details (table names, column names, query structure)
- **NFR-S-004**: Timing of 404 responses MUST be consistent regardless of whether task exists for another user (prevent timing attacks)

### Reliability

- **NFR-R-001**: Database connection failures MUST be caught and return 503 Service Unavailable
- **NFR-R-002**: Data integrity constraints (non-null user_id, valid foreign keys) MUST be enforced at database level, not just application level
- **NFR-R-003**: Failed operations MUST NOT leave partial or inconsistent data in the database

### Data Integrity

- **NFR-D-001**: Every task record MUST have a valid, non-null user_id (enforced via database NOT NULL constraint)
- **NFR-D-002**: User_id MUST be immutable after task creation (enforced in update logic)
- **NFR-D-003**: Timestamps (created_at, updated_at) MUST be managed automatically (created_at set once, updated_at refreshed on modification)

## Follow-up Questions & Risks *(if applicable)*

### Clarifications Needed

None - all critical decisions have been made with reasonable defaults documented in Assumptions.

### Known Risks

1. **Database Connection Management**: Neon Serverless PostgreSQL has cold start latency and connection limits. Mitigation: Use connection pooling and handle transient connection failures with retries (implementation detail, not spec requirement).

2. **Timing Attack on Task Enumeration**: Even with consistent 404 responses, sophisticated attackers might detect task existence via timing. Mitigation: Add constant-time delay or jitter to all ownership failure responses (implementation detail).

3. **Concurrent Modification**: Last-write-wins strategy on updated_at could lead to lost updates if users modify the same task simultaneously. Mitigation: Consider optimistic locking with version field in future iteration (not in current scope).
