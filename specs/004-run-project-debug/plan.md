# Implementation Plan: Run Whole Project & Debug

**Branch**: `004-run-project-debug` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-run-project-debug/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature focuses on validating and debugging the complete full-stack Todo App system rather than building new features. The objective is to ensure all previously implemented components (Next.js frontend, FastAPI backend, Better Auth JWT authentication, Neon PostgreSQL database) work correctly together in an end-to-end flow. The plan includes environment configuration validation, service startup procedures, authentication flow testing, multi-user data isolation verification, and comprehensive debugging guidelines with clear error messages at all service boundaries.

## Technical Context

**Language/Version**:
- Frontend: TypeScript with Node.js 18+ (Next.js 16+ App Router)
- Backend: Python 3.11+ (FastAPI 0.109+)

**Primary Dependencies**:
- Frontend: Next.js 16+, Better Auth (JWT mode), React 18+, Tailwind CSS
- Backend: FastAPI 0.109+, SQLModel 0.0.14+, PyJWT (JWT verification), Psycopg2-binary, Python-dotenv
- Database: Neon Serverless PostgreSQL (cloud-hosted)

**Storage**: Neon PostgreSQL with SQLModel ORM (already provisioned via feature 001)

**Testing**: Manual validation checklist (this feature focuses on runtime validation, not automated test suites)

**Target Platform**:
- Frontend: Modern browsers (Chrome, Firefox, Safari) on localhost:3000
- Backend: Local development server on localhost:8000
- Database: Neon cloud (remote connection)

**Project Type**: Web application (frontend + backend)

**Performance Goals**:
- Service startup: <30 seconds total
- Authentication flow: <10 seconds (signup + signin + API call)
- Health check endpoints: <200ms response
- API endpoints: <500ms p95 latency

**Constraints**:
- Must run on developer machines without Docker/Kubernetes
- All services use environment variables (no hardcoded secrets)
- Database connection must be secured (no exposed credentials in errors)
- Error messages must be informative for debugging without leaking sensitive data
- No security bypasses or authentication shortcuts

**Scale/Scope**:
- 3 services to coordinate (frontend, backend, database)
- 6 validation user stories (20 functional requirements)
- 12 success criteria covering startup, auth, CRUD, and error handling
- Manual testing workflow (not automated integration tests)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Security-First Design ✅
- JWT tokens verified on every backend request with BETTER_AUTH_SECRET
- No trust assumed between frontend and backend
- All validation includes token signature, expiry, and user identity verification
- **Status**: COMPLIANT - Validation plan includes comprehensive JWT verification testing

### Principle II: User Data Isolation ✅
- Testing includes explicit cross-user access attempts (User A vs User B scenarios)
- Backend validates URL user_id matches JWT token user_id
- Database queries filtered by authenticated user
- **Status**: COMPLIANT - Multi-user data isolation is Priority 1 validation story

### Principle III: Spec-Driven Development ✅
- This feature has complete specification (spec.md) with 6 user stories
- All validation requirements trace back to spec functional requirements
- No implementation without specification
- **Status**: COMPLIANT - Spec complete, plan follows spec requirements

### Principle IV: Stateless Authentication ✅
- Validation confirms JWT tokens contain user identity and are cryptographically signed
- Backend extracts and verifies token on every request
- No session storage, all authentication stateless
- **Status**: COMPLIANT - Authentication validation is Priority 1

### Principle V: Clear Separation of Concerns ✅
- Frontend handles Better Auth integration and presentation
- Backend handles JWT verification and authorization enforcement
- Validation tests both layers independently and together
- **Status**: COMPLIANT - Validation covers both frontend and backend boundaries

### Principle VI: Predictable RESTful API Behavior ✅
- Validation includes testing correct HTTP status codes (401, 403, 404)
- Error responses tested for consistency
- URL patterns remain stable (/api/{user_id}/tasks)
- **Status**: COMPLIANT - Error handling validation is Priority 2

### Principle VII: Smallest Viable Change ✅
- This feature does not add new functionality, only validates existing features
- Deliverables limited to documentation, checklists, and validation scripts
- No speculative features or unnecessary abstractions
- **Status**: COMPLIANT - Minimal scope focused on validation

### Principle VIII: Automated Git Workflow ✅
- Validation work will be committed after zero-error verification
- GitHub MCP tools will be used for commits and PR creation
- **Status**: COMPLIANT - Git workflow will follow after validation completes

