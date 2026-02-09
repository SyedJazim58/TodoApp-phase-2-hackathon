# Exception Handling Contract

**Feature**: 001-backend-core-data
**Date**: 2026-02-08
**Purpose**: Define exception hierarchy and HTTP error mapping for consistent error handling

## Exception Hierarchy

```
Exception (Python built-in)
├── DatabaseError (custom)
│   └── Used for: Connection failures, query errors, transaction failures
├── ResourceNotFoundError (custom)
│   └── Used for: Ownership verification failures, non-existent resources
└── ValidationError (Pydantic built-in)
    └── Used for: Request payload validation failures
```

## Custom Exceptions

### DatabaseError

**Purpose**: Wraps database operation failures to prevent implementation detail leakage.

**Definition**:
```python
class DatabaseError(Exception):
    """
    Raised when database operation fails.

    Wraps original exception but does NOT expose it to HTTP responses.
    Logged for debugging but clients receive generic error message.
    """

    def __init__(self, operation: str, original_exception: Exception):
        """
        Args:
            operation: High-level operation name (e.g., "create_task", "query_tasks")
            original_exception: Original exception from database layer
        """
        self.operation = operation
        self.original_exception = original_exception
        super().__init__(f"Database error during {operation}")
```

**When to Raise**:
- SQLAlchemy query execution fails
- Database connection pool exhausted
- Transaction commit/rollback fails
- Connection timeout or network errors

**What Gets Logged** (server-side only):
- operation name
- original_exception type and message
- stack trace

**What Client Receives**:
- HTTP 503 Service Unavailable
- Generic message: "Service temporarily unavailable"
- No internal details

### ResourceNotFoundError

**Purpose**: Indicates resource not found or unauthorized access (ownership failure).

**Definition**:
```python
class ResourceNotFoundError(Exception):
    """
    Raised when resource not found or ownership verification fails.

    Intentionally ambiguous - does not distinguish between:
    - Resource doesn't exist
    - Resource exists but belongs to different user

    This prevents task ID enumeration attacks.
    """

    def __init__(self, resource_type: str, resource_id: int):
        """
        Args:
            resource_type: Type of resource (e.g., "task")
            resource_id: Identifier of resource
        """
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} not found: {resource_id}")
```

**When to Raise**:
- Repository method returns None (task not found or wrong owner)
- Caller interprets None as "not found for this user"

**What Gets Logged** (server-side only):
- resource_type and resource_id
- user_id who attempted access (from request context)

**What Client Receives**:
- HTTP 404 Not Found
- Generic message: "Task not found"
- No indication whether task exists for another user

## HTTP Error Mapping

### FastAPI Exception Handlers

```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from exceptions import DatabaseError, ResourceNotFoundError
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundError):
    """
    Map ResourceNotFoundError to 404 with generic message.

    Security: Does not reveal whether resource exists for another user.
    """
    logger.info(
        f"Resource not found: {exc.resource_type} {exc.resource_id}, "
        f"path: {request.url.path}"
    )

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": f"{exc.resource_type.capitalize()} not found"}
    )

@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    """
    Map DatabaseError to 503 with generic message.

    Security: Does not expose database details, table names, or query structure.
    """
    logger.error(
        f"Database error during {exc.operation}: {exc.original_exception}",
        exc_info=exc.original_exception
    )

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Service temporarily unavailable"}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for unexpected exceptions.

    Security: Never exposes stack traces or internal details to clients.
    """
    logger.error(f"Unexpected error: {exc}", exc_info=exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
```

## HTTP Status Code Mapping

| Exception Type | HTTP Status | Response Body | Security Note |
|----------------|-------------|---------------|---------------|
| ResourceNotFoundError | 404 Not Found | `{"detail": "Task not found"}` | Generic message prevents enumeration |
| DatabaseError | 503 Service Unavailable | `{"detail": "Service temporarily unavailable"}` | No database details exposed |
| ValidationError (Pydantic) | 422 Unprocessable Entity | `{"detail": [...validation errors...]}` | FastAPI default handler |
| AuthenticationError | 401 Unauthorized | `{"detail": "Authentication required"}` | Handled by auth middleware |
| Generic Exception | 500 Internal Server Error | `{"detail": "Internal server error"}` | No stack trace or details |

