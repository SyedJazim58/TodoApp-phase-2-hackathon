# Data Model: Authentication & JWT Integration

**Feature**: 002-jwt-auth-integration
**Date**: 2026-02-08
**Purpose**: Define data structures for JWT authentication and user identity

---

## Overview

This feature implements **stateless authentication** - no database models are created for session storage. User identity is derived entirely from the JWT token during the request lifecycle. The JWT token is the single source of truth for user identity.

---

## Entity: AuthenticatedUser

**Purpose**: Represents the authenticated user identity extracted from a verified JWT token.

**Lifecycle**: Exists only during an HTTP request. Created by JWT middleware after successful token verification. Destroyed when request completes.

**Storage**: None - stateless (no database table, no session storage)

### Fields

| Field     | Type    | Required | Description                                      | Validation                  |
|-----------|---------|----------|--------------------------------------------------|-----------------------------|
| user_id   | string  | Yes      | Unique identifier for the user                   | Non-empty string            |
| email     | string  | Yes      | User's email address                             | Valid email format          |
| iat       | integer | Yes      | Issued-at timestamp (Unix epoch)                 | Positive integer            |
| exp       | integer | Yes      | Expiration timestamp (Unix epoch)                | Greater than iat            |

### Field Details

#### user_id
- **Purpose**: Unique identifier for the user across the system
- **Source**: Extracted from JWT token payload
- **Usage**:
  - Compared against URL path parameter (`/api/{user_id}/tasks`)
  - Used to filter database queries (user_id column in tasks table)
  - Single source of truth for user identity
- **Constraints**:
  - Must match user_id in URL for request to succeed (403 if mismatch)
  - Cannot be empty or null
- **Example**: `"user-abc123"`, `"auth0|507f1f77bcf86cd799439011"`

#### email
- **Purpose**: User's email address for identification and communication
- **Source**: Extracted from JWT token payload
- **Usage**:
  - Logging and audit trails
  - Display in UI (if needed)
  - Not used for authorization (user_id is authoritative)
- **Constraints**:
  - Must be valid email format
  - Cannot be empty
- **Example**: `"user@example.com"`, `"alice@company.org"`

#### iat
- **Purpose**: Timestamp when the token was issued
- **Source**: JWT standard claim (Issued At)
- **Usage**:
  - Audit logging (when was this token created?)
  - Debug token age issues
  - Not actively validated (expiry check is sufficient)
- **Format**: Unix timestamp (seconds since epoch)
- **Example**: `1675890000` (2023-02-08 18:46:40 UTC)

#### exp
- **Purpose**: Timestamp when the token expires
- **Source**: JWT standard claim (Expiration Time)
- **Usage**:
  - Validated by JWT library (PyJWT automatically checks exp)
  - Determines if token is still valid
  - Rejected if current time > exp (HTTP 401 AUTH_EXPIRED)
- **Format**: Unix timestamp (seconds since epoch)
- **Default Expiry**: iat + 604800 seconds (7 days)
- **Example**: `1676494800` (2023-02-15 18:46:40 UTC)

---

## JWT Token Structure

**Format**: JSON Web Token (JWT) with three parts: Header.Payload.Signature

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)
```json
{
  "user_id": "user-abc123",
  "email": "user@example.com",
  "iat": 1675890000,
  "exp": 1676494800
}
```

### Signature
- Algorithm: HMAC-SHA256 (HS256)
- Secret: BETTER_AUTH_SECRET environment variable
- Computed as: `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`