**Overall Gate Status**: ✅ PASSED - All principles satisfied, proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/004-run-project-debug/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - validation tools and techniques
├── data-model.md        # Not applicable (no new data models)
├── quickstart.md        # Phase 1 output - startup and validation guide
├── contracts/           # Not applicable (no new API contracts)
│   └── validation-checklist.md  # Comprehensive validation checklist
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Web application structure (already exists from features 001-003)
backend/
├── app/
│   ├── main.py           # FastAPI app with health endpoint
│   ├── auth.py           # JWT verification middleware
│   ├── models/           # SQLModel models
│   ├── api/              # API route handlers
│   │   └── tasks.py      # Task CRUD endpoints
│   └── database.py       # Neon PostgreSQL connection
├── tests/                # Backend tests (if any)
├── .env.example          # Backend environment template
├── requirements.txt      # Python dependencies
└── README.md             # Backend setup instructions

frontend/
├── app/
│   ├── page.tsx          # Home page
│   ├── auth/             # Authentication pages
│   │   ├── signin/       # Sign in page
│   │   └── signup/       # Sign up page
│   ├── dashboard/        # Protected dashboard
│   └── api/              # Better Auth API routes
├── lib/
│   ├── auth.ts           # Better Auth configuration
│   └── api-client.ts     # API client with JWT header injection
├── components/           # Reusable UI components
├── .env.local.example    # Frontend environment template
├── package.json          # Node.js dependencies
└── README.md             # Frontend setup instructions

# New validation artifacts (to be created)
docs/
├── startup-guide.md      # How to start all services
├── debugging-guide.md    # Common issues and resolutions
├── env-validation.sh     # Environment variable checker script
└── health-check.sh       # Service health verification script

scripts/
├── validate-config.py    # Python script to validate environment variables
└── run-all-services.sh   # Combined startup script (optional convenience)
```

**Structure Decision**: Using existing web application structure (frontend + backend). This feature adds validation documentation and scripts to the `docs/` and `scripts/` directories without modifying existing source code structure. The focus is on validating what exists rather than building new components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied by the validation approach.

---

## Phase 0: Research & Unknowns Resolution

### Research Tasks

#### R1: Existing Service Architecture Audit
**Objective**: Understand the current state of all three implemented features to identify integration points and potential issues.

**Research Questions**:
1. What is the actual project structure for features 001-003?
2. Which files contain environment variable configuration?
3. Does the backend currently have JWT verification implemented?
4. Does the frontend currently send Authorization headers with JWT tokens?
5. Are there existing health check endpoints?
6. What is the current database schema (from feature 001)?

**Method**: Read existing source code in backend/, frontend/, and specs/ directories for features 001-003.

**Deliverable**: Document current architecture in research.md with file paths and implementation status.

---

#### R2: Environment Variable Inventory
**Objective**: Create complete list of all required environment variables across frontend and backend.

**Research Questions**:
1. What environment variables does the backend require? (DATABASE_URL, BETTER_AUTH_SECRET, PORT, etc.)
2. What environment variables does the frontend require? (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET, etc.)
3. Are there .env.example files already present?
4. What is the correct format for Neon PostgreSQL connection strings?

**Method**: Read backend and frontend code to identify environment variable usage. Check for existing .env files.

**Deliverable**: Complete environment variable matrix in research.md with service, variable name, purpose, and example value.

---

#### R3: JWT Token Flow Analysis
**Objective**: Verify JWT token issuance, transmission, and verification flow between Better Auth, frontend, and backend.

**Research Questions**:
1. How does Better Auth issue JWT tokens on the frontend?
2. Where are JWT tokens stored on the frontend (localStorage, cookies, memory)?
3. How does the frontend API client attach JWT tokens to requests?
4. What library does the backend use for JWT verification (PyJWT, python-jose)?
5. Does the backend already have JWT verification middleware?

**Method**: Read Better Auth configuration in frontend and JWT verification code in backend.

**Deliverable**: JWT flow diagram in research.md showing token lifecycle from login to API call.

---

#### R4: Service Startup Procedures
**Objective**: Determine the correct commands and order to start each service.

**Research Questions**:
1. How to start the backend? (uvicorn command, script, etc.)
2. How to start the frontend? (npm run dev, next dev, etc.)
3. Is the database always available (cloud) or does it need starting?
4. Are there any dependencies between service startup order?
5. What are the default ports for each service?

**Method**: Read README files, package.json, and backend startup scripts.

**Deliverable**: Startup command sequence in research.md with prerequisites and expected outputs.

---

#### R5: Error Handling and Logging Standards
**Objective**: Identify current error handling patterns and establish logging standards for debugging.

**Research Questions**:
1. What error format does the backend currently return?
2. Are authentication errors (401) and authorization errors (403) properly distinguished?
3. What logging framework is used in the backend (Python logging, FastAPI logs)?
4. Does the frontend have consistent error handling for API calls?
5. Are there any existing debugging utilities or health check endpoints?

**Method**: Read API error handlers in backend and error handling code in frontend.

**Deliverable**: Error handling patterns and logging requirements in research.md.

---

#### R6: Multi-User Testing Strategy
**Objective**: Plan how to create and test with multiple user accounts for data isolation validation.

**Research Questions**:
1. Can multiple users be created through the signup flow?
2. How to test cross-user access attempts (need two JWT tokens)?
3. Are there any existing test utilities or seed data scripts?
4. How to verify database-level filtering (SQL query inspection)?

**Method**: Review authentication implementation and database query patterns.

**Deliverable**: Multi-user testing procedure in research.md with step-by-step instructions.

---

### Research Consolidation

**Output File**: `specs/004-run-project-debug/research.md`

**Structure**:
```markdown
# Research: Run Whole Project & Debug

