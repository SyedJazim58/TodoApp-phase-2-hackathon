# Authentication Error Responses Contract

**Feature**: 002-jwt-auth-integration
**Component**: Error Response Formats for Authentication Failures
**Date**: 2026-02-08

---

## Purpose

Define the standard error response format for all authentication and authorization failures.

---

## Response Format

All authentication errors MUST follow this JSON schema:

```json
{
  "error": "string - human-readable error message",
  "code": "string - machine-readable error code"
}
```

### Schema Details

| Field  | Type   | Required | Description                                           |
|--------|--------|----------|-------------------------------------------------------|
| error  | string | Yes      | Human-readable error message for debugging            |
| code   | string | Yes      | Machine-readable error code (all uppercase, snake_case) |

---

## Error Definitions

### AUTH_MISSING (HTTP 401)

**Scenario**: No Authorization header provided in request

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Missing authentication token",
  "code": "AUTH_MISSING"
}
```

**Triggers**:
- Authorization header absent from request
- Authorization header is empty string

**Frontend Handling**:
- Clear any stored JWT token
- Redirect to login page
- Message: "Please log in to access this resource"

---

### AUTH_INVALID (HTTP 401)

**Scenario**: Invalid token signature or malformed token

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid token signature",
  "code": "AUTH_INVALID"
}
```

**Triggers**:
- Token signature verification fails (HMAC mismatch)
- Token is not valid JWT format (not 3 Base64URL parts)
- Authorization header is not "Bearer <token>" format
- Required claims (user_id, email) missing from payload

**Frontend Handling**:
- Clear stored JWT token (corrupted or tampered)
- Redirect to login page
- Message: "Your session is invalid. Please log in again."

---

### AUTH_EXPIRED (HTTP 401)

**Scenario**: Token expiry time (exp claim) has passed

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Token expired",
  "code": "AUTH_EXPIRED"
}
```

**Triggers**:
- Current Unix timestamp >= token exp claim
- PyJWT `jwt.ExpiredSignatureError` raised

**Frontend Handling**:
- Clear stored JWT token
- Redirect to login page
- Message: "Your session has expired. Please log in again."

---

### AUTH_FORBIDDEN (HTTP 403)

**Scenario**: Valid token but user_id in URL doesn't match JWT user_id

**HTTP Response**:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden: Cannot access another user's resources",
  "code": "AUTH_FORBIDDEN"
}
```

**Triggers**:
- Token is valid (signature OK, not expired)
- JWT user_id claim != URL user_id path parameter
- Attempt to access another user's data

