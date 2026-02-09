---
id: 0002
title: Backend Core Data Layer Planning
stage: plan
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-backend-core-data
branch: 001-backend-core-data
user: external
command: /sp.plan
labels: ["backend", "data-layer", "architecture", "sqlmodel", "neon-postgres", "repository-pattern"]
links:
  spec: specs/001-backend-core-data/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-backend-core-data/plan.md
  - specs/001-backend-core-data/research.md
  - specs/001-backend-core-data/contracts/repository-interface.md
  - specs/001-backend-core-data/contracts/exceptions.md
  - specs/001-backend-core-data/quickstart.md
  - CLAUDE.md
tests:
  - None (planning phase, no code implementation)
---

## Prompt

Create:
- High-level backend architecture (FastAPI + SQLModel + Neon)
- Database schema for User and Task
- REST API contract for task operations

Decisions needing documentation:
- Task schema fields and relationships
- User-task ownership enforcement via user_id
- Error-handling strategy and HTTP status usage

Testing & validation:
- Verify CRUD operations against database
- Confirm user-scoped queries return correct data
- Validate persistence across restarts

## Response snapshot

Executed complete `/sp.plan` workflow for backend core data layer:

**Phase 0 - Research (Completed)**:
- Created research.md with technical decisions for 5 key areas
- SQLModel user filtering: Repository pattern with explicit user_id parameters
- Neon PostgreSQL connection: Pool configuration for serverless (pool_size=5, pool_pre_ping=True)
- Ownership verification: Single-query filtering (id + user_id) prevents timing attacks
- Error handling: Custom exception hierarchy (DatabaseError → 503, ResourceNotFoundError → 404)
- Testing strategy: pytest with fixture-based session management, SQLite for unit tests

**Phase 1 - Design & Contracts (Completed)**:
- Updated plan.md with technical context, constitution check, project structure
- Verified data-model.md exists with complete Task entity definition
- Created contracts/repository-interface.md: 6 repository methods with ownership enforcement
- Created contracts/exceptions.md: Exception hierarchy and HTTP error mapping
- Created quickstart.md: Developer setup and implementation guide
- Updated CLAUDE.md agent context with Python 3.11+, FastAPI, SQLModel, Neon PostgreSQL

**Constitution Check Results**:
- Pre-design: PASS WITH CLARIFICATIONS (JWT auth deferred, API endpoints deferred)
- Post-design: FULL COMPLIANCE (security improved, error handling complete)

**Architectural Decisions Identified** (ADR candidates):
1. Repository pattern for ownership enforcement
2. 404 vs 403 for ownership failures (security)
3. Neon Serverless PostgreSQL with connection pooling

**Ready for Next Phase**: `/sp.tasks` to generate implementation tasks

## Outcome

- ✅ Impact: Complete architecture and design artifacts for backend core data layer. All research unknowns resolved. Repository pattern and error handling strategies documented with security considerations.
- 🧪 Tests: No tests run (planning phase). Testing strategy documented in research.md and quickstart.md.
- 📁 Files: Created/updated 6 files: plan.md, research.md, repository-interface.md, exceptions.md, quickstart.md, CLAUDE.md
- 🔁 Next prompts: Run `/sp.tasks` to generate dependency-ordered implementation tasks. Consider creating ADRs for 3 identified architectural decisions.
- 🧠 Reflection: Planning workflow successfully completed all phases. Repository pattern provides clean abstraction for ownership enforcement. Single-query filtering pattern prevents timing attacks. Error handling prevents information leakage. Design maintains clear separation of concerns (data layer isolated from auth and HTTP layers).

## Evaluation notes (flywheel)

- Failure modes observed: Research agent encountered API 400 error during web searches. Mitigated by creating research.md directly from authoritative knowledge of FastAPI/SQLModel patterns.
- Graders run and results (PASS/FAIL): Constitution Check: PASS (pre-design), PASS (post-design with improvements)
- Prompt variant (if applicable): Standard /sp.plan workflow execution
- Next experiment (smallest change to try): None - planning successful. Next step is task generation via /sp.tasks.