### Complete Token Example
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1hYmMxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2NzU4OTAwMDAsImV4cCI6MTY3NjQ5NDgwMH0.signature_here
```

---

## Entity: AuthError

**Purpose**: Represents authentication or authorization failures.

**Lifecycle**: Created when JWT verification fails or user_id mismatch detected. Returned to client as HTTP response.

**Storage**: None - transient error response

### Fields

| Field | Type   | Required | Description                        | Example Values              |
|-------|--------|----------|------------------------------------|----------------------------|
| error | string | Yes      | Human-readable error message       | "Token expired"             |
| code  | string | Yes      | Machine-readable error code        | "AUTH_EXPIRED"              |

### Error Variants

#### AUTH_MISSING
- **Trigger**: No Authorization header in request
- **HTTP Status**: 401 Unauthorized
- **Response**:
  ```json
  {
    "error": "Missing authentication token",
    "code": "AUTH_MISSING"
  }
  ```

#### AUTH_INVALID
- **Trigger**: Invalid token signature or malformed token
- **HTTP Status**: 401 Unauthorized
- **Response**:
  ```json
  {
    "error": "Invalid token signature",
    "code": "AUTH_INVALID"
  }
  ```

#### AUTH_EXPIRED
- **Trigger**: Token expiry time (exp) has passed
- **HTTP Status**: 401 Unauthorized
- **Response**:
  ```json
  {
    "error": "Token expired",
    "code": "AUTH_EXPIRED"
  }
  ```

#### AUTH_FORBIDDEN
- **Trigger**: Valid token but user_id in URL doesn't match JWT user_id
- **HTTP Status**: 403 Forbidden
- **Response**:
  ```json
  {
    "error": "Forbidden: Cannot access another user's resources",
    "code": "AUTH_FORBIDDEN"
  }
  ```

---

## Data Flow Diagram

```
┌─────────────┐
│  Frontend   │
│ (Next.js +  │
│ Better Auth)│
└──────┬──────┘
       │
       │ 1. User logs in
       ▼
┌─────────────────┐
│  Better Auth    │  Generates JWT token:
│  JWT Issuance   │  {user_id, email, iat, exp}
└────────┬────────┘  Signed with BETTER_AUTH_SECRET
         │
         │ 2. Token returned to frontend
         ▼
┌─────────────────┐
│  Frontend       │  Stores token (localStorage/cookie)
│  Token Storage  │
└────────┬────────┘
         │
         │ 3. API request with token
         │    Authorization: Bearer <jwt>
         ▼
┌─────────────────────────┐
│  Backend FastAPI        │
│  JWT Middleware         │
│                         │
│  Step 1: Extract token  │
│  Step 2: Verify signature (BETTER_AUTH_SECRET)
│  Step 3: Validate expiry (exp > now)
│  Step 4: Decode payload │
│  Step 5: Compare user_id│
└──────────┬──────────────┘
           │
           │ Valid & Matched
           ▼
┌─────────────────────────┐
│  Route Handler          │  Receives AuthenticatedUser
│  (Protected Endpoint)   │  Filters DB by user_id
└─────────────────────────┘
```

---

## Validation Rules

### JWT Token Validation (Backend)
1. **Authorization Header Exists**: Must be present in request
   - Failure → AUTH_MISSING (HTTP 401)

2. **Header Format**: Must be `Bearer <token>`
   - Failure → AUTH_INVALID (HTTP 401)

3. **Token Structure**: Must have 3 parts (header.payload.signature)
   - Failure → AUTH_INVALID (HTTP 401)

4. **Signature Verification**: HMACSHA256 signature must match
   - Uses BETTER_AUTH_SECRET as key
   - Failure → AUTH_INVALID (HTTP 401)

5. **Expiry Check**: Current time < exp timestamp
   - Failure → AUTH_EXPIRED (HTTP 401)

6. **Required Claims**: user_id and email must be present in payload
   - Failure → AUTH_INVALID (HTTP 401)

7. **User ID Matching**: JWT user_id == URL user_id
   - Failure → AUTH_FORBIDDEN (HTTP 403)

### JWT Token Issuance (Frontend)
1. **Secret**: BETTER_AUTH_SECRET must be at least 32 characters
2. **Algorithm**: Must be HS256 (symmetric HMAC)
3. **Expiry**: exp = iat + 604800 (7 days)
4. **Claims**: user_id and email must be set from authenticated user

---

## Relationships

### No Database Relationships
This feature is stateless - no database models are created. However, AuthenticatedUser relates to existing entities via user_id:

**AuthenticatedUser** ←→ **Task** (from Feature 001)
- Relationship: One-to-Many (one user has many tasks)
- Enforced via: Database query filtering by user_id
- Example:
  ```python
  # In task repository
  tasks = session.query(Task).filter(
      Task.user_id == authenticated_user.user_id
  ).all()
  ```

**Future Features** (not in scope for Feature 002):
- AuthenticatedUser ←→ User (user profile management)
- AuthenticatedUser ←→ Session (if session tracking added)
- AuthenticatedUser ←→ AuditLog (if audit logging added)

---

## State Transitions

### Token Lifecycle

```
┌─────────────┐
│  Not Issued │
└──────┬──────┘
       │
       │ User logs in via Better Auth
       ▼
