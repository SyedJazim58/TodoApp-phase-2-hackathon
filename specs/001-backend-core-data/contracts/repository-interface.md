# Repository Interface Contract

**Feature**: 001-backend-core-data
**Date**: 2026-02-08
**Purpose**: Define the data access interface for task operations with ownership enforcement

## Overview

The TaskRepository provides a clean abstraction over database operations with built-in user_id filtering. All methods require explicit user_id parameter, ensuring ownership verification happens at the query construction level.

**Key Principle**: Repository methods return None for ownership failures (not found OR wrong owner), allowing the caller to handle as appropriate (typically 404 response).

## Interface Definition

### TaskRepository Class

```python
from typing import Optional, List
from sqlmodel import Session
from models.task import Task, TaskCreate, TaskUpdate
from datetime import datetime

class TaskRepository:
    """
    Data access layer for Task entity with ownership enforcement.

    All queries filter by user_id at construction level to prevent
    accidental data leakage. Returns None when task not found or
    ownership verification fails.
    """

    def __init__(self, session: Session):
        """
        Initialize repository with database session.

        Args:
            session: SQLModel database session (from dependency injection)
        """
        self.session = session

    def create(self, user_id: str, task_data: TaskCreate) -> Task:
        """
        Create a new task for the authenticated user.

        Args:
            user_id: Authenticated user's identifier
            task_data: Task creation data (title, description, completed)

        Returns:
            Task: Created task with id and timestamps populated

        Raises:
            DatabaseError: If database operation fails
        """
        pass

    def get_by_id(self, user_id: str, task_id: int) -> Optional[Task]:
        """
        Retrieve a single task by ID with ownership verification.

        Query filters by BOTH task_id AND user_id. Returns None if task
        doesn't exist OR belongs to a different user (no distinguishing).

        Args:
            user_id: Authenticated user's identifier
            task_id: Task identifier

        Returns:
            Task if found and owned by user, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        pass

    def get_all(self, user_id: str) -> List[Task]:
        """
        Retrieve all tasks for the authenticated user.

        Returns only tasks where task.user_id == user_id. Never returns
        tasks belonging to other users.

        Args:
            user_id: Authenticated user's identifier

        Returns:
            List of tasks (empty list if user has no tasks)

        Raises:
            DatabaseError: If database operation fails
        """
        pass

    def update(self, user_id: str, task_id: int, task_data: TaskUpdate) -> Optional[Task]:
        """
        Update a task with ownership verification.

        Fetches task with ownership check, applies updates, refreshes
        updated_at timestamp. Returns None if task not found or owned
        by different user.

        Args:
            user_id: Authenticated user's identifier
            task_id: Task identifier
            task_data: Task update data (any field can be None)

        Returns:
            Updated task if found and owned by user, None otherwise

        Raises:
            DatabaseError: If database operation fails

        Notes:
            - user_id is immutable (cannot be changed)
            - id is immutable (cannot be changed)
            - created_at is immutable (never modified)
            - updated_at is automatically refreshed
        """
        pass

    def toggle_complete(self, user_id: str, task_id: int) -> Optional[Task]:
        """
        Toggle task completion status with ownership verification.

        Convenience method that flips completed boolean. Returns None
        if task not found or owned by different user.

        Args:
            user_id: Authenticated user's identifier
            task_id: Task identifier

        Returns:
            Updated task with flipped completed status, None if not found/authorized

        Raises:
            DatabaseError: If database operation fails
        """
        pass

    def delete(self, user_id: str, task_id: int) -> bool:
        """
        Delete a task with ownership verification.

        Hard delete (permanent removal). Returns False if task not found
        or owned by different user.

        Args:
            user_id: Authenticated user's identifier
            task_id: Task identifier

        Returns:
            True if task was deleted, False if not found/not authorized

        Raises:
            DatabaseError: If database operation fails
        """
        pass
```

## Method Contracts

### create()

**Preconditions**:
- user_id must be non-empty string
- task_data must pass Pydantic validation

**Postconditions**:
- New task exists in database with generated id
- task.user_id == provided user_id
- task.created_at and task.updated_at are set to current UTC time
- task.completed defaults to False if not specified

**Error Conditions**:
- Raises DatabaseError if database operation fails
- Pydantic validation error if task_data invalid (handled before method call)

### get_by_id()

**Preconditions**:
- user_id must be non-empty string
- task_id must be positive integer

**Postconditions**:
- Returns Task if exists AND task.user_id == user_id
- Returns None if task doesn't exist
- Returns None if task exists but task.user_id != user_id

**Security Note**: Caller cannot distinguish between "not found" and "unauthorized" - both return None. This prevents task ID enumeration.

