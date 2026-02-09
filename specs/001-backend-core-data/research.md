# Research: Backend Core & Data Layer

**Date**: 2026-02-08
**Feature**: 001-backend-core-data

## 1. SQLModel User Filtering Patterns

**Decision**: Repository pattern with explicit user_id parameter passed to all query methods. Each repository method will require user_id as a parameter and construct filtered queries using SQLModel's select() with .where(Task.user_id == user_id).

**Rationale**:
- Explicit parameter passing makes ownership filtering visible and auditable in every method signature
- Prevents accidental unfiltered queries since no "get all" methods exist without user_id
- SQLModel/SQLAlchemy select() with where() clause provides parameterized queries preventing SQL injection
- Repository layer centralizes all data access, creating a single checkpoint for security enforcement

**Alternatives Considered**:
1. **Session-level query filters**: SQLAlchemy's session events could auto-inject filters, but this is implicit and harder to audit
2. **Scoped sessions with context vars**: Thread-local or context variable storage of user_id, but adds complexity and makes dependencies non-obvious
3. **Direct ORM usage in business logic**: Rejected because it scatters filtering logic across N call sites instead of 1 repository

**Implementation Notes**:
- Create base `TaskRepository` class with methods: `create(user_id, data)`, `get_by_id(user_id, task_id)`, `get_all(user_id)`, `update(user_id, task_id, data)`, `delete(user_id, task_id)`
- Use SQLModel's `select(Task).where(Task.user_id == user_id)` for filtering
- Return `None` when task not found (for ownership verification failures), let caller decide on 404 response
- Use dependency injection to provide repository instances to business logic layers

## 2. Neon PostgreSQL Connection Management

**Decision**: Use SQLModel's create_engine with connection pooling configured for serverless PostgreSQL. Engine configured with pool_size=5, max_overflow=10, pool_pre_ping=True for connection health checks.

**Rationale**:
- Neon Serverless PostgreSQL supports standard PostgreSQL connection strings with psycopg2
- Pool_pre_ping=True handles cold starts by validating connections before use
- Small pool size (5) respects Neon's connection limits while allowing concurrent requests
- Max_overflow=10 provides burst capacity without overwhelming database
- SQLModel's session management integrates cleanly with FastAPI dependency injection

**Alternatives Considered**:
1. **Connection per request**: Rejected due to cold start latency on every request
2. **Larger pool sizes**: Rejected because serverless databases have connection limits
3. **External connection poolers (PgBouncer)**: Out of scope for this phase, consider for production scaling

**Implementation Notes**:
- Connection string format: `postgresql://user:password@host/database?sslmode=require`
- Store in environment variable `DATABASE_URL`
- Create engine at module level: `engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)`
- Use FastAPI dependency to provide sessions: `def get_session() -> Generator[Session, None, None]: with Session(engine) as session: yield session`
- All repository methods accept `session: Session` from dependency injection

## 3. Ownership Verification Security

**Decision**: Return 404 for all ownership failures. Implement at repository level by filtering queries to include both task_id AND user_id. Do not check existence first, then ownership - combine into single query.

**Rationale**:
- Single query `select(Task).where(Task.id == task_id, Task.user_id == user_id)` returns None for both non-existent tasks and unauthorized access
- Timing consistency: whether task doesn't exist or belongs to another user, same query path and response
- 404 prevents enumeration attacks where 403 would reveal task existence
- Database-level NOT NULL constraint on user_id prevents orphaned tasks
- Immutability enforced by excluding user_id from update operations

**Alternatives Considered**:
1. **403 Forbidden for ownership failures**: Rejected because it reveals task existence to unauthorized users
2. **Two-step verification (exists check, then ownership check)**: Rejected due to timing attack vulnerability and unnecessary queries
3. **Soft deletes with ownership filters**: Out of scope per spec, hard delete is simpler

**Implementation Notes**:
- Database schema: `user_id VARCHAR NOT NULL` (no foreign key to User table since users are managed externally)
- Repository methods combine filters: `.where(Task.id == task_id, Task.user_id == user_id)`
- Update operations explicitly exclude user_id: `update_data = data.dict(exclude={'user_id', 'id', 'created_at'})`
- All ownership failures return None, caller translates to HTTPException(404)

## 4. Error Handling Strategy

**Decision**: Custom exception hierarchy with FastAPI exception handlers. Define `ResourceNotFoundError` for ownership/existence failures, `DatabaseError` for connection/query failures. Use FastAPI's exception_handler decorator to map exceptions to consistent HTTP responses.

**Rationale**:
- Separation of concerns: Repository layer raises domain exceptions, HTTP layer translates to status codes
- Consistent error schema: all errors return `{"detail": "message"}` structure
- Information hiding: Database errors return generic 503 messages without stack traces
- Custom exceptions provide type-safe error handling at business logic layer

**Alternatives Considered**:
1. **Raise HTTPException directly in repositories**: Rejected because it couples data layer to HTTP layer
2. **Return Result/Either types**: Over-engineering for Python, exceptions are idiomatic
3. **Global exception handler only**: Rejected because it provides less control over error mapping

**Implementation Notes**:
- Create `exceptions.py` with `ResourceNotFoundError(task_id)`, `DatabaseError(original_exception)`
- Repository methods raise `ResourceNotFoundError` when query returns None
- Wrap database operations in try/except, catch SQLAlchemy exceptions and raise `DatabaseError`
- FastAPI exception handlers:
  - `ResourceNotFoundError` → 404 with `{"detail": "Task not found"}`
  - `DatabaseError` → 503 with `{"detail": "Service temporarily unavailable"}`
  - Never expose internal details (table names, column names, query structure)

## 5. Testing Strategy

**Decision**: Pytest with fixture-based database session management. Use in-memory SQLite for unit tests (repository isolation), separate test database for integration tests (full stack). Fixtures provide pre-configured user contexts and rollback transactions.

**Rationale**:
- SQLite in-memory for fast unit tests of repository logic without external dependencies
- Separate test database for integration tests validates PostgreSQL-specific behavior
- Transaction rollback after each test ensures isolation without database cleanup overhead
- Fixture-based user contexts (`user_a_context`, `user_b_context`) enable multi-user isolation tests

**Alternatives Considered**:
1. **Mock database/ORM**: Rejected because it doesn't test actual SQL queries and filters
2. **Shared test database with cleanup**: Rejected due to test interdependencies and slower execution
3. **Docker containers per test**: Over-engineering for this phase, consider for CI/CD

**Implementation Notes**:
- Pytest fixtures:
  - `db_session`: Provides database session with transaction that rolls back after test
  - `task_repository`: Repository instance with test session
  - `user_a_id`, `user_b_id`: Test user identifiers (e.g., "test-user-a", "test-user-b")
- Test structure:
  - `test_task_repository.py`: Unit tests for each repository method with ownership scenarios
  - `test_ownership.py`: Cross-user isolation tests (User A creates, User B attempts access)
  - Use parametrized tests for CRUD operations with different user contexts
- Assertion patterns:
  - Assert repository returns None for unauthorized access (not raising exceptions)
  - Assert all retrieved tasks have correct user_id
  - Assert User B cannot see User A's tasks in get_all() results

## Summary

All technical decisions prioritize **security through simplicity**: explicit user_id parameters, single-query ownership verification, consistent error responses, and centralized filtering in the repository layer. The repository pattern is the minimal abstraction necessary to guarantee user data isolation without scattering security logic across the codebase.
