# Quickstart Guide: Authentication & JWT Integration

**Feature**: 002-jwt-auth-integration
**Date**: 2026-02-08
**Purpose**: Step-by-step guide to implement JWT authentication

---

## Overview

This guide walks through implementing JWT-based authentication between Next.js frontend (Better Auth) and FastAPI backend. Estimated time: 2-3 hours for complete implementation.

---

## Prerequisites

- Feature 001 (Backend Core & Data Layer) completed
- Python 3.11+ installed
- Node.js 18+ installed
- Git repository initialized

---

## Step 1: Generate Shared Secret

Generate a cryptographically secure random string for BETTER_AUTH_SECRET:

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -hex 32
```

**Option B: Using Python**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example Output**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Save this value** - you'll use it in both frontend and backend configuration.

---

## Step 2: Backend Configuration

### 2.1 Update Environment Variables

Edit `backend/.env`:

```env
# Existing variables (from Feature 001)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NEW: Add JWT authentication secret
BETTER_AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Update `backend/.env.example`:

```env
DATABASE_URL=your_neon_database_url
BETTER_AUTH_SECRET=your_secret_here_minimum_32_characters
```

### 2.2 Install PyJWT Dependency

Add to `backend/requirements.txt`:

```txt
# Existing dependencies
fastapi==0.109.0
sqlmodel==0.0.14
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pytest==7.4.3
pytest-cov==4.1.0

# NEW: JWT authentication
PyJWT==2.8.0
```

Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### 2.3 Create Auth Module Structure

```bash
mkdir -p backend/src/auth
touch backend/src/auth/__init__.py
touch backend/src/auth/jwt_middleware.py
touch backend/src/auth/dependencies.py
touch backend/src/auth/exceptions.py
```

---

## Step 3: Implement Backend JWT Verification

### 3.1 Create Auth Exceptions

File: `backend/src/auth/exceptions.py`

```python
from fastapi import HTTPException

class AuthenticationError(HTTPException):
    """Raised when JWT verification fails (401)"""
    def __init__(self, message: str, code: str):
        super().__init__(
            status_code=401,
            detail={"error": message, "code": code}
        )

class AuthorizationError(HTTPException):
    """Raised when user_id doesn't match (403)"""
    def __init__(self, message: str, code: str):
        super().__init__(
            status_code=403,
            detail={"error": message, "code": code}
        )
```

### 3.2 Implement JWT Middleware

File: `backend/src/auth/jwt_middleware.py`

```python
import jwt
import os
from typing import Dict
from .exceptions import AuthenticationError

def verify_jwt_token(token: str) -> Dict[str, any]:
    """
    Verify JWT token signature and expiry.

    Args:
        token: JWT token string (without "Bearer" prefix)

    Returns:
        dict: Decoded JWT payload with user_id, email, iat, exp

    Raises:
        AuthenticationError: If token is invalid or expired
    """
    secret = os.getenv("BETTER_AUTH_SECRET")
    if not secret:
        raise ValueError("BETTER_AUTH_SECRET not configured")

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_exp": True}
        )

        # Validate required claims
        if "user_id" not in payload or "email" not in payload:
            raise AuthenticationError(
                "Token missing required claims",
                "AUTH_INVALID"
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired", "AUTH_EXPIRED")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token signature", "AUTH_INVALID")
```

### 3.3 Create FastAPI Dependency

File: `backend/src/auth/dependencies.py`

```python
from fastapi import Depends, Header, Path
from typing import Dict
from .jwt_middleware import verify_jwt_token
from .exceptions import AuthenticationError, AuthorizationError

async def get_current_user(
    authorization: str = Header(..., description="JWT token in 'Bearer <token>' format"),
    user_id: str = Path(..., description="User ID from URL path")
) -> Dict[str, any]:
    """
    FastAPI dependency that verifies JWT and enforces user_id matching.

    Returns:
        dict: Authenticated user with user_id, email, iat, exp

    Raises:
        AuthenticationError: 401 for invalid/missing/expired tokens
        AuthorizationError: 403 for user_id mismatch
    """
    # Extract token from "Bearer <token>" format
    if not authorization:
        raise AuthenticationError("Missing authentication token", "AUTH_MISSING")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise AuthenticationError(
            "Invalid authorization header format. Expected: Authorization: Bearer <token>",
            "AUTH_INVALID"
        )

    token = parts[1]

    # Verify JWT token
    payload = verify_jwt_token(token)

    # Enforce user_id matching
    if payload["user_id"] != user_id:
        raise AuthorizationError(
            "Forbidden: Cannot access another user's resources",
            "AUTH_FORBIDDEN"
        )

    return payload
```

---

## Step 4: Protect API Routes

### 4.1 Apply Auth Dependency to Routes

Example: Protect task endpoints

File: `backend/src/api/tasks.py` (create if not exists)

