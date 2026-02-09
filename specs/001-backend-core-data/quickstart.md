# Quickstart Guide: Backend Core & Data Layer

**Feature**: 001-backend-core-data
**Date**: 2026-02-08
**Audience**: Developers implementing or integrating with the backend core data layer

## Overview

This guide provides step-by-step instructions to set up, implement, and test the backend core data layer for task management with strict user ownership enforcement.

**What This Layer Provides**:
- Task data model (SQLModel)
- Database connection to Neon Serverless PostgreSQL
- Repository pattern with ownership verification
- Exception handling for consistent error responses

**What This Layer Does NOT Provide**:
- REST API endpoints (separate feature)
- Authentication or JWT verification (separate feature)
- Frontend integration (separate feature)

## Prerequisites

Before starting, ensure you have:

1. **Python 3.11+** installed
2. **Neon PostgreSQL account** with database created
3. **Database connection string** from Neon dashboard
4. **Git** for version control
5. **Virtual environment tool** (venv or conda)

## Project Setup

### 1. Create Project Structure

```bash
# Navigate to project root
cd /path/to/TodoApp-phase-2

# Create backend directory structure
mkdir -p backend/src/{models,database,repositories,exceptions}
mkdir -p backend/tests
mkdir -p database/schema

# Create __init__.py files
touch backend/src/__init__.py
touch backend/src/models/__init__.py
touch backend/src/database/__init__.py
touch backend/src/repositories/__init__.py
touch backend/src/exceptions/__init__.py
touch backend/tests/__init__.py
```

### 2. Install Dependencies

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install core dependencies
pip install fastapi==0.109.0
pip install sqlmodel==0.0.14
pip install psycopg2-binary==2.9.9
pip install python-dotenv==1.0.0

# Install dev dependencies
pip install pytest==7.4.3
pip install pytest-cov==4.1.0

# Save dependencies
pip freeze > requirements.txt
```

### 3. Configure Environment

Create `.env` file in `backend/` directory:

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
LOG_LEVEL=INFO
```

**Security Note**: Add `.env` to `.gitignore` - never commit credentials!

Create `.env.example` as template:

```bash
# backend/.env.example
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
LOG_LEVEL=INFO
```

## Implementation Steps

### Step 1: Create Database Schema

**File**: `database/schema/001_initial_schema.sql`

```sql
-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient user-scoped queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_id_id ON tasks(user_id, id);

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks';
```

**Execute Schema**:

```bash
# Using psql (install PostgreSQL client tools)
psql $DATABASE_URL -f database/schema/001_initial_schema.sql

# Verify table created
psql $DATABASE_URL -c "\d tasks"
```

### Step 2: Implement Task Model

**File**: `backend/src/models/task.py`

See `data-model.md` for complete SQLModel definition. Key points:

- `Task`: Database table model with all fields
- `TaskCreate`: Pydantic schema for creation (excludes id, timestamps)
- `TaskUpdate`: Pydantic schema for updates (all fields optional)
- `TaskRead`: Response schema with all fields

### Step 3: Implement Database Connection

**File**: `backend/src/database/connection.py`

```python
from sqlmodel import create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine with connection pooling for serverless PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # Small pool for serverless database
    max_overflow=10,       # Burst capacity
    pool_pre_ping=True,    # Validate connections (handles cold starts)
    echo=False             # Set True for SQL query logging during dev
)

def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides database session.

    Yields:
        Session: SQLModel database session

    Usage:
        @app.get("/tasks")
        def get_tasks(session: Session = Depends(get_session)):
            ...
    """
    with Session(engine) as session:
        yield session
```

### Step 4: Implement Custom Exceptions

**File**: `backend/src/exceptions/__init__.py`

See `contracts/exceptions.md` for complete exception definitions:

- `DatabaseError`: Wraps database failures
- `ResourceNotFoundError`: Indicates not found or unauthorized

### Step 5: Implement Task Repository

**File**: `backend/src/repositories/task_repository.py`

See `contracts/repository-interface.md` for complete repository interface. Implement all methods:

- `create(user_id, task_data)`
- `get_by_id(user_id, task_id)`
- `get_all(user_id)`
- `update(user_id, task_id, task_data)`
- `toggle_complete(user_id, task_id)`
- `delete(user_id, task_id)`

**Key Implementation Points**:
- All queries filter by user_id
- Return None for ownership failures
- Wrap exceptions in DatabaseError
- Refresh updated_at on modifications

## Testing

### Unit Tests

**File**: `backend/tests/test_task_repository.py`