## Current Architecture Summary
[R1 findings]

## Environment Variables
[R2 findings - complete matrix]

## JWT Token Flow
[R3 findings - flow diagram]

## Service Startup
[R4 findings - command sequence]

## Error Handling & Logging
[R5 findings - patterns and standards]

## Multi-User Testing
[R6 findings - testing procedure]

## Integration Points & Risks
[Synthesis of all research with identified integration issues]
```

---

## Phase 1: Design & Contracts

### Prerequisites
- `research.md` completed with all unknowns resolved
- Constitution Check re-verified (should remain PASSED)

### Design Artifacts

#### D1: Validation Checklist (contracts/validation-checklist.md)

**Purpose**: Comprehensive checklist covering all 6 user stories and 20 functional requirements.

**Structure**:
```markdown
# End-to-End Validation Checklist

## Pre-Validation Setup
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Neon PostgreSQL connection string available
- [ ] Frontend .env.local configured
- [ ] Backend .env configured
- [ ] BETTER_AUTH_SECRET identical in both services

## P1: Initial System Validation
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads in browser at localhost:3000
- [ ] Database connectivity verified

## P1: End-to-End Authentication Flow
- [ ] User can sign up with email/password
- [ ] JWT token received after signup
- [ ] User can sign in with correct credentials
- [ ] JWT token received after signin
- [ ] API call with valid JWT succeeds
- [ ] API call without JWT returns 401 "Missing token"
- [ ] API call with invalid JWT returns 401 "Invalid token"
- [ ] API call with expired JWT returns 401 "Expired token"

## P1: Multi-User Data Isolation
- [ ] Create User A account and JWT token
- [ ] Create User B account and JWT token
- [ ] User A creates task successfully
- [ ] User B cannot see User A's task
- [ ] User A attempting to access User B's task returns 403

## P2: Complete Task CRUD Flow
- [ ] Create task as authenticated user
- [ ] Read all tasks for authenticated user
- [ ] Update task content
- [ ] Mark task as complete
- [ ] Delete task
- [ ] Access deleted task returns 404

## P2: Integration Failure Diagnosis
- [ ] Backend with wrong DATABASE_URL shows clear error
- [ ] Frontend with wrong API URL shows clear error in console
- [ ] Mismatched BETTER_AUTH_SECRET logs "invalid signature"
- [ ] Database errors do not leak sensitive information

## P3: Environment Configuration
- [ ] Run config validation script
- [ ] All required variables present
- [ ] Secrets validated (hashes match if applicable)
```

---

#### D2: Startup and Configuration Guide (quickstart.md)

**Purpose**: Step-by-step guide for starting all services and validating configuration.

**Structure**:
```markdown
# Quick Start Guide: Run Whole Project