**Error Conditions**:
- Raises DatabaseError if database query fails

### get_all()

**Preconditions**:
- user_id must be non-empty string

**Postconditions**:
- Returns list of Task objects where ALL tasks have task.user_id == user_id
- Returns empty list if user has no tasks
- Never returns tasks belonging to other users

**Performance Note**: Query filtered at database level, not in application code after retrieval.

**Error Conditions**:
- Raises DatabaseError if database query fails

### update()

**Preconditions**:
- user_id must be non-empty string
- task_id must be positive integer
- task_data must pass Pydantic validation (if fields provided)

**Postconditions**:
- If successful (returns Task):
  - Task fields updated per task_data (only provided fields)
  - task.updated_at refreshed to current UTC time
  - task.user_id unchanged (immutable)
  - task.id unchanged (immutable)
  - task.created_at unchanged (immutable)
- If unsuccessful (returns None):
  - No database modifications

**Error Conditions**:
- Returns None if task not found or not owned by user
- Raises DatabaseError if database operation fails

### toggle_complete()

**Preconditions**:
- user_id must be non-empty string
- task_id must be positive integer

**Postconditions**:
- If successful (returns Task):
  - task.completed = !task.completed (flipped)
  - task.updated_at refreshed to current UTC time
  - All other fields unchanged
- If unsuccessful (returns None):
  - No database modifications

**Error Conditions**:
- Returns None if task not found or not owned by user
- Raises DatabaseError if database operation fails

### delete()

**Preconditions**:
- user_id must be non-empty string
- task_id must be positive integer

**Postconditions**:
- If successful (returns True):
  - Task permanently removed from database
  - Subsequent queries for task_id return None
- If unsuccessful (returns False):
  - No database modifications
  - Task either doesn't exist or not owned by user

**Error Conditions**:
- Returns False if task not found or not owned by user
- Raises DatabaseError if database operation fails

## Query Patterns

All repository methods use these filtering patterns:

### Single Task with Ownership Check
```python
from sqlmodel import select

statement = select(Task).where(
    Task.id == task_id,
    Task.user_id == user_id
)
task = self.session.exec(statement).first()
```

**Security**: Combines existence check and ownership check in single query, preventing timing attacks.

### All User's Tasks
```python
from sqlmodel import select

statement = select(Task).where(Task.user_id == user_id)
tasks = self.session.exec(statement).all()
```

**Performance**: Relies on user_id index for efficient filtering.

## Exception Handling

### DatabaseError

Custom exception for database operation failures:

```python
class DatabaseError(Exception):
    """Raised when database operation fails"""

    def __init__(self, operation: str, original_exception: Exception):
        self.operation = operation
        self.original_exception = original_exception
        super().__init__(f"Database error during {operation}")
```

**When Raised**:
- Connection failures
- Query execution errors
- Transaction commit failures

**What NOT to Include**:
- Stack traces
- SQL query text
- Table/column names
- Internal implementation details

### ResourceNotFoundError

Used by service layer (not repository):

```python
class ResourceNotFoundError(Exception):
    """Raised when resource not found or unauthorized"""

    def __init__(self, resource_id: int):
        self.resource_id = resource_id
        super().__init__(f"Resource not found: {resource_id}")
```

## Dependency Injection

Repository receives session via FastAPI dependency injection:

```python
from fastapi import Depends
from sqlmodel import Session
from database.connection import get_session

def get_task_repository(session: Session = Depends(get_session)) -> TaskRepository:
    """Dependency that provides TaskRepository with database session"""
    return TaskRepository(session)

# Usage in route
@app.get("/tasks")
def get_tasks(
    user_id: str,  # From auth middleware
    repo: TaskRepository = Depends(get_task_repository)
):
    return repo.get_all(user_id)
```

## Testing Contract

Repository tests must verify:

1. **Ownership Filtering**: User A cannot access User B's tasks
2. **Create**: Task persisted with correct user_id
3. **Read**: get_by_id returns None for wrong user_id
4. **Update**: Returns None when attempting to update another user's task
5. **Delete**: Returns False when attempting to delete another user's task
6. **Query Filtering**: get_all returns only user's tasks, never leaks other users' data
7. **Timestamp Management**: created_at immutable, updated_at refreshed on modifications

## Notes

- Repository does NOT handle HTTP concerns (status codes, request/response formats)
- Repository does NOT perform authentication (receives trusted user_id)
- Repository DOES enforce authorization (ownership verification)
- Repository methods are synchronous (not async) - FastAPI will run in thread pool
- All timestamps use UTC timezone
- Transaction management handled by session context (caller's responsibility)
