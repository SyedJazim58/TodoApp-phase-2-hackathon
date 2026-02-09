# Implementation Plan: Backend Core & Data Layer for Task Management API

**Branch**: `001-backend-core-data` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-backend-core-data/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build the backend core data layer that enables authenticated users to manage their personal tasks with strict ownership enforcement. This feature implements FastAPI with SQLModel ORM connected to Neon Serverless PostgreSQL, providing CRUD operations (Create, Read, Update, Toggle Complete, Delete) that filter all database queries by authenticated user_id at the query level. The implementation enforces zero-trust principles where every task operation verifies ownership before execution, returning 404 for all unauthorized access attempts to prevent task ID enumeration.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.109+, SQLModel 0.0.14+, Psycopg2-binary, Python-dotenv
**Storage**: Neon Serverless PostgreSQL (cloud-hosted)
**Testing**: pytest (testing strategy determined in research phase)
**Target Platform**: Linux server (containerized deployment ready)
**Project Type**: Web application (backend component only)
**Performance Goals**: <500ms p95 latency for API operations, handle concurrent requests from multiple users
**Constraints**: Serverless database cold start latency, connection pooling required, stateless design (no backend sessions)
**Scale/Scope**: Multi-user system, 5 core CRUD operations, strict user data isolation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| **I. Security-First Design (Zero Trust)** | ⚠️ PARTIAL | Backend implements ownership verification but does NOT handle JWT verification (out of scope per FR-017). Assumes authentication layer provides trusted user_id. This is acceptable as backend focuses on data layer, not auth layer. |
| **II. User Data Isolation** | ✅ PASS | All queries filter by user_id at database level (FR-006). Ownership verified before all write operations (FR-009, FR-011). Cross-user access returns 404 (FR-012). |
| **III. Spec-Driven Development** | ✅ PASS | Complete specification exists with clear acceptance scenarios, functional requirements, and success criteria. This plan derives directly from spec. |
| **IV. Stateless Authentication** | ⚠️ DEFERRED | JWT verification explicitly out of scope (FR-017, A-001). Authentication layer provides user_id; backend trusts it. Separation of concerns maintained. |
| **V. Clear Separation of Concerns** | ✅ PASS | Backend focuses solely on data persistence and business logic. No authentication implementation. Clear API contracts with frontend. |
| **VI. Predictable RESTful API** | ⚠️ PARTIAL | Error handling specified (404 for ownership failures per FR-012), but REST endpoint structure deferred to separate feature. This feature implements data layer only. |
| **VII. Smallest Viable Change** | ✅ PASS | Minimal scope: data model + CRUD operations with ownership verification. No authentication, no API routing, no performance optimization beyond requirements. |

**Overall Assessment**: ✅ **PASS WITH CLARIFICATIONS**

**Justification for Partial Compliance**:
- Principles I and IV show partial compliance because JWT verification is explicitly out of scope (FR-017). The backend core focuses on the data layer and assumes a separate authentication middleware provides validated user_id. This is an intentional architectural decision that maintains separation of concerns (Principle V).
- Principle VI shows partial compliance because REST API endpoint routing is deferred to a separate feature that will integrate this data layer. This feature establishes the data foundation.

**Gate Decision**: Proceed to Phase 0 research. The partial compliance items are documented architectural decisions that align with the spec's scope boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py          # Task SQLModel with user_id filtering
│   │   └── base.py          # Shared base model configuration
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py    # Neon PostgreSQL connection setup
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── task_repository.py  # Data access layer with ownership enforcement
│   └── config.py            # Environment configuration
├── tests/
│   ├── __init__.py
│   ├── test_task_model.py   # Model validation tests
│   ├── test_task_repository.py  # Repository operation tests
│   └── test_ownership.py    # Cross-user isolation tests
├── alembic/                 # Database migrations (future)
│   └── versions/
├── requirements.txt         # Python dependencies
└── .env.example             # Environment template

database/
└── schema/
    └── 001_initial_schema.sql  # Initial database schema
