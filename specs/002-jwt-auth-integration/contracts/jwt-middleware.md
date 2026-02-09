# JWT Middleware Contract

**Feature**: 002-jwt-auth-integration
**Component**: Backend JWT Verification Middleware
**Date**: 2026-02-08

---

## Purpose

Define the contract for FastAPI JWT verification middleware that authenticates requests and enforces user isolation.

---

## Input Contract

### HTTP Request Requirements

**Required Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Header Format**:
- **Key**: `Authorization` (case-insensitive per HTTP spec)
- **Value Format**: `Bearer <token>`
  - Prefix: `Bearer` (case-sensitive, single space after)
  - Token: Base64URL-encoded JWT string
  - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Required URL Parameters**:
```http
/api/{user_id}/resource
```

**Path Parameter**:
- **Name**: `user_id`
- **Type**: String
- **Location**: Path segment after `/api/`
- **Purpose**: User identifier to compare against JWT claims
- **Example**: `/api/user-abc123/tasks`

---

## Processing Contract

### Verification Steps (Sequential)

#### Step 1: Extract Authorization Header
- **Action**: Read `Authorization` header from HTTP request
- **Success**: Header exists and is non-empty
- **Failure**: Header missing → AUTH_MISSING error

#### Step 2: Parse Bearer Token
- **Action**: Split header value on first space, extract second part
- **Expected Format**: `Bearer <token>`
- **Success**: Two parts exist, first is "Bearer"
- **Failure**: Malformed format → AUTH_INVALID error

#### Step 3: Decode JWT Structure
- **Action**: Split token on `.` to extract header, payload, signature
- **Expected Parts**: 3 (header.payload.signature)
- **Success**: Token has 3 Base64URL-encoded parts
- **Failure**: Invalid structure → AUTH_INVALID error

#### Step 4: Verify JWT Signature
- **Action**: Recompute HMAC-SHA256 signature using BETTER_AUTH_SECRET
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret Source**: Environment variable `BETTER_AUTH_SECRET`
- **Success**: Recomputed signature matches token signature
- **Failure**: Signature mismatch → AUTH_INVALID error

#### Step 5: Validate Token Expiry
- **Action**: Decode `exp` claim from payload, compare to current Unix timestamp
- **Success**: Current time < exp timestamp
- **Failure**: Current time >= exp → AUTH_EXPIRED error

#### Step 6: Extract Required Claims
- **Action**: Decode payload JSON, extract `user_id` and `email` claims
- **Required Claims**: `user_id` (string), `email` (string)
- **Success**: Both claims present and non-empty
- **Failure**: Missing claims → AUTH_INVALID error

#### Step 7: Enforce User ID Matching
- **Action**: Compare JWT `user_id` claim with URL path `user_id` parameter
- **Comparison**: Exact string match (case-sensitive)
- **Success**: JWT user_id == URL user_id
- **Failure**: Mismatch → AUTH_FORBIDDEN error

---

## Output Contract

### Success Case

**Condition**: All verification steps pass

**Output**: `AuthenticatedUser` object available to route handler

**Structure**:
```python
{
  "user_id": "user-abc123",  # From JWT payload
  "email": "user@example.com",  # From JWT payload
  "iat": 1675890000,  # Issued-at timestamp
  "exp": 1676494800   # Expiration timestamp
}
```

**FastAPI Dependency**:
```python
async def get_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    # current_user is populated by middleware
    # current_user["user_id"] == user_id (guaranteed)
    pass
```

### Failure Cases

All failures raise `HTTPException` with appropriate status code and error detail.

#### AUTH_MISSING