## Prerequisites
- Node.js 18+
- Python 3.11+
- npm and pip installed
- Neon PostgreSQL database provisioned

## 1. Environment Configuration

### Backend (.env)
Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname
BETTER_AUTH_SECRET=your-secret-key-here
PORT=8000
```

### Frontend (.env.local)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-here
```

**CRITICAL**: BETTER_AUTH_SECRET must be identical in both files.

## 2. Install Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 3. Start Services

### Terminal 1: Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
  ▲ Next.js 16.x.x
  - Local:        http://localhost:3000
```

## 4. Verify Services

### Backend Health Check
```bash
curl http://localhost:8000/health
```

Expected: `{"status": "healthy"}`

### Frontend Access
Open browser to http://localhost:3000

Expected: Home page loads

## 5. Test Authentication

1. Navigate to /auth/signup
2. Create account with email and password
3. Check browser DevTools → Network → signup request
4. Verify JWT token in response

## 6. Test Protected Endpoints

1. Sign in with created account
2. Open DevTools → Network tab
3. Perform task operation (create/read/update/delete)
4. Verify Authorization header: `Bearer <jwt_token>`
5. Verify backend accepts request and returns user's tasks

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Verify Neon PostgreSQL is accessible
- Check Python version: `python --version`

### Frontend won't start
- Check Node.js version: `node --version`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check NEXT_PUBLIC_API_URL points to backend

### JWT verification fails
- Verify BETTER_AUTH_SECRET matches in both .env files
- Check backend logs for "invalid signature" errors
- Ensure JWT token is being sent in Authorization header
```

---

#### D3: Debugging Guide (debugging-guide.md)

**Purpose**: Common failure scenarios, symptoms, root causes, and resolution steps.

**Structure**:
```markdown
# Cross-Service Debugging Guide

## Debugging Workflow

1. **Identify the failing layer**: Frontend, Backend, or Database?
2. **Check logs**: Each service outputs errors to console
3. **Verify configuration**: Run validation scripts
4. **Test in isolation**: Can each service start independently?
5. **Test integration**: Is the issue at service boundaries?

## Common Failure Scenarios

### Scenario 1: Backend Cannot Connect to Database

**Symptoms**:
- Backend fails to start
- Error: "could not connect to server" or "connection refused"

**Root Causes**:
- DATABASE_URL is incorrect or missing
- Neon database is not accessible (network issue)
- Database credentials are wrong

**Resolution**:
1. Check `.env` file has DATABASE_URL
2. Verify connection string format: `postgresql://user:pass@host/db`
3. Test database connectivity: `psql $DATABASE_URL`
4. Check Neon dashboard for database status

**Log Example**:
```
ERROR: could not connect to server: Connection refused
Is the server running on host "ep-xxx.neon.tech" (1.2.3.4) and accepting TCP/IP connections on port 5432?
```

---

### Scenario 2: JWT Token Verification Fails

**Symptoms**:
- API calls return 401 Unauthorized
- Backend logs: "JWT verification failed: invalid signature"

**Root Causes**:
- BETTER_AUTH_SECRET differs between frontend and backend
- JWT token is malformed or corrupted
- Token has expired

**Resolution**:
1. Compare BETTER_AUTH_SECRET in both .env files
2. Ensure no extra spaces or quotes in secret value
3. Re-sign in to get new JWT token
4. Check token expiry (decode JWT at jwt.io)

**Log Example**:
```
ERROR: JWT verification failed: invalid signature
Expected secret: abc123...
Received token claims: {user_id: 1, exp: 1234567890}
```

---

### Scenario 3: Cross-User Data Leakage

**Symptoms**:
- User A can see User B's tasks
- No 403 errors when accessing other users' data

**Root Causes**:
- Backend not validating URL user_id against JWT user_id
- Database queries not filtered by authenticated user
- Authorization logic missing or bypassed

**Resolution**:
1. Check backend route handlers for user_id validation
2. Verify JWT middleware extracts user_id correctly
3. Inspect database queries for WHERE user_id clause
4. Add explicit cross-user access tests

**Log Example**:
```
WARNING: User mismatch detected
JWT user_id: 1
URL user_id: 2
Action: REJECTED with 403 Forbidden
```

---

### Scenario 4: Frontend Cannot Reach Backend

**Symptoms**:
- API calls fail with network errors
- Browser console: "Failed to fetch" or CORS errors