```

**Structure Decision**: Web application structure (backend component only). This feature implements the backend data layer with clear separation:

- **models/**: SQLModel definitions with validation rules and relationships
- **database/**: Connection management and session handling for Neon PostgreSQL
- **repositories/**: Data access logic with user_id filtering at query construction level
- **tests/**: Ownership verification, CRUD operations, cross-user isolation tests

Frontend integration will be handled by a separate feature that consumes this data layer through a REST API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern | Centralize user_id filtering logic in single location | Direct ORM usage in business logic would scatter ownership verification across multiple call sites, increasing risk of data leakage if any single location forgets to filter by user_id |

**Justification**: The repository pattern is the smallest abstraction that guarantees ownership verification happens exactly once per query construction, rather than being a repeated concern throughout the application. This reduces the attack surface for user data isolation bugs from N call sites to 1 repository layer.

---

## Phase 0: Research - COMPLETED ✅

**Deliverable**: `research.md`

**Research Topics Covered**:
1. ✅ SQLModel User Filtering Patterns - Repository pattern with explicit user_id parameters
2. ✅ Neon PostgreSQL Connection Management - Connection pooling with pool_pre_ping for cold starts
3. ✅ Ownership Verification Security - Single-query filtering, consistent 404 responses
4. ✅ Error Handling Strategy - Custom exception hierarchy with FastAPI handlers
5. ✅ Testing Strategy - Pytest with fixture-based session management

**Key Decisions**:
- **Repository Pattern**: Explicit user_id parameters in all methods prevent accidental unfiltered queries
- **Connection Pooling**: pool_size=5, max_overflow=10, pool_pre_ping=True for serverless PostgreSQL
- **Ownership Verification**: Single query with combined filters (id + user_id) prevents timing attacks
- **Error Mapping**: DatabaseError → 503, ResourceNotFoundError → 404, no information leakage
- **Testing**: SQLite in-memory for unit tests, separate test database for integration tests

**Unknowns Resolved**: All NEEDS CLARIFICATION items from Technical Context resolved through research.

---

## Phase 1: Design & Contracts - COMPLETED ✅

**Deliverables**:
- ✅ `data-model.md` - Complete Task entity definition with SQLModel classes
- ✅ `contracts/repository-interface.md` - Repository method signatures and contracts
- ✅ `contracts/exceptions.md` - Exception hierarchy and HTTP mapping
- ✅ `quickstart.md` - Developer setup and implementation guide
- ✅ Agent context updated in `CLAUDE.md`

**Data Model Design**:
- Task entity with 7 fields: id, user_id, title, description, completed, created_at, updated_at
- Non-nullable user_id with database-level NOT NULL constraint
- Indexes on user_id and (user_id, id) for query performance
- Immutability rules: user_id, id, created_at never change after creation

**Repository Interface**:
- 6 methods: create, get_by_id, get_all, update, toggle_complete, delete
- All methods require explicit user_id parameter
- Return None for ownership failures (not exceptions at repository level)
- DatabaseError wraps all database operation failures

**Exception Design**:
- ResourceNotFoundError: 404 response (ownership failures)
- DatabaseError: 503 response (connection/query failures)
- Consistent error schema: `{"detail": "message"}`
- No stack traces or internal details exposed to clients

**Project Structure**:
```
backend/src/{models,database,repositories,exceptions}
backend/tests/
database/schema/
```

---

## Phase 1: Post-Design Constitution Re-Check

*Re-evaluation after completing design artifacts*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Security-First Design (Zero Trust)** | ✅ IMPROVED | Repository design explicitly enforces ownership verification in every query. Single-query pattern prevents timing attacks. Error handling prevents information leakage. |
| **II. User Data Isolation** | ✅ PASS | Design enforces isolation at 3 layers: (1) Repository query filtering, (2) Database NOT NULL constraint, (3) Immutability rules. Zero cross-user data leakage possible. |
| **III. Spec-Driven Development** | ✅ PASS | All design artifacts derive directly from spec requirements. Data model maps to FR-004 through FR-017. Repository interface satisfies all user stories. |
| **IV. Stateless Authentication** | ⚠️ DEFERRED | Still out of scope. Design assumes authentication layer provides user_id. Separation maintained. |
| **V. Clear Separation of Concerns** | ✅ PASS | Repository handles data access, exceptions handle error translation, no HTTP concerns in data layer. Clean dependency injection patterns. |
| **VI. Predictable RESTful API** | ✅ IMPROVED | Error handling fully specified (404 for ownership, 503 for database). REST endpoints will consume this layer in separate feature. |
| **VII. Smallest Viable Change** | ✅ PASS | Design remains minimal: data model + repository + exceptions. No unnecessary abstractions. Repository pattern justified in Complexity Tracking. |

**Post-Design Assessment**: ✅ **FULL COMPLIANCE** (with documented deferrals)

**Improvements from Phase 1**:
- Security-First: Repository design eliminates accidental unfiltered queries
- API Predictability: Complete error handling specification with HTTP mapping
- Separation: Clear boundaries between data layer and future HTTP layer

**Remaining Deferrals**:
- Principle IV (Stateless Authentication): Intentionally out of scope, will be addressed in separate authentication feature

---

## Phase 2: Task Generation - NEXT STEP

**Command**: `/sp.tasks`

**Expected Output**: `tasks.md` with dependency-ordered implementation tasks

**Prerequisites**: ✅ All Phase 0 and Phase 1 artifacts completed

**Ready to Proceed**: Yes - research complete, design documented, agent context updated

---

## Implementation Artifacts Summary

| Artifact | Status | Location | Purpose |
|----------|--------|----------|---------|
| Feature Spec | ✅ Complete | `spec.md` | Requirements and acceptance criteria |
| Implementation Plan | ✅ Complete | `plan.md` (this file) | Architecture decisions and structure |
| Research | ✅ Complete | `research.md` | Technical decisions and alternatives |
| Data Model | ✅ Complete | `data-model.md` | Task entity definition and SQLModel classes |
| Repository Contract | ✅ Complete | `contracts/repository-interface.md` | Data access interface |
| Exception Contract | ✅ Complete | `contracts/exceptions.md` | Error handling specification |
| Quickstart Guide | ✅ Complete | `quickstart.md` | Developer setup instructions |
| Task List | ⏳ Pending | `tasks.md` | Created by `/sp.tasks` command |

---

## Architectural Decisions for ADR Consideration

The following significant decisions were made during planning and should be considered for Architecture Decision Records:

### 1. Repository Pattern for Ownership Enforcement

**Decision**: Use repository pattern with explicit user_id parameters rather than session-level query filters or context variables.

**Significance**:
- Long-term consequences for data access patterns
- Multiple alternatives considered (session filters, context vars, direct ORM)
- Cross-cutting: affects all data access in the system

**Recommendation**:
📋 **Architectural decision detected**: Repository pattern for user data isolation
   Document reasoning and tradeoffs? Run `/sp.adr repository-pattern-ownership-enforcement`

### 2. Error Handling Strategy (404 vs 403 for Ownership)

**Decision**: Return 404 for all ownership failures rather than 403 Forbidden.

**Significance**:
- Security implications (prevents task ID enumeration)
- Affects API contract and client error handling
- Influences system design principles

**Recommendation**:
📋 **Architectural decision detected**: 404 for ownership failures to prevent enumeration
   Document reasoning and tradeoffs? Run `/sp.adr ownership-verification-404-pattern`

### 3. Neon Serverless PostgreSQL with Connection Pooling

**Decision**: Use Neon Serverless PostgreSQL with small connection pool (pool_size=5, max_overflow=10).

**Significance**:
- Infrastructure and deployment implications
- Performance characteristics (cold starts)
- Cost and scalability considerations

**Recommendation**:
📋 **Architectural decision detected**: Neon Serverless PostgreSQL for data persistence
   Document reasoning and tradeoffs? Run `/sp.adr neon-serverless-postgresql-choice`

**User Action Required**: Review these architectural decisions and determine if ADRs should be created. These decisions were made during planning and are significant enough to warrant documentation.
