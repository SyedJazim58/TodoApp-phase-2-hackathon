# Research: Authentication & JWT Integration

**Feature**: 002-jwt-auth-integration
**Date**: 2026-02-08
**Purpose**: Research technology choices, best practices, and implementation patterns for JWT-based authentication

---

## Research Topic 1: PyJWT Library for Backend Verification

**Question**: Which Python library should be used for JWT verification in FastAPI backend?

**Decision**: **PyJWT 2.8+**

**Rationale**:
- Industry-standard Python JWT library with 6.5k+ GitHub stars
- Maintained by the JWT.io community
- Supports all required algorithms (HS256, HS512, RS256, etc.)
- Simple API: `jwt.encode()` and `jwt.decode()` with automatic signature verification
- Built-in expiry validation via `exp` claim
- Integrates seamlessly with FastAPI via dependency injection
- Minimal dependencies (only `cryptography` for certain algorithms)
- Well-documented with extensive examples

**Alternatives Considered**:
1. **python-jose** (rejected)
   - More complex API with unnecessary features
   - Larger dependency footprint
   - Less actively maintained (last major update 2 years ago)
   - Overkill for stateless JWT verification

2. **authlib** (rejected)
   - Full OAuth/OIDC library - over-engineered for simple JWT
   - Heavier weight (50+ dependencies)
   - Steeper learning curve
   - Designed for OAuth flows, not stateless JWT verification

**Implementation Notes**:
```python
import jwt
from datetime import datetime

# Verify JWT token
def verify_token(token: str, secret: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_exp": True}  # Automatic expiry check
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")
```

**Dependencies**: `PyJWT==2.8.0` (add to requirements.txt)

---

## Research Topic 2: Better Auth Configuration for JWT Issuance

**Question**: How should Better Auth be configured in Next.js to issue JWT tokens with required claims?

**Decision**: **Better Auth with JWT Session Strategy**

**Rationale**:
- Better Auth is the recommended successor to NextAuth.js for Next.js 14+
- Native JWT support via `jwt` session strategy
- Built-in Next.js App Router integration
- TypeScript-first design with full type safety
- Handles token issuance, refresh, and expiry automatically
- Customizable JWT payload via `jwt()` callback
- Server-side and client-side auth hooks
- Minimal configuration required

**Alternatives Considered**:
1. **NextAuth.js** (rejected - deprecated)
   - Deprecated in favor of Auth.js
   - No longer receiving updates
   - Migration path leads to Auth.js or Better Auth

2. **Auth.js (formerly NextAuth v5)** (considered)
   - Similar feature set to Better Auth
   - Less intuitive TypeScript support
   - Better Auth has better documentation for JWT-only use cases

3. **Custom JWT implementation** (rejected)
   - Reinventing the wheel
   - Security risks (token generation, signing, refresh logic)
   - Time-consuming to implement and test
   - No community support or audits