**Root Causes**:
- Backend not running
- NEXT_PUBLIC_API_URL is incorrect
- CORS not configured on backend
- Firewall blocking port 8000

**Resolution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check NEXT_PUBLIC_API_URL in frontend .env.local
3. Verify backend CORS middleware allows frontend origin
4. Check browser DevTools Network tab for exact error

**Log Example**:
```
GET http://localhost:8000/api/1/tasks net::ERR_CONNECTION_REFUSED
```

---

### Scenario 5: Missing or Invalid Environment Variables

**Symptoms**:
- Services fail to start
- Error: "DATABASE_URL is required" or "BETTER_AUTH_SECRET not found"

**Root Causes**:
- .env files missing or misnamed
- Environment variables not loaded
- Typo in variable names

**Resolution**:
1. Verify .env files exist in correct locations
2. Check file names: backend/.env and frontend/.env.local
3. Run validation script: `python scripts/validate-config.py`
4. Restart services after fixing .env files

**Log Example**:
```
ERROR: Configuration error
Missing required environment variable: BETTER_AUTH_SECRET
Expected location: backend/.env
```

---

## Logging Best Practices

### Backend (FastAPI)
```python
import logging

logger = logging.getLogger(__name__)

# Log all API requests
logger.info(f"Request: {method} {path} from user {user_id}")

# Log auth failures with reason
logger.warning(f"Auth failed: {reason} for endpoint {path}")

# Log errors without leaking sensitive data
logger.error(f"Database error: {sanitized_message}")
```

### Frontend (Next.js)
```typescript
// Log network errors
console.error('API call failed:', error.message);

// Log auth state changes
console.log('User signed in:', user.email);

// Log token presence (not token value)
console.log('JWT token present:', !!token);
```

## Debugging Tools

### Check Backend Health
```bash
curl http://localhost:8000/health
```

### Inspect JWT Token
1. Copy token from browser DevTools → Application → Storage
2. Visit https://jwt.io
3. Paste token to decode claims
4. Verify user_id, email, expiry

### Test API Endpoint Manually
```bash
# Get JWT token from browser, then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/api/1/tasks
```

### Check Database Connection
```bash
# If psql installed:
psql $DATABASE_URL -c "SELECT version();"
```