## Error Response Schema

All error responses follow consistent JSON structure:

```json
{
  "detail": "Human-readable error message"
}
```

**For validation errors (422), FastAPI provides extended format**:
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Repository Error Handling Pattern

Repository methods wrap database operations to catch and re-raise as DatabaseError:

```python
from sqlmodel import select
from exceptions import DatabaseError

def get_by_id(self, user_id: str, task_id: int) -> Optional[Task]:
    try:
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        task = self.session.exec(statement).first()
        return task
    except Exception as e:
        # Log original exception with full context
        logger.error(f"Database error in get_by_id: {e}", exc_info=e)
        # Raise wrapped exception (hides implementation details from caller)
        raise DatabaseError("get_task_by_id", e)
```

## Service Layer Error Handling Pattern

Service layer interprets repository results and raises domain exceptions:

```python
from exceptions import ResourceNotFoundError

def update_task(user_id: str, task_id: int, update_data: TaskUpdate) -> Task:
    """
    Update task with ownership verification.

    Raises:
        ResourceNotFoundError: If task not found or owned by different user
        DatabaseError: If database operation fails (propagated from repository)
    """
    task = self.repository.update(user_id, task_id, update_data)

    if task is None:
        # Repository returned None = not found OR wrong owner
        # Don't distinguish in exception message
        raise ResourceNotFoundError("task", task_id)

    return task
```

## Logging Strategy

### What to Log

**For ResourceNotFoundError (INFO level)**:
- Resource type and ID
- User ID who attempted access
- Request path
- Timestamp

**For DatabaseError (ERROR level)**:
- Operation name
- Original exception type and message
- Full stack trace (exc_info=True)
- User ID (if available)
- Request context

**For Generic Exceptions (ERROR level)**:
- Exception type and message
- Full stack trace
- Request context

### What NOT to Log

- Sensitive user data (passwords, tokens, PII)
- Database connection strings or credentials
- Raw SQL queries (may contain sensitive filters)

### Log Format

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Example log entries:
# INFO - Resource not found: task 42, user: user123, path: /api/tasks/42
# ERROR - Database error during update_task: connection timeout
```

## Security Principles

### 1. No Information Leakage

**Bad** (reveals task existence):
```json
{
  "detail": "You don't have permission to access this task"
}
```

**Good** (ambiguous):
```json
{
  "detail": "Task not found"
}
```

### 2. Consistent Timing

Both "task doesn't exist" and "task belongs to another user" should take similar time:

- Use single query with combined filters: `.where(Task.id == id, Task.user_id == user_id)`
- Don't check existence first, then ownership (two queries = timing difference)

### 3. Generic Error Messages

Never expose:
- Stack traces
- SQL query text
- Table or column names
- Database connection details
- Internal implementation details

### 4. Appropriate Status Codes

- **401 Unauthorized**: Missing or invalid authentication token (handled by auth middleware, not this layer)
- **403 Forbidden**: NEVER use - reveals resource existence
- **404 Not Found**: Use for ownership failures (prevents enumeration)
- **422 Unprocessable Entity**: Validation errors (Pydantic handles this)
- **500 Internal Server Error**: Unexpected exceptions
- **503 Service Unavailable**: Database/infrastructure failures

## Testing Exception Handling

Test cases must verify:

1. **DatabaseError Mapping**: Simulate connection failure → verify 503 response with generic message
2. **ResourceNotFoundError Mapping**: Call with wrong user_id → verify 404 response, no details leaked
3. **Generic Exception Mapping**: Raise unexpected exception → verify 500 response, no stack trace in body
4. **Validation Error**: Send invalid payload → verify 422 with validation details
5. **Logging**: Verify errors logged with appropriate detail level (INFO for 404, ERROR for 503/500)
6. **Timing Consistency**: Verify "not found" and "wrong owner" have similar response times

## Notes

- Authentication errors (401) are handled by separate auth middleware, not by this data layer
- Repository layer does NOT raise HTTP exceptions (HTTPException) - keeps data layer decoupled from HTTP layer
- Service layer translates domain exceptions to business logic failures
- FastAPI exception handlers translate to HTTP responses
- All exception messages are deliberately generic to prevent information disclosure