**Implementation Notes**:
```typescript
// lib/auth/better-auth-config.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  session: {
    strategy: "jwt",
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },
  jwt: {
    secret: process.env.BETTER_AUTH_SECRET,
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

**Dependencies**: `better-auth@^1.0.0` (add to package.json)

---

## Research Topic 3: JWT Algorithm Selection

**Question**: Which JWT signing algorithm should be used for authentication?

**Decision**: **HS256 (HMAC with SHA-256)**

**Rationale**:
- Symmetric algorithm - single shared secret between frontend and backend
- Simplest to configure (no public/private key management)
- Sufficient security for short-lived tokens (7 days)
- Industry-standard for stateless authentication
- Fast verification (< 1ms per token)
- Supported by all JWT libraries (PyJWT, Better Auth, etc.)
- No key rotation complexity (single secret)

**Alternatives Considered**:
1. **RS256 (RSA with SHA-256)** (rejected)
   - Asymmetric algorithm - public/private key pair
   - Overkill for single backend architecture
   - Adds complexity: key generation, storage, rotation
   - Slower verification (RSA is computationally expensive)
   - Useful for multi-backend scenarios (not applicable here)

2. **HS512 (HMAC with SHA-512)** (rejected)
   - Stronger hash but overkill for 7-day tokens
   - Larger token size (512-bit signature vs 256-bit)
   - Minimal security benefit for our use case
   - HS256 is industry standard

3. **ES256 (ECDSA with SHA-256)** (rejected)
   - Asymmetric algorithm, similar complexity to RS256
   - Not necessary for single-backend architecture

**Security Considerations**:
- BETTER_AUTH_SECRET must be at least 32 characters (256 bits)
- Use cryptographically secure random string (e.g., `openssl rand -hex 32`)
- Different secrets for dev/staging/prod environments
- Secret rotation invalidates all issued tokens (acceptable tradeoff)

**Token Format**:
```json
{
  "user_id": "abc123",
  "email": "user@example.com",
  "iat": 1675890000,
  "exp": 1676494800
}
```

---

## Research Topic 4: FastAPI Middleware Implementation Pattern

**Question**: What's the best pattern for implementing JWT verification in FastAPI?

**Decision**: **FastAPI Dependency Injection**

**Rationale**:
- FastAPI's recommended pattern for authentication
- Route-level control: apply auth to specific endpoints
- Testable: easy to mock dependencies in tests
- Reusable: single `Depends(get_current_user)` dependency
- Type-safe: FastAPI validates dependency return types
- Clear error handling: raise HTTPException in dependency
- Composable: can add additional dependencies (rate limiting, etc.)
- Idiomatic: follows FastAPI conventions

**Alternatives Considered**:
1. **Global Middleware** (rejected)
   - All-or-nothing approach (applies to all routes)
   - Cannot exclude public routes (health checks, login endpoints)
   - Less flexible for route-specific auth requirements
   - Harder to test individual routes

2. **Decorator Pattern** (rejected)
   - Not idiomatic in FastAPI (Python decorators don't integrate well)
   - Repetitive code (`@require_auth` on every route)
   - Doesn't leverage FastAPI's dependency injection system
   - Harder to compose with other dependencies

**Implementation Notes**:
```python
# auth/dependencies.py
from fastapi import Depends, HTTPException, Header
import jwt

async def get_current_user(
    authorization: str = Header(...),
    user_id: str = Path(...)
) -> dict:
    """
    FastAPI dependency that verifies JWT and enforces user_id matching.

    Returns:
        dict: Authenticated user with user_id and email

    Raises:
        HTTPException: 401 for invalid tokens, 403 for user_id mismatch
    """
    token = extract_token(authorization)  # Extract "Bearer <token>"
    payload = verify_jwt(token)  # Verify signature, expiry

    if payload["user_id"] != user_id:
        raise HTTPException(status_code=403, detail={
            "error": "Forbidden: Cannot access another user's resources",
            "code": "AUTH_FORBIDDEN"
        })

    return payload

# Usage in route
@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    # current_user is guaranteed to match user_id
    # Implement route logic
    pass
```

**Testing Pattern**:
```python
# Override dependency for testing
def override_get_current_user():
    return {"user_id": "test-user", "email": "test@example.com"}

app.dependency_overrides[get_current_user] = override_get_current_user
```

---

## Research Topic 5: Error Response Format

**Question**: What format should authentication error responses use?

**Decision**: **JSON with `error` and `code` fields**

**Rationale**:
- RESTful best practice for API error responses
- Machine-parseable: frontend can switch on `code` field
- Human-readable: `error` field provides context for debugging
- Consistent: same format for all auth errors
- Extensible: can add fields (e.g., `details`, `timestamp`) if needed
- Aligns with HTTP status codes (401, 403)

**Alternatives Considered**:
1. **Plain text** (rejected)
   - Not machine-parseable
   - Frontend must parse error strings (fragile)
   - No structured error handling

2. **HTTP status only** (rejected)
   - Insufficient detail (401 could be missing token OR expired token)
   - No machine-readable error codes
   - Hard to distinguish error types in logs

3. **RFC 7807 Problem Details** (rejected - over-engineered)
   - Full specification with `type`, `title`, `status`, `detail`, `instance`
   - Overkill for simple auth errors
   - More complex than needed

**Error Response Schema**:
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

**Error Codes Defined** (from spec FR-025 to FR-028):
- `AUTH_MISSING`: No Authorization header → HTTP 401
- `AUTH_INVALID`: Invalid signature or malformed token → HTTP 401
- `AUTH_EXPIRED`: Token expiry time passed → HTTP 401
- `AUTH_FORBIDDEN`: Valid token but user_id mismatch → HTTP 403

**Implementation**:
```python
# auth/exceptions.py
from fastapi import HTTPException