### Validate Environment Variables
```bash
python scripts/validate-config.py
```
```

---

#### D4: Environment Validation Script (scripts/validate-config.py)

**Purpose**: Programmatically check all required environment variables are present and valid.

**Content**:
```python
#!/usr/bin/env python3
"""
Environment Configuration Validator
Checks all required environment variables for frontend and backend.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_file_exists(filepath: Path) -> bool:
    """Check if environment file exists."""
    return filepath.exists()

def load_env_vars(filepath: Path) -> Dict[str, str]:
    """Load environment variables from file."""
    env_vars = {}
    if not filepath.exists():
        return env_vars

    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def validate_backend_env() -> Tuple[List[str], List[str]]:
    """Validate backend environment variables."""
    required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'PORT']
    env_file = Path('backend/.env')

    errors = []
    warnings = []

    if not check_file_exists(env_file):
        errors.append(f"Backend .env file not found: {env_file}")
        return errors, warnings

    env_vars = load_env_vars(env_file)

    for var in required:
        if var not in env_vars or not env_vars[var]:
            errors.append(f"Backend: Missing required variable {var}")

    # Validate DATABASE_URL format
    if 'DATABASE_URL' in env_vars:
        db_url = env_vars['DATABASE_URL']
        if not db_url.startswith('postgresql://'):
            errors.append("Backend: DATABASE_URL must start with 'postgresql://'")

    # Validate BETTER_AUTH_SECRET length
    if 'BETTER_AUTH_SECRET' in env_vars:
        secret = env_vars['BETTER_AUTH_SECRET']
        if len(secret) < 32:
            warnings.append("Backend: BETTER_AUTH_SECRET should be at least 32 characters")

    return errors, warnings

def validate_frontend_env() -> Tuple[List[str], List[str]]:
    """Validate frontend environment variables."""
    required = ['NEXT_PUBLIC_API_URL', 'BETTER_AUTH_SECRET']
    env_file = Path('frontend/.env.local')

    errors = []
    warnings = []

    if not check_file_exists(env_file):
        errors.append(f"Frontend .env.local file not found: {env_file}")
        return errors, warnings

    env_vars = load_env_vars(env_file)

    for var in required:
        if var not in env_vars or not env_vars[var]:
            errors.append(f"Frontend: Missing required variable {var}")

    # Validate API URL format
    if 'NEXT_PUBLIC_API_URL' in env_vars:
        api_url = env_vars['NEXT_PUBLIC_API_URL']
        if not api_url.startswith('http://') and not api_url.startswith('https://'):
            errors.append("Frontend: NEXT_PUBLIC_API_URL must start with 'http://' or 'https://'")

    return errors, warnings

def validate_secret_match() -> Tuple[List[str], List[str]]:
    """Validate BETTER_AUTH_SECRET matches between services."""
    backend_env = load_env_vars(Path('backend/.env'))
    frontend_env = load_env_vars(Path('frontend/.env.local'))

    errors = []
    warnings = []

    backend_secret = backend_env.get('BETTER_AUTH_SECRET', '')
    frontend_secret = frontend_env.get('BETTER_AUTH_SECRET', '')

    if backend_secret and frontend_secret:
        if backend_secret != frontend_secret:
            errors.append("CRITICAL: BETTER_AUTH_SECRET mismatch between frontend and backend!")
            errors.append(f"  Backend length: {len(backend_secret)} chars")
            errors.append(f"  Frontend length: {len(frontend_secret)} chars")

    return errors, warnings

def main():
    """Run all validation checks."""
    print("="*60)
    print("Environment Configuration Validator")
    print("="*60)
    print()

    all_errors = []
    all_warnings = []

    # Check backend
    print("Checking backend environment...")
    backend_errors, backend_warnings = validate_backend_env()
    all_errors.extend(backend_errors)
    all_warnings.extend(backend_warnings)

    if not backend_errors:
        print(f"{GREEN}✓ Backend configuration valid{RESET}")

    print()

    # Check frontend
    print("Checking frontend environment...")
    frontend_errors, frontend_warnings = validate_frontend_env()
    all_errors.extend(frontend_errors)
    all_warnings.extend(frontend_warnings)

    if not frontend_errors:
        print(f"{GREEN}✓ Frontend configuration valid{RESET}")

    print()

    # Check secret match
    print("Checking BETTER_AUTH_SECRET consistency...")
    secret_errors, secret_warnings = validate_secret_match()
    all_errors.extend(secret_errors)
    all_warnings.extend(secret_warnings)

    if not secret_errors:
        print(f"{GREEN}✓ BETTER_AUTH_SECRET matches{RESET}")

    print()
    print("="*60)

    # Report errors
    if all_errors:
        print(f"{RED}ERRORS FOUND:{RESET}")
        for error in all_errors:
            print(f"  {RED}✗{RESET} {error}")
        print()

    # Report warnings
    if all_warnings:
        print(f"{YELLOW}WARNINGS:{RESET}")
        for warning in all_warnings:
            print(f"  {YELLOW}!{RESET} {warning}")
        print()

    # Final status
    if not all_errors and not all_warnings:
        print(f"{GREEN}✓ All checks passed! Configuration is ready.{RESET}")
        return 0
    elif all_errors:
        print(f"{RED}✗ Configuration has errors. Fix above issues before starting services.{RESET}")
        return 1
    else:
        print(f"{YELLOW}! Configuration has warnings. Services may run but verify carefully.{RESET}")
        return 0

if __name__ == '__main__':
    sys.exit(main())
```

---

#### D5: Health Check Script (scripts/health-check.sh)

**Purpose**: Verify all services are running and healthy.

**Content**:
```bash
#!/bin/bash
# Health Check Script
# Verifies all services are running and responding

set -e

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "Service Health Check"
echo "=================================================="
echo ""

# Check backend
echo "Checking backend (http://localhost:8000)..."
if curl -f -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "  Make sure backend is running: cd backend && uvicorn app.main:app --reload"
    exit 1
fi

echo ""

# Check frontend
echo "Checking frontend (http://localhost:3000)..."
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
    echo "  Make sure frontend is running: cd frontend && npm run dev"
    exit 1
fi

echo ""

# Check database (attempt connection through backend)
echo "Checking database connectivity..."
if curl -f -s http://localhost:8000/api/health/db > /dev/null; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${YELLOW}! Database health endpoint not found or failing${NC}"
    echo "  This may be normal if /api/health/db endpoint doesn't exist"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✓ All critical services are healthy${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Open browser to http://localhost:3000"
echo "2. Test authentication: /auth/signup then /auth/signin"
echo "3. Run validation checklist: see contracts/validation-checklist.md"
```

---

### Agent Context Update

**Script**: `.specify/scripts/bash/update-agent-context.sh claude`

**Action**: Update `CLAUDE.md` with new technologies from this plan:
- Add "Validation and Debugging Tools" to Active Technologies section
- Note: This feature adds validation artifacts, not new runtime technologies

**Content to Add**:
```markdown
- Validation tools: Python config validator, bash health check script (004-run-project-debug)
- Documentation: Startup guide, debugging guide, validation checklist (004-run-project-debug)
```

---

## Phase 2: Tasks Generation

**Note**: Tasks are generated by `/sp.tasks` command, NOT by `/sp.plan`.

After Phase 1 completes, run `/sp.tasks` to generate `tasks.md` with dependency-ordered, testable tasks.

Expected task categories:
1. **Setup Tasks**: Create validation scripts and documentation
2. **Configuration Tasks**: Create .env.example files, document environment variables
3. **Validation Tasks**: Run through each user story checklist item
4. **Debugging Tasks**: Test failure scenarios and verify error messages
5. **Documentation Tasks**: Complete startup guide and debugging guide

---

## Deliverables Summary

### Phase 0: Research
- [x] `research.md` - Current architecture, JWT flow, startup procedures, error handling

### Phase 1: Design
- [x] `contracts/validation-checklist.md` - Comprehensive validation checklist
- [x] `quickstart.md` - Startup and configuration guide
- [x] `docs/debugging-guide.md` - Common failure scenarios and resolutions
- [x] `scripts/validate-config.py` - Environment variable validator
- [x] `scripts/health-check.sh` - Service health checker
- [x] Updated `CLAUDE.md` - Agent context with validation tools

### Phase 2: Tasks (Generated by /sp.tasks)
- [ ] `tasks.md` - Dependency-ordered implementation tasks

---

## Success Criteria Mapping

| Success Criterion | Validation Method |
|-------------------|-------------------|
| SC-001: Start with ≤3 commands | Document startup script; verify in quickstart.md |
| SC-002: Services start <30s | Time service startup during validation |
| SC-003: Auth flow <10s | Time signup + signin + API call during validation |
| SC-004: 100% auth errors return 401 | Test missing/invalid/expired tokens; verify error codes |
| SC-005: 100% cross-user returns 403 | Test User A accessing User B's data; verify 403 |
| SC-006: Task CRUD succeeds | Run through all CRUD operations in checklist |
| SC-007: Config errors detected <5s | Run validation script; verify error detection speed |
| SC-008: Logs include timestamps | Inspect backend and frontend logs during testing |
| SC-009: Zero sensitive data leaks | Trigger errors; verify no DB credentials/SQL in responses |
| SC-010: Health checks <200ms | Time health endpoint responses |
| SC-011: 10 concurrent users | Create 10 users; perform simultaneous CRUD operations |
| SC-012: Debug issues <5min | Intentionally break config; time troubleshooting with guide |

---

## Risk Mitigation Verification

| Risk | Mitigation Verification |
|------|-------------------------|
| BETTER_AUTH_SECRET mismatch | Validation script checks secret match; startup guide emphasizes identity |
| Database connection failures | Health check script tests DB connectivity; debugging guide documents symptoms |
| Silent data leakage | Multi-user validation explicitly tests cross-user access with expected 403 |
| Incomplete error context | Debugging guide catalogs all error scenarios with example log outputs |

---

## Notes

This plan focuses on **validation and debugging** rather than building new features. All implementation artifacts (frontend, backend, database, authentication) were created in features 001-003. This feature ensures those components work correctly together in an end-to-end flow.

The validation approach is **manual testing with comprehensive checklists** rather than automated integration tests. This is appropriate for Phase 2 where the goal is to verify the system works for demo/submission rather than establishing CI/CD infrastructure.

**Key Success Factor**: Clear, actionable error messages at all service boundaries. Every failure scenario must have documented symptoms, root causes, and resolution steps to enable rapid debugging.