```python
from fastapi import APIRouter, Depends
from typing import List
from src.auth.dependencies import get_current_user
from src.models.task import Task
from src.repositories.task_repository import TaskRepository

router = APIRouter()

@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[Task]:
    """
    Get all tasks for authenticated user.

    current_user is guaranteed to match user_id due to middleware.
    """
    repo = TaskRepository()
    return repo.get_all(current_user["user_id"])

@router.post("/api/{user_id}/tasks")
async def create_task(
    user_id: str,
    task_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new task for authenticated user.
    """
    repo = TaskRepository()
    task_data["user_id"] = current_user["user_id"]  # Force user_id from token
    return repo.create(task_data)
```

---

## Step 5: Frontend Setup

### 5.1 Initialize Next.js Project

```bash
npx create-next-app@latest frontend --typescript --app --no-tailwind
cd frontend
```

### 5.2 Install Better Auth

```bash
npm install better-auth
```

### 5.3 Configure Environment Variables

Create `frontend/.env.local`:

```env
BETTER_AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `frontend/.env.local.example`:

```env
BETTER_AUTH_SECRET=your_secret_here_minimum_32_characters
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5.4 Configure Better Auth

Create `frontend/src/lib/auth/better-auth-config.ts`:

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  session: {
    strategy: "jwt",
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },
  jwt: {
    secret: process.env.BETTER_AUTH_SECRET!,
    algorithm: "HS256",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
});
```

### 5.5 Create API Client with JWT Attachment

Create `frontend/src/lib/auth/auth-client.ts`:

```typescript
interface AuthError {
  error: string;
  code: "AUTH_MISSING" | "AUTH_INVALID" | "AUTH_EXPIRED" | "AUTH_FORBIDDEN";
}

export class AuthenticatedClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async fetch(endpoint: string, options: RequestInit = {}) {
    // Get JWT token from localStorage
    const token = localStorage.getItem("jwt_token");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Attach JWT token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      const error: AuthError = await response.json();
      this.handleAuthError(error, response.status);
    }

    return response;
  }

  private handleAuthError(error: AuthError, status: number) {
    if (status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("jwt_token");
      window.location.href = "/login";
    } else if (status === 403) {
      // Show error message
      alert("You don't have permission to access this resource.");
    }
  }
}

export const apiClient = new AuthenticatedClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
);
```

---

## Step 6: Testing

### 6.1 Backend Unit Tests

Create `backend/tests/test_jwt_middleware.py`:

```python
import pytest
from src.auth.jwt_middleware import verify_jwt_token
from src.auth.exceptions import AuthenticationError
import jwt
import os

def generate_test_token(user_id: str, email: str, exp_delta: int = 3600):
    """Helper to generate test JWT tokens"""
    import time
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_delta
    }
    return jwt.encode(payload, os.getenv("BETTER_AUTH_SECRET"), algorithm="HS256")

def test_valid_token():
    token = generate_test_token("user-123", "test@example.com")
    payload = verify_jwt_token(token)
    assert payload["user_id"] == "user-123"
    assert payload["email"] == "test@example.com"

def test_expired_token():
    token = generate_test_token("user-123", "test@example.com", exp_delta=-3600)
    with pytest.raises(AuthenticationError) as exc:
        verify_jwt_token(token)
    assert exc.value.detail["code"] == "AUTH_EXPIRED"

def test_invalid_signature():
    token = jwt.encode(
        {"user_id": "user-123", "email": "test@example.com"},
        "wrong-secret",
        algorithm="HS256"
    )
    with pytest.raises(AuthenticationError) as exc:
        verify_jwt_token(token)
    assert exc.value.detail["code"] == "AUTH_INVALID"
```

### 6.2 Run Tests

```bash
cd backend
pytest tests/test_jwt_middleware.py -v
```

---

## Step 7: Manual Testing

### 7.1 Start Backend

```bash
cd backend
uvicorn src.main:app --reload
```

### 7.2 Start Frontend

```bash
cd frontend
npm run dev
```

### 7.3 Test Authentication Flow

1. Navigate to `http://localhost:3000/login`
2. Log in with test credentials
3. Verify JWT token is stored (check browser localStorage)
4. Make API request to `/api/{user_id}/tasks`
5. Verify request succeeds with 200 OK
6. Attempt to access another user's tasks (should get 403)

---

## Step 8: Update Agent Context

Run the agent context update script:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This appends new technologies to CLAUDE.md:
- PyJWT 2.8+ (backend JWT verification)
- Better Auth 1.0+ (frontend authentication)
- JWT token format: `{user_id, email, iat, exp}` with HS256

---

## Troubleshooting

### Issue: "BETTER_AUTH_SECRET not configured"
**Solution**: Ensure .env file exists and contains BETTER_AUTH_SECRET

### Issue: "Token expired" immediately after login
**Solution**: Check system clock synchronization between frontend/backend

### Issue: "Invalid token signature"
**Solution**: Verify BETTER_AUTH_SECRET matches exactly in frontend and backend

### Issue: 403 Forbidden on own resources
**Solution**: Check user_id in URL matches user_id in JWT token

---

## Next Steps

After completing this quickstart:

1. Run `/sp.tasks` to generate detailed task breakdown
2. Implement remaining features (signup UI, error handling)
3. Add comprehensive test coverage
4. Configure production secrets (different from dev)
5. Deploy with HTTPS enabled

---

**Quickstart Complete**: JWT authentication is now configured. Test thoroughly before proceeding to task implementation.