**Frontend Handling**:
- Keep JWT token (still valid for user's own resources)
- Display error message in-place (no redirect)
- Message: "You don't have permission to access this resource."

---

## HTTP Status Code Mapping

| Error Code      | HTTP Status | Category          | Action                    |
|-----------------|-------------|-------------------|---------------------------|
| AUTH_MISSING    | 401         | Authentication    | Clear token, redirect     |
| AUTH_INVALID    | 401         | Authentication    | Clear token, redirect     |
| AUTH_EXPIRED    | 401         | Authentication    | Clear token, redirect     |
| AUTH_FORBIDDEN  | 403         | Authorization     | Keep token, show error    |

**Rule**: Use 401 for authentication failures (who are you?), 403 for authorization failures (you can't do that).

---

## Implementation Examples

### Backend (FastAPI)

```python
from fastapi import HTTPException

# AUTH_MISSING
raise HTTPException(
    status_code=401,
    detail={"error": "Missing authentication token", "code": "AUTH_MISSING"}
)

# AUTH_INVALID
raise HTTPException(
    status_code=401,
    detail={"error": "Invalid token signature", "code": "AUTH_INVALID"}
)

# AUTH_EXPIRED
raise HTTPException(
    status_code=401,
    detail={"error": "Token expired", "code": "AUTH_EXPIRED"}
)

# AUTH_FORBIDDEN
raise HTTPException(
    status_code=403,
    detail={"error": "Forbidden: Cannot access another user's resources", "code": "AUTH_FORBIDDEN"}
)
```

### Frontend (TypeScript)

```typescript
interface AuthError {
  error: string;
  code: "AUTH_MISSING" | "AUTH_INVALID" | "AUTH_EXPIRED" | "AUTH_FORBIDDEN";
}

async function handleAuthError(response: Response) {
  const error: AuthError = await response.json();

  switch (error.code) {
    case "AUTH_MISSING":
    case "AUTH_INVALID":
    case "AUTH_EXPIRED":
      // Clear token and redirect to login
      localStorage.removeItem("jwt_token");
      window.location.href = "/login";
      break;

    case "AUTH_FORBIDDEN":
      // Show error message, keep token
      alert("You don't have permission to access this resource.");
      break;

    default:
      console.error("Unknown auth error:", error);
  }
}
```

---

## Testing Contract

### Test Cases for Each Error Type

**Test AUTH_MISSING**:
```python
response = client.get("/api/user-123/tasks")  # No Authorization header
assert response.status_code == 401
assert response.json() == {
    "error": "Missing authentication token",
    "code": "AUTH_MISSING"
}
```

**Test AUTH_INVALID**:
```python
response = client.get(
    "/api/user-123/tasks",
    headers={"Authorization": "Bearer invalid_token"}
)
assert response.status_code == 401
assert response.json()["code"] == "AUTH_INVALID"
```

**Test AUTH_EXPIRED**:
```python
expired_token = generate_expired_jwt(user_id="user-123")
response = client.get(
    "/api/user-123/tasks",
    headers={"Authorization": f"Bearer {expired_token}"}
)
assert response.status_code == 401
assert response.json()["code"] == "AUTH_EXPIRED"
```

**Test AUTH_FORBIDDEN**:
```python
token_user_a = generate_jwt(user_id="user-a")
response = client.get(
    "/api/user-b/tasks",  # Trying to access user-b's data
    headers={"Authorization": f"Bearer {token_user_a}"}
)
assert response.status_code == 403
assert response.json()["code"] == "AUTH_FORBIDDEN"
```

---

## Logging Contract

### What to Log

**Authentication Failures (401)**:
```python
logger.warning(
    f"Authentication failed: {error_code}",
    extra={
        "error_code": error_code,  # AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED
        "endpoint": request.url.path,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("User-Agent"),
        # DO NOT log JWT token (sensitive)
    }
)
```

**Authorization Failures (403)**:
```python
logger.warning(
    f"Authorization failed: User {jwt_user_id} attempted to access {url_user_id}'s resources",
    extra={
        "error_code": "AUTH_FORBIDDEN",
        "jwt_user_id": jwt_user_id,
        "url_user_id": url_user_id,
        "endpoint": request.url.path,
        "ip_address": request.client.host,
        # DO NOT log JWT token (sensitive)
    }
)
```

### What NOT to Log
- ❌ JWT token contents (sensitive data)
- ❌ BETTER_AUTH_SECRET (critical security risk)
- ❌ Full stack traces in production (information leakage)

---

## Security Considerations

### Error Message Guidelines

**✅ DO**:
- Use generic error messages
- Provide machine-readable error codes
- Log detailed info server-side

**❌ DON'T**:
- Reveal whether a user_id exists ("User not found" vs "Token mismatch")
- Expose token structure or claims
- Include sensitive data in error responses
- Leak system internals (stack traces, file paths)

### Rate Limiting Recommendations

- Apply rate limiting to prevent brute-force attacks
- Consider stricter limits for authentication endpoints
- Track repeated AUTH_INVALID errors (potential attack)

---

## OpenAPI Schema

```yaml
components:
  schemas:
    AuthError:
      type: object
      required:
        - error
        - code
      properties:
        error:
          type: string
          description: Human-readable error message
          example: "Token expired"
        code:
          type: string
          enum: [AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED, AUTH_FORBIDDEN]
          description: Machine-readable error code
          example: "AUTH_EXPIRED"

  responses:
    Unauthorized:
      description: Authentication failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AuthError'
          examples:
            missing:
              value:
                error: "Missing authentication token"
                code: "AUTH_MISSING"
            invalid:
              value:
                error: "Invalid token signature"
                code: "AUTH_INVALID"
            expired:
              value:
                error: "Token expired"
                code: "AUTH_EXPIRED"

    Forbidden:
      description: Authorization failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AuthError'
          example:
            error: "Forbidden: Cannot access another user's resources"
            code: "AUTH_FORBIDDEN"
```

---

**Contract Complete**: All authentication error responses standardized and documented. Ready for implementation.
