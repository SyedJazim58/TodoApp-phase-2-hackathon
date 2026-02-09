---
id: 001
title: Initial Constitution Ratification
stage: constitution
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: system
command: /sp.constitution
labels: ["constitution", "security", "authentication", "spec-driven", "jwt", "multi-user"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - N/A (constitution document)
---

## Prompt

```text
/sp.constitution

Project: Spec-driven, authenticated task management system using Next.js, FastAPI, and Better Auth (JWT-based)

Purpose:
Build a secure, multi-user task management application where authentication is handled on the Next.js frontend using Better Auth, and authorization is enforced on a FastAPI backend using JWT verification. All development must strictly follow spec-driven principles.

Core principles:
- Security-first design (zero trust between frontend and backend)
- User isolation (no cross-user data access under any circumstance)
- Spec-driven development (implementation must strictly follow defined specs)
- Stateless authentication (JWT-based, no backend session storage)
- Clear separation of concerns between frontend and backend
- Predictable, RESTful API behavior

Key standards:
- All API endpoints MUST require a valid JWT token
- JWT tokens MUST be verified on the backend using a shared secret
- User identity MUST be derived only from the verified JWT, never from client input
- URL user_id MUST match the authenticated user ID from the token
- All database queries MUST be filtered by authenticated user ID
- Unauthorized access MUST return HTTP 401
- Forbidden cross-user access MUST return HTTP 403
- All success and error responses MUST be consistent and documented

Technology constraints:
- Frontend: Next.js 16+ (App Router)
- Backend: Python FastAPI
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth (JWT enabled)
- Spec tooling: Claude Code + Spec-Kit Plus
- Environment secret: BETTER_AUTH_SECRET (shared across frontend and backend)

Authentication & authorization rules:
- Better Auth MUST be configured to issue JWT tokens on successful login
- Frontend MUST attach JWT token to every API request using:
  Authorization: Bearer <token>
- Backend MUST:
  - Extract JWT from Authorization header
  - Verify signature using BETTER_AUTH_SECRET
  - Validate token expiry
  - Decode user identity (user_id, email)
- Backend MUST reject:
  - Missing tokens
  - Invalid tokens
  - Expired tokens
- Backend MUST NEVER trust user_id provided by the client without token validation

API behavior standards:
- Endpoints:
  - GET    /api/{user_id}/tasks
  - POST   /api/{user_id}/tasks
  - GET    /api/{user_id}/tasks/{id}
  - PUT    /api/{user_id}/tasks/{id}
  - DELETE /api/{user_id}/tasks/{id}
  - PATCH  /api/{user_id}/tasks/{id}/complete
- Task ownership MUST be enforced on every operation
- Users can only list, create, read, update, delete, or complete their own tasks
- API routes MUST remain stable; security is enforced via JWT, not URL changes

Database & data integrity rules:
- Every task record MUST be associated with a single user_id
- Backend MUST ensure:
  - No task can be created without an authenticated user
  - No task can be accessed without ownership validation
- Soft assumptions or implicit ownership checks are forbidden

Error handling standards:
- 401 Unauthorized → missing or invalid JWT
- 403 Forbidden → valid JWT but user_id mismatch or ownership violation
- 404 Not Found → resource does not exist for that user
- Error responses MUST NOT leak sensitive information

Spec-driven enforcement:
- All implementations MUST be derived from the spec
- No feature may be implemented without a corresponding spec definition
- Claude Code MUST:
  - Assume access to MCP GitHub tools where applicable
  - Validate implementations against this constitution
  - Reject code that violates authentication, authorization, or isolation rules

Security guarantees:
- Stateless authentication only (no backend session storage)
- Token expiry MUST be enforced (e.g., 7 days)
- Frontend and backend MUST be independently verifiable
- Backend MUST NOT call frontend services for authentication

Success criteria:
- Every API request requires a valid JWT
- Users can only see and modify their own tasks
- Cross-user access is technically impossible
- All specs are followed without deviation
- System passes security review and spec compliance checks
```

## Response snapshot

Created initial constitution document version 1.0.0 establishing seven core principles for secure, spec-driven multi-user task management system.

**Core Principles Established**:
1. Security-First Design (Zero Trust Architecture)
2. User Data Isolation (Mandatory)
3. Spec-Driven Development (Implementation Contract)
4. Stateless Authentication (JWT-Based)
5. Clear Separation of Concerns
6. Predictable RESTful API Behavior
7. Smallest Viable Change

**Key Sections**:
- Technology Constraints: Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL, Better Auth
- Development Workflow: Spec → Plan → Tasks → Implement sequence with gates
- Authentication & Authorization Verification Checklist: 8-point verification for every endpoint
- Code Review Standards: Constitution compliance, spec traceability, security verification
- Governance: Amendment process, compliance enforcement, human-as-tool strategy

**Version Decision**: 1.0.0 (MAJOR)
- Rationale: Initial constitution ratification with complete principle set
- Ratification Date: 2026-02-07
- All placeholder tokens resolved; no TODOs remaining

**Template Alignment**:
- ✅ plan-template.md: Constitution Check section aligns with principles
- ✅ spec-template.md: Requirements structure supports security-first approach
- ✅ tasks-template.md: Task organization supports independent testing principle

## Outcome

- ✅ Impact: Established foundational governance document with seven security-focused principles
- 🧪 Tests: N/A (governance document)
- 📁 Files: Created `.specify/memory/constitution.md` (version 1.0.0)
- 🔁 Next prompts: `/sp.specify` to define first feature spec following constitution principles
- 🧠 Reflection: Constitution provides clear security guardrails and spec-driven workflow mandate. JWT-based zero trust architecture is well-defined with explicit verification requirements. Ready for feature specification phase.

## Evaluation notes (flywheel)

- Failure modes observed: None (initial creation)
- Graders run and results (PASS/FAIL): N/A (no automated graders for constitution)
- Prompt variant (if applicable): Standard constitution creation
- Next experiment (smallest change to try): Apply constitution principles during first `/sp.specify` execution to validate principle effectiveness
