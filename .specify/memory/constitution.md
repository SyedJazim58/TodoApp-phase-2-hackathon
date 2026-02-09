<!--
Sync Impact Report:
Version: 1.0.0 → 1.1.0
Change Type: MINOR - Added Git workflow automation principle
Modified Principles: N/A
Added Sections:
  - Core Principles: Added Principle VIII (Automated Git Workflow with Verification)
  - Development Workflow: Added Git Workflow Automation section
Modified Sections:
  - Code Review Standards: Updated to reference 8 principles (was 7)
Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - Requirements alignment with security-first principle
  ✅ tasks-template.md - Task structure supports independent testing principle
  ⚠ CLAUDE.md - Update reference to "seven core principles" to "eight core principles"
Follow-up TODOs: None
-->

# Task Management System Constitution

## Core Principles

### I. Security-First Design (Zero Trust Architecture)

The system MUST implement zero trust principles between frontend and backend. No component may assume trust without explicit verification. All authentication MUST be stateless using JWT tokens. Backend MUST verify every token signature using the shared BETTER_AUTH_SECRET before processing any request. Frontend and backend MUST be independently verifiable security boundaries.

**Rationale**: Multi-user applications require absolute certainty that user A cannot access user B's data under any circumstance. Zero trust architecture eliminates implicit trust vulnerabilities.

### II. User Data Isolation (Mandatory)

Every user MUST only access their own data - no exceptions. The authenticated user ID from the verified JWT token is the single source of truth for user identity. URL parameters, client input, or any other client-provided user identifiers MUST be validated against the authenticated user ID from the token. All database queries MUST be filtered by authenticated user ID. Cross-user data access is a critical security violation.

**Rationale**: User data isolation is non-negotiable in multi-user systems. Even a single violation destroys user trust and may violate data protection regulations.

### III. Spec-Driven Development (Implementation Contract)

All implementations MUST be derived from explicit specifications. No feature may be implemented without a corresponding spec definition. Specifications define the "what" and "why" while leaving implementation details to the plan. Changes to behavior require spec updates first. Code that violates the spec or constitution MUST be rejected during code review.

**Rationale**: Spec-driven development ensures consistency, traceability, and prevents scope creep. It creates a verifiable contract between requirements and implementation.

### IV. Stateless Authentication (JWT-Based)

Authentication MUST be stateless using JWT tokens with no backend session storage. Better Auth issues JWT tokens upon successful login with configurable expiry (default 7 days). Tokens MUST contain user identity claims (user_id, email) that are cryptographically signed. Backend MUST extract, verify signature, validate expiry, and decode user identity from every request. Token refresh mechanisms MUST follow the same verification standards.

**Rationale**: Stateless authentication scales horizontally, eliminates session management complexity, and provides clear security boundaries. Each request is independently verifiable.

### V. Clear Separation of Concerns

Frontend and backend MUST maintain distinct responsibilities. Frontend handles presentation, user interaction, and Better Auth integration. Backend handles business logic, data persistence, and authorization enforcement. Authentication configuration happens on the frontend; authorization verification happens on the backend. Neither layer may bypass the other or share implementation details beyond documented API contracts.

**Rationale**: Separation of concerns enables independent testing, deployment, and security verification. It prevents architectural erosion and maintains clear boundaries.

### VI. Predictable RESTful API Behavior

All API endpoints MUST follow RESTful conventions with predictable behavior. URL structure remains stable; security is enforced via JWT verification, not URL changes. HTTP status codes MUST be used correctly: 401 for authentication failures (missing/invalid token), 403 for authorization failures (valid token but insufficient permissions), 404 for resource not found for that user. Error responses MUST be consistent, documented, and MUST NOT leak sensitive information.

**Rationale**: Predictable APIs reduce integration errors, enable client-side caching, and provide clear debugging signals. Consistent error handling prevents information leakage.

### VII. Smallest Viable Change

Implement only what is specified - no speculative features, no "improvements" beyond requirements, no premature abstractions. Each change MUST be independently testable and reversible. Code reviews MUST verify that changes are minimal, focused, and traceable to spec requirements. Complexity requires explicit justification against simpler alternatives.

**Rationale**: Smallest viable change reduces risk, enables faster iteration, and prevents over-engineering. Every line of code is a liability that must justify its existence.

### VIII. Automated Git Workflow with Verification

After successful implementation with zero runtime errors, changes MUST be committed to GitHub using `/sp.git.commit_pr` through MCP GitHub tools. Repository MUST be created if it does not exist. Commits MUST only occur after the project runs without errors. Pull requests MUST be created and merged following the established review process. All Git operations MUST use MCP tools for GitHub integration to ensure consistency and traceability.

**Rationale**: Automated Git workflows enforce discipline, ensure all code is tested before commit, maintain clean history, and create audit trails through PRs. Zero-error verification prevents broken commits from entering the codebase. MCP tools provide consistent GitHub integration and enable traceable operations.

## Technology Constraints

**Frontend Stack**:
- Next.js 16+ with App Router (mandatory)
- Better Auth for authentication with JWT token issuance enabled
- TypeScript for type safety
- Environment variable: BETTER_AUTH_SECRET (shared with backend)