**Trigger**: No Authorization header in request

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Missing authentication token",
  "code": "AUTH_MISSING"
}
```

**Implementation**:
```python
raise HTTPException(
    status_code=401,
    detail={"error": "Missing authentication token", "code": "AUTH_MISSING"}
)
```

#### AUTH_INVALID

**Triggers**:
- Malformed Authorization header (not "Bearer <token>")
- Invalid JWT structure (not 3 parts)
- Invalid signature (HMAC verification fails)
- Missing required claims (user_id or email absent)

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid token signature",
  "code": "AUTH_INVALID"
}
```

**Implementation**:
```python
raise HTTPException(
    status_code=401,
    detail={"error": "Invalid token signature", "code": "AUTH_INVALID"}
)
```

#### AUTH_EXPIRED

**Trigger**: Token expiry time (exp) has passed

**HTTP Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Token expired",
  "code": "AUTH_EXPIRED"
}
```

**Implementation**:
```python
raise HTTPException(
    status_code=401,
    detail={"error": "Token expired", "code": "AUTH_EXPIRED"}
)
```

#### AUTH_FORBIDDEN

**Trigger**: Valid token but URL user_id doesn't match JWT user_id

**HTTP Response**:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden: Cannot access another user's resources",
  "code": "AUTH_FORBIDDEN"
}
```

**Implementation**:
```python
raise HTTPException(
    status_code=403,
    detail={
        "error": "Forbidden: Cannot access another user's resources",
        "code": "AUTH_FORBIDDEN"
    }
)
```

---

## Implementation Signature

### FastAPI Dependency Function

```python
from fastapi import Depends, HTTPException, Header, Path

async def get_current_user(
    authorization: str = Header(..., description="JWT token in 'Bearer <token>' format"),
    user_id: str = Path(..., description="User ID from URL path")
) -> dict:
    """
    Verify JWT token and enforce user_id matching.

    Args:
        authorization: Authorization header value
        user_id: User ID from URL path parameter

    Returns:
        dict: Authenticated user with user_id, email, iat, exp

    Raises:
        HTTPException: 401 for invalid/missing/expired tokens
        HTTPException: 403 for valid token with user_id mismatch
    """
    # Implementation follows verification steps above
    pass
```

### Route Application

**Protected Route Example**:
```python
@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[Task]:
    """
    Get all tasks for authenticated user.

    current_user is guaranteed to have:
    - user_id matching URL parameter
    - Valid, non-expired JWT token
    """
    return task_repository.get_all(current_user["user_id"])
```

---

## Configuration Contract

### Environment Variables

**Required**:
- `BETTER_AUTH_SECRET`: Shared secret for JWT signature verification
  - Type: String
  - Min Length: 32 characters (256 bits)
  - Format: Cryptographically secure random string
  - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
  - Security: Must match frontend BETTER_AUTH_SECRET exactly

**Optional**:
- `JWT_ALGORITHM`: JWT signing algorithm (default: "HS256")
- `JWT_CLOCK_SKEW`: Tolerance for expiry validation in seconds (default: 0)

---

## Security Requirements

### Mandatory Checks
1. ✅ Signature verification using BETTER_AUTH_SECRET
2. ✅ Expiry validation (reject if expired)
3. ✅ User ID matching (JWT user_id == URL user_id)
4. ✅ Required claims present (user_id, email)

### Forbidden Actions
1. ❌ Accept requests without Authorization header
2. ❌ Skip signature verification
3. ❌ Trust URL user_id without JWT validation
4. ❌ Allow cross-user access (user_id mismatch)
5. ❌ Log JWT tokens (sensitive data)

### Recommended Practices
- Use constant-time string comparison for user_id matching (prevent timing attacks)
- Log authentication failures (for monitoring)
- Do not log JWT token contents (sensitive)
- Cache BETTER_AUTH_SECRET in memory (avoid repeated env reads)

---

## Testing Contract

### Unit Test Cases

**Test 1: Valid Token, Matching User ID**
```python
def test_valid_token_matching_user():
    token = generate_jwt(user_id="user-123", email="test@example.com")
    result = get_current_user(f"Bearer {token}", user_id="user-123")
    assert result["user_id"] == "user-123"
```