class AuthenticationError(HTTPException):
    def __init__(self, message: str, code: str):
        super().__init__(
            status_code=401,
            detail={"error": message, "code": code}
        )

class AuthorizationError(HTTPException):
    def __init__(self, message: str, code: str):
        super().__init__(
            status_code=403,
            detail={"error": message, "code": code}
        )
```

---

## Best Practices Summary

### JWT Token Best Practices
1. **Token Expiry**: 7 days (configurable) - balances security and UX
2. **Token Size**: Keep payload minimal (user_id, email, timestamps only)
3. **Secret Management**: Use environment variables, never commit secrets
4. **Algorithm**: HS256 for symmetric signing (sufficient for our use case)
5. **Claims**: Include `iat` (issued-at) and `exp` (expiry) timestamps

### FastAPI Security Best Practices
1. **Dependency Injection**: Use `Depends()` for auth verification
2. **Type Safety**: Annotate dependency return types
3. **Error Handling**: Raise HTTPException with detailed error codes
4. **Path Parameters**: Validate URL user_id against JWT user_id
5. **Testing**: Override dependencies for unit tests

### Frontend Best Practices
1. **Token Storage**: Use httpOnly cookies (secure) or localStorage (convenient)
2. **Token Attachment**: Automatic via API client wrapper (all requests)
3. **Error Handling**: 401 → clear token + redirect to login, 403 → show error message
4. **Token Refresh**: Not implemented (users re-authenticate after 7 days)

### Security Best Practices
1. **HTTPS Only**: JWT tokens must be transmitted over TLS
2. **No Sensitive Data in JWT**: Only user_id and email (no passwords, PII)
3. **Log Safely**: Log auth failures, never log JWT tokens
4. **Secret Rotation**: Plan for secret rotation (invalidates all tokens)

---

## Technology Stack Finalized

### Backend
- **FastAPI**: 0.109+ (existing)
- **PyJWT**: 2.8+ (new dependency)
- **Python-dotenv**: 1.0+ (existing)
- **Pydantic**: 2.0+ (existing, for error models)

### Frontend
- **Next.js**: 16+ with App Router (new)
- **Better Auth**: 1.0+ (new dependency)
- **TypeScript**: 5.0+ (new)
- **Fetch API**: Native (for HTTP requests)

### Shared Configuration
- **BETTER_AUTH_SECRET**: Environment variable (32+ characters)
- **JWT Algorithm**: HS256
- **Token Format**: `{user_id, email, iat, exp}`
- **Token Expiry**: 7 days (604800 seconds)

---

## Open Questions Resolved

1. **Q**: Should we implement refresh tokens?
   **A**: No - spec explicitly excludes refresh tokens (Out of Scope). Users re-authenticate after 7-day expiry.

2. **Q**: How to handle concurrent logins from multiple devices?
   **A**: Each login generates independent JWT token. All tokens valid until expiry. No token revocation mechanism.

3. **Q**: What if user account is deleted while token is valid?
   **A**: Out of scope for Feature 002. Expected behavior: token verifies successfully, but database queries return no data (404 responses).

4. **Q**: Should JWT include user roles/permissions?
   **A**: No - RBAC is out of scope. JWT contains only user_id and email.

5. **Q**: How to test JWT verification without real tokens?
   **A**: FastAPI dependency overrides in tests. Generate mock JWT tokens with fixed secrets for testing.

---

## References

- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [Better Auth Documentation](https://better-auth.com/docs)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT.io](https://jwt.io/) - JWT debugger and spec
- [RFC 7519: JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)

---

**Research Complete**: All technology decisions made. No NEEDS CLARIFICATION markers remain. Ready to proceed to Phase 1 (Design & Contracts).