**Backend Stack**:
- Python FastAPI (mandatory)
- SQLModel for ORM (mandatory)
- Neon Serverless PostgreSQL (mandatory)
- JWT verification library (PyJWT or equivalent)
- Environment variable: BETTER_AUTH_SECRET (shared with frontend)

**Development Tooling**:
- Claude Code for AI-assisted development
- Spec-Kit Plus for spec-driven workflows
- Git for version control
- GitHub for collaboration (MCP tools integration assumed)

**API Contract**:
- RESTful endpoints: GET/POST/PUT/DELETE/PATCH verbs
- URL pattern: `/api/{user_id}/tasks[/{id}]`
- Request header: `Authorization: Bearer <jwt_token>`
- Response formats: JSON with consistent error schemas

**Security Requirements**:
- All API endpoints require valid JWT token (no exceptions)
- Token expiry MUST be enforced (default: 7 days, configurable)
- Secrets MUST be stored in environment variables, never in code
- HTTPS required in production (TLS 1.2+)

## Development Workflow

### Spec-Driven Workflow (Mandatory Sequence)

1. **Write Specification** (`/sp.specify`): Define user scenarios, requirements, success criteria
2. **Generate Plan** (`/sp.plan`): Create architecture decisions, technical design, structure
3. **Break Into Tasks** (`/sp.tasks`): Generate dependency-ordered, testable task list
4. **Implement via Claude Code** (`/sp.implement`): Execute tasks with strict spec adherence

**Gate**: No implementation without spec → plan → tasks sequence completed.

### Authentication & Authorization Verification Checklist

Every API endpoint implementation MUST verify:
- [ ] JWT token extracted from Authorization header
- [ ] Token signature verified using BETTER_AUTH_SECRET
- [ ] Token expiry validated (not expired)
- [ ] User identity decoded from token (user_id, email)
- [ ] URL user_id matches authenticated user_id from token
- [ ] Database query filtered by authenticated user_id
- [ ] Error responses return correct HTTP status (401/403/404)
- [ ] No sensitive information leaked in error messages

### Code Review Standards

All code MUST pass:
- **Constitution compliance**: Adheres to all eight core principles
- **Spec traceability**: Directly implements specified requirements
- **Security verification**: Authentication and authorization correctly implemented
- **Smallest change**: No unnecessary code or premature optimization
- **Testing coverage**: Critical paths have corresponding tests (if tests required by spec)
- **Error handling**: Consistent error responses, proper status codes
- **Runtime verification**: Project runs without errors before commit

### Prompt History Records (PHR)

After every significant user interaction, create a PHR under `history/prompts/`:
- Constitution changes → `history/prompts/constitution/`
- Feature-specific work → `history/prompts/<feature-name>/`
- General work → `history/prompts/general/`

PHR MUST capture: full user prompt (verbatim), assistant response (concise), stage, files modified, tests run, outcome, and reflection.

### Architecture Decision Records (ADR)

When architecturally significant decisions are detected (typically during `/sp.plan` or `/sp.tasks`), suggest:
"📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"

Wait for user consent; never auto-create ADRs. ADR significance test: Does the decision have long-term consequences, involve multiple alternatives, and affect system design?

### Git Workflow Automation

After completing implementation tasks:
1. **Verify Runtime**: Run the project and confirm zero errors
2. **Commit Workflow**: Execute `/sp.git.commit_pr` to:
   - Create repository on GitHub if it doesn't exist (via MCP tools)
   - Commit all changes with meaningful commit message
   - Create pull request with comprehensive description
   - Merge PR after review approval (automated or manual based on project settings)
3. **MCP Tools Integration**: All GitHub operations MUST use MCP GitHub tools for consistency
4. **Commit Gate**: NEVER commit code with runtime errors or failing tests

**Pre-Commit Verification Checklist**:
- [ ] Project runs without errors
- [ ] All tests pass (if tests exist)
- [ ] Code adheres to constitution principles
- [ ] Changes are minimal and traceable to spec
- [ ] No secrets or sensitive data in code

## Governance

This constitution supersedes all other practices, preferences, and defaults. When conflicts arise, constitution principles take precedence.

**Amendment Process**:
1. Proposed changes MUST document rationale and impact
2. Version MUST increment per semantic versioning:
   - MAJOR: Breaking changes to principles or governance
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording improvements, typo fixes
3. Dependent templates MUST be updated to maintain consistency
4. All amendments MUST include ratification date update

**Compliance Enforcement**:
- All pull requests MUST verify constitution compliance
- Code reviews MUST reject violations with specific principle citations
- Security violations (principles I, II, IV) are blocking and require immediate remediation
- Complexity MUST be explicitly justified against simpler alternatives

**Human as Tool Strategy**:
When encountering ambiguity, unforeseen dependencies, architectural uncertainty, or completion checkpoints, invoke the user for clarification and decision-making. The user is a specialized tool for judgment calls that require human input.

**Runtime Development Guidance**:
See `CLAUDE.md` for agent-specific instructions, workflow details, and operational guidelines. The constitution defines "what" and "why"; `CLAUDE.md` defines "how" for execution.

**Version**: 1.1.0 | **Ratified**: 2026-02-07 | **Last Amended**: 2026-02-08