**Test 2: Missing Authorization Header**
```python
def test_missing_auth_header():
    with pytest.raises(HTTPException) as exc:
        get_current_user(None, user_id="user-123")
    assert exc.value.status_code == 401
    assert exc.value.detail["code"] == "AUTH_MISSING"
```

**Test 3: Invalid Token Signature**
```python
def test_invalid_signature():
    token = generate_jwt_with_wrong_secret(user_id="user-123")
    with pytest.raises(HTTPException) as exc:
        get_current_user(f"Bearer {token}", user_id="user-123")
    assert exc.value.status_code == 401
    assert exc.value.detail["code"] == "AUTH_INVALID"
```

**Test 4: Expired Token**
```python
def test_expired_token():
    token = generate_expired_jwt(user_id="user-123")
    with pytest.raises(HTTPException) as exc:
        get_current_user(f"Bearer {token}", user_id="user-123")
    assert exc.value.status_code == 401
    assert exc.value.detail["code"] == "AUTH_EXPIRED"
```

**Test 5: User ID Mismatch**
```python
def test_user_id_mismatch():
    token = generate_jwt(user_id="user-123", email="test@example.com")
    with pytest.raises(HTTPException) as exc:
        get_current_user(f"Bearer {token}", user_id="user-456")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "AUTH_FORBIDDEN"
```

### Integration Test Cases

**Test 1: Full Authentication Flow**
- Login via Better Auth → Receive JWT
- Make API request with JWT
- Verify request succeeds with user data

**Test 2: Cross-User Access Prevention**
- Login as User A → Receive JWT for User A
- Attempt to access User B's resources
- Verify request fails with 403 Forbidden

**Test 3: Concurrent Requests**
- Make multiple simultaneous requests with same JWT
- Verify all succeed (no token interference)

---

## Performance Contract

### Latency Requirements

- **Target**: JWT verification adds < 10ms to API response time (from spec SC-003)
- **Breakdown**:
  - Header extraction: < 0.1ms
  - Token parsing: < 0.5ms
  - Signature verification (HMAC-SHA256): < 5ms
  - Expiry validation: < 0.1ms
  - User ID comparison: < 0.1ms

### Optimization Guidelines

- Cache BETTER_AUTH_SECRET in memory (avoid env reads per request)
- Use compiled regex for header parsing (if applicable)
- Leverage PyJWT's built-in optimizations
- Avoid unnecessary payload decoding (PyJWT does this once)

---

## Error Handling Contract

### Error Response Format

All authentication errors follow this schema:

```json
{
  "error": "Human-readable error message for debugging",
  "code": "MACHINE_READABLE_ERROR_CODE"
}
```

### Error Codes Registry

| Code            | HTTP Status | Description                              |
|-----------------|-------------|------------------------------------------|
| AUTH_MISSING    | 401         | No Authorization header provided         |
| AUTH_INVALID    | 401         | Invalid token signature or malformed     |
| AUTH_EXPIRED    | 401         | Token expiry time has passed             |
| AUTH_FORBIDDEN  | 403         | Valid token but user_id mismatch         |

### Frontend Error Handling

**401 Errors (AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED)**:
- Clear stored JWT token
- Redirect user to login page
- Display message: "Your session has expired. Please log in again."

**403 Errors (AUTH_FORBIDDEN)**:
- Keep JWT token (still valid)
- Display error message: "You don't have permission to access this resource."
- Do not redirect to login

---

## Contract Versioning

**Version**: 1.0.0
**Date**: 2026-02-08
**Stability**: Stable

**Breaking Changes**:
- Changing error response format
- Changing required JWT claims
- Changing signature algorithm

**Non-Breaking Changes**:
- Adding optional JWT claims
- Improving error messages
- Performance optimizations

---

**Contract Complete**: JWT middleware behavior fully specified. Ready for implementation.