```python
import pytest
from sqlmodel import Session, create_engine, SQLModel
from repositories.task_repository import TaskRepository
from models.task import Task, TaskCreate, TaskUpdate

@pytest.fixture
def db_session():
    """Provide in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
        session.rollback()

@pytest.fixture
def task_repo(db_session):
    """Provide TaskRepository with test session"""
    return TaskRepository(db_session)

def test_create_task(task_repo):
    """Verify task creation with user_id"""
    task_data = TaskCreate(title="Test task", description="Test", completed=False)
    task = task_repo.create("user123", task_data)

    assert task.id is not None
    assert task.user_id == "user123"
    assert task.title == "Test task"
    assert task.completed is False

def test_get_by_id_ownership_filter(task_repo):
    """Verify user A cannot access user B's task"""
    # User A creates task
    task_data = TaskCreate(title="User A's task")
    task = task_repo.create("userA", task_data)

    # User B attempts to access
    result = task_repo.get_by_id("userB", task.id)

    assert result is None  # Ownership filter prevents access

def test_get_all_filters_by_user(task_repo):
    """Verify get_all returns only user's tasks"""
    # Create tasks for different users
    task_repo.create("userA", TaskCreate(title="Task A1"))
    task_repo.create("userA", TaskCreate(title="Task A2"))
    task_repo.create("userB", TaskCreate(title="Task B1"))

    # Query User A's tasks
    tasks_a = task_repo.get_all("userA")
    tasks_b = task_repo.get_all("userB")

    assert len(tasks_a) == 2
    assert len(tasks_b) == 1
    assert all(t.user_id == "userA" for t in tasks_a)
```

### Run Tests

```bash
cd backend
pytest tests/ -v --cov=src
```

## Verification Checklist

After implementation, verify:

- [ ] Database schema created with correct indexes
- [ ] Environment variables configured
- [ ] All repository methods implemented
- [ ] Exception handlers defined
- [ ] Unit tests pass with >90% coverage
- [ ] Cross-user isolation tests pass
- [ ] Ownership verification returns None for wrong user
- [ ] Timestamps (created_at, updated_at) managed correctly
- [ ] Database connections pool properly (check logs)

## Integration with REST API (Future)

This data layer will be consumed by REST API endpoints:

```python
from fastapi import FastAPI, Depends, HTTPException
from repositories.task_repository import TaskRepository
from database.connection import get_session
from models.task import TaskCreate, TaskRead
from exceptions import ResourceNotFoundError

app = FastAPI()

def get_task_repository(session: Session = Depends(get_session)) -> TaskRepository:
    return TaskRepository(session)

@app.post("/api/{user_id}/tasks", response_model=TaskRead)
def create_task(
    user_id: str,  # Will come from JWT token in real implementation
    task_data: TaskCreate,
    repo: TaskRepository = Depends(get_task_repository)
):
    """Create a new task for authenticated user"""
    try:
        task = repo.create(user_id, task_data)
        return task
    except DatabaseError:
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/api/{user_id}/tasks", response_model=list[TaskRead])
def get_tasks(
    user_id: str,  # Will come from JWT token in real implementation
    repo: TaskRepository = Depends(get_task_repository)
):
    """Get all tasks for authenticated user"""
    try:
        return repo.get_all(user_id)
    except DatabaseError:
        raise HTTPException(status_code=503, detail="Service unavailable")
```

**Note**: Full REST API implementation with JWT verification is a separate feature.

## Common Issues & Troubleshooting

### Issue: Database Connection Fails

**Symptom**: `psycopg2.OperationalError: could not connect to server`

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:password@host/db?sslmode=require`
2. Check Neon dashboard for correct host and credentials
3. Ensure `sslmode=require` is included (Neon requires SSL)
4. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### Issue: Cold Start Latency

**Symptom**: First request after idle period is slow

**Solutions**:
1. Verify `pool_pre_ping=True` in engine configuration
2. Consider connection pooler (PgBouncer) for production
3. Accept cold start latency as normal for serverless databases

### Issue: Tests Fail with "table does not exist"

**Symptom**: `sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such table: tasks`

**Solutions**:
1. Ensure `SQLModel.metadata.create_all(engine)` in test fixture
2. Verify Task model imports correctly
3. Check that Task class has `table=True` parameter

### Issue: Cross-user Data Leakage in Tests

**Symptom**: User B can see User A's tasks

**Solutions**:
1. Verify repository queries include `.where(Task.user_id == user_id)`
2. Check test assertions verify correct user_id on returned tasks
3. Ensure test creates tasks with different user_ids

## Next Steps

After completing this data layer:

1. **Implement REST API Endpoints**: Create FastAPI routes that consume this repository
2. **Add JWT Verification**: Implement authentication middleware that extracts user_id from tokens
3. **Frontend Integration**: Build Next.js frontend that calls these API endpoints
4. **Deployment**: Containerize backend and deploy to cloud platform

## Resources

- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [Pydantic Validation](https://docs.pydantic.dev/)
- [pytest Documentation](https://docs.pytest.org/)

## Support

For issues specific to this implementation:
1. Review `spec.md` for requirements
2. Check `data-model.md` for entity definitions
3. Consult `contracts/` directory for interface specifications
4. Review test cases in `tests/` directory
