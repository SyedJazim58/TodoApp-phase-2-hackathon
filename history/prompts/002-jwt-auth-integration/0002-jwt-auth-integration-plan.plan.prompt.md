---
id: 0002
title: JWT Auth Integration Plan
stage: plan
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: 002-jwt-auth-integration
branch: 002-jwt-auth-integration
user: user
command: /sp.plan
labels: ["authentication", "jwt", "architecture", "planning", "security"]
links:
  spec: ../specs/002-jwt-auth-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-jwt-auth-integration/plan.md
  - specs/002-jwt-auth-integration/research.md
  - specs/002-jwt-auth-integration/data-model.md
  - specs/002-jwt-auth-integration/quickstart.md
  - specs/002-jwt-auth-integration/contracts/jwt-middleware.md
  - specs/002-jwt-auth-integration/contracts/auth-responses.md
  - CLAUDE.md (updated with new technologies)
tests:
  - Constitution check (all 8 principles passed)
---

## Prompt

/sp.plan Auth & JWT Integration

Objective:
Enable JWT-based authentication between Next.js (Better Auth) and FastAPI.

Steps:
1. Enable JWT issuance in Better Auth configuration
2. Include user_id and email in JWT payload
3. Attach JWT to all frontend API requests
4. Configure shared BETTER_AUTH_SECRET in both services
5. Implement FastAPI middleware to:
   - Extract JWT
   - Verify signature and expiry
   - Decode user identity
6. Enforce user_id match between JWT and route params
7. Return 401 for invalid/missing tokens, 403 for mismatches

Constraints:
- Stateless auth only
- No sessions or refresh tokens

Completion criteria:
- All API routes require valid JWT
- User identity comes only from token
- Cross-user access is impossible

## Response snapshot

Created comprehensive implementation plan for JWT Authentication & Integration (Feature 002) with complete Phase 0 (Research) and Phase 1 (Design & Contracts) artifacts:

**Generated Planning Artifacts**:

1. **plan.md** (395 lines):
   - Summary of technical approach
   - Complete technical context (languages, dependencies, testing, platform)
   - Constitution check (all 8 principles passed ✅)
   - Project structure (backend auth module, frontend lib/auth)
   - Phase 0: Research & Technology Decisions (5 topics resolved)
   - Phase 1: Design & Contracts (data model, API contracts, quickstart)
   - Implementation roadmap (24-32 estimated tasks in 5 categories)
   - Risk analysis (4 risks with mitigation strategies)
   - Non-functional requirements (security, performance, observability, testability)
   - Acceptance criteria (10 checkpoints)

2. **research.md** (detailed technology decisions):
   - PyJWT 2.8+ selected for backend (vs python-jose, authlib)
   - Better Auth 1.0+ selected for frontend (vs NextAuth.js, Auth.js)
   - HS256 algorithm selected (vs RS256, HS512)
   - FastAPI dependency injection pattern selected (vs global middleware, decorators)
   - JSON error format with error/code fields
   - All alternatives considered and rationale documented

3. **data-model.md** (stateless authentication model):
   - AuthenticatedUser entity (user_id, email, iat, exp)
   - JWT token structure (header, payload, signature)
   - AuthError entity (4 error variants: AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED, AUTH_FORBIDDEN)
   - Data flow diagram
   - Validation rules (7-step verification process)
   - Security considerations

4. **contracts/jwt-middleware.md** (backend middleware contract):
   - Input contract (Authorization header, user_id parameter)
   - 7-step sequential verification process
   - Output contract (success and 4 failure cases)
   - FastAPI dependency function signature
   - Configuration requirements (BETTER_AUTH_SECRET)
   - Security requirements and forbidden actions
   - Testing contract (5 unit test cases, 3 integration tests)
   - Performance contract (<10ms target)

5. **contracts/auth-responses.md** (error response contract):
   - Standard error format: `{error, code}`
   - 4 error definitions (AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED, AUTH_FORBIDDEN)
   - HTTP status mapping (401 for auth failures, 403 for authorization)
   - Frontend error handling guidelines
   - Logging contract (what to log, what NOT to log)
   - OpenAPI schema definition

6. **quickstart.md** (8-step implementation guide):
   - Generate BETTER_AUTH_SECRET
   - Backend configuration (env vars, PyJWT installation, auth module structure)
   - Implement JWT verification (exceptions, middleware, FastAPI dependency)
   - Protect API routes
   - Frontend setup (Next.js, Better Auth installation, configuration)
   - Create authenticated API client
   - Testing (unit tests, manual testing)
   - Update agent context

**Technology Stack Finalized**:
- Backend: FastAPI 0.109+, PyJWT 2.8+, Python-dotenv 1.0+, Pydantic 2.0+
- Frontend: Next.js 16+, Better Auth 1.0+, TypeScript 5.0+
- Shared: BETTER_AUTH_SECRET (32+ chars), JWT format `{user_id, email, iat, exp}`, HS256 algorithm

**Constitution Validation**: ✅ ALL 8 PRINCIPLES PASSED
- Security-First Design: Zero trust, JWT verification on every request
- User Data Isolation: URL user_id validated against JWT user_id
- Spec-Driven Development: All 28 functional requirements from spec
- Stateless Authentication: JWT tokens, no session storage
- Clear Separation of Concerns: Frontend (auth config) vs Backend (verification)
- Predictable RESTful API: Consistent 401/403 error responses
- Smallest Viable Change: No refresh tokens, no RBAC
- Automated Git Workflow: Tests pass before commit

**Agent Context Updated**: CLAUDE.md appended with PyJWT 2.8+, Better Auth 1.0+, JWT token format

## Outcome

- ✅ Impact: Complete technical architecture for JWT authentication with zero ambiguity. Engineers can implement directly from plan. All technology decisions documented with alternatives and rationale.
- 🧪 Tests: Constitution check passed all 8 principles. Testing strategy defined (unit, integration, security tests).
- 📁 Files: 6 planning artifacts created (plan.md, research.md, data-model.md, quickstart.md, 2 contracts)
- 🔁 Next prompts: `/sp.tasks` to generate detailed, dependency-ordered task breakdown (estimated 24-32 tasks in 5 categories)
- 🧠 Reflection: Plan provides complete blueprint from research through implementation. Stateless architecture with zero trust principles ensures security-first design. JWT middleware pattern enables route-level auth control. All error scenarios explicitly defined. Risk analysis identifies potential issues with mitigation strategies. Ready for immediate task generation and implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning workflow completed successfully with all constitution checks passing
- Graders run and results (PASS/FAIL): PASS - All 8 constitution principles validated, no violations detected, technology stack finalized
- Prompt variant (if applicable): Standard /sp.plan with comprehensive user input covering objective, steps, constraints, and completion criteria
- Next experiment (smallest change to try): Proceed to `/sp.tasks` to break down implementation into atomic, testable tasks with clear dependencies