┌─────────────┐
│   Issued    │  Token created: iat = now, exp = now + 7 days
└──────┬──────┘  Signed with BETTER_AUTH_SECRET
       │
       │ Token transmitted to frontend
       ▼
┌─────────────┐
│   Active    │  Token valid: current time < exp
└──────┬──────┘  Accepted by backend
       │
       │ Time passes...
       ▼
┌─────────────┐
│   Expired   │  Token invalid: current time >= exp
└─────────────┘  Rejected by backend (HTTP 401 AUTH_EXPIRED)
```

**Note**: No token revocation mechanism. Once issued, token remains valid until expiry (unless BETTER_AUTH_SECRET is rotated).

---

## Security Considerations

### Token Security
- **Transmission**: HTTPS only (TLS 1.2+) to prevent token interception
- **Storage**: Frontend responsibility (localStorage or httpOnly cookie)
- **Payload**: No sensitive data (no passwords, SSNs, credit cards)
- **Signature**: HMAC-SHA256 prevents tampering
- **Expiry**: 7-day limit reduces window of opportunity if token compromised

### Secret Management
- **BETTER_AUTH_SECRET**:
  - Minimum 32 characters (256 bits)
  - Cryptographically random
  - Stored in .env files (not committed to Git)
  - Different secrets for dev/staging/prod
  - Rotation invalidates all tokens (users must re-login)

### User Isolation
- **user_id Verification**: Every request validates JWT user_id matches URL user_id
- **Database Filtering**: All queries filtered by authenticated_user.user_id
- **No Bypass**: No code path allows skipping user_id validation

---

## Implementation Notes

### Backend (FastAPI)
- **Pydantic Model** (optional, for type safety):
  ```python
  from pydantic import BaseModel

  class AuthenticatedUser(BaseModel):
      user_id: str
      email: str
      iat: int
      exp: int
  ```

- **JWT Verification** (PyJWT):
  ```python
  import jwt

  payload = jwt.decode(
      token,
      secret=os.getenv("BETTER_AUTH_SECRET"),
      algorithms=["HS256"],
      options={"verify_exp": True}
  )
  authenticated_user = AuthenticatedUser(**payload)
  ```

### Frontend (Next.js + Better Auth)
- **Better Auth Configuration**:
  ```typescript
  export const auth = betterAuth({
    session: { strategy: "jwt", expiresIn: 60 * 60 * 24 * 7 },
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

---

## Testing Considerations

### Unit Tests
- Mock JWT tokens with fixed secrets
- Test valid tokens (should succeed)
- Test expired tokens (should return AUTH_EXPIRED)
- Test tampered tokens (should return AUTH_INVALID)
- Test missing tokens (should return AUTH_MISSING)
- Test user_id mismatch (should return AUTH_FORBIDDEN)

### Integration Tests
- Full authentication flow: login → receive token → make API request
- Token attachment to HTTP requests
- Error handling for 401/403 responses
- Concurrent requests with same token (no interference)

### Security Tests
- Attempt cross-user access (should fail with 403)
- Replay expired token (should fail with 401)
- Modify token payload (should fail with 401 due to signature mismatch)

---

**Data Model Complete**: All entities and relationships defined for stateless JWT authentication. No database schema changes required. Ready for contract generation (Phase 1).
