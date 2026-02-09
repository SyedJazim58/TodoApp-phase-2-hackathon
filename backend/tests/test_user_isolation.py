"""
Integration tests for cross-user data isolation.

Tests verify that users cannot access, modify, or delete another user's resources
even with valid JWT tokens.
"""

import pytest
import jwt
import os
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from src.main import app
from src.database.connection import get_session
from src.models.task import Task, TaskCreate
from src.repositories.task_repository import TaskRepository


def generate_test_token(user_id: str, email: str) -> str:
    """Generate a test JWT token for a user."""
    secret = os.getenv("BETTER_AUTH_SECRET")
    now = datetime.utcnow()

    payload = {
        "user_id": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp())
    }

    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session with in-memory SQLite."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with database session override."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestCrossUserDataIsolation:
    """Test suite for cross-user data access prevention."""

    def test_cross_user_get_attempt_returns_403(self, client: TestClient, session: Session):
        """Test that user A cannot GET user B's tasks."""
        # Create a task for user B
        repo = TaskRepository(session)
        task_b = repo.create("user-b", TaskCreate(title="User B's task", description="Private"))
        session.commit()

        # User A tries to access user B's tasks
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        response = client.get("/api/user-b/tasks", headers=headers)

        assert response.status_code == 403
        assert response.json()["code"] == "AUTH_FORBIDDEN"
        assert "cannot access another user" in response.json()["error"].lower()

    def test_cross_user_post_attempt_returns_403(self, client: TestClient, session: Session):
        """Test that user A cannot POST tasks to user B's collection."""
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        task_data = {"title": "Malicious task", "description": "Trying to create in user B's space"}

        response = client.post("/api/user-b/tasks", json=task_data, headers=headers)

        assert response.status_code == 403
        assert response.json()["code"] == "AUTH_FORBIDDEN"

    def test_cross_user_put_attempt_returns_403(self, client: TestClient, session: Session):
        """Test that user A cannot PUT (update) user B's tasks."""
        # Create a task for user B
        repo = TaskRepository(session)
        task_b = repo.create("user-b", TaskCreate(title="User B's task"))
        session.commit()

        # User A tries to update user B's task
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        update_data = {"title": "Hijacked task", "completed": True}

        response = client.put(f"/api/user-b/tasks/{task_b.id}", json=update_data, headers=headers)

        assert response.status_code == 403
        assert response.json()["code"] == "AUTH_FORBIDDEN"

        # Verify task was NOT modified
        session.refresh(task_b)
        assert task_b.title == "User B's task"
        assert task_b.completed == False

    def test_cross_user_delete_attempt_returns_403(self, client: TestClient, session: Session):
        """Test that user A cannot DELETE user B's tasks."""
        # Create a task for user B
        repo = TaskRepository(session)
        task_b = repo.create("user-b", TaskCreate(title="User B's task"))
        session.commit()
        task_id = task_b.id

        # User A tries to delete user B's task
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        response = client.delete(f"/api/user-b/tasks/{task_id}", headers=headers)

        assert response.status_code == 403
        assert response.json()["code"] == "AUTH_FORBIDDEN"

        # Verify task still exists
        existing_task = session.get(Task, task_id)
        assert existing_task is not None
        assert existing_task.title == "User B's task"

    def test_user_can_access_own_tasks(self, client: TestClient, session: Session):
        """Test that users can access their own tasks (positive test case)."""
        # Create a task for user A
        repo = TaskRepository(session)
        task_a = repo.create("user-a", TaskCreate(title="User A's task"))
        session.commit()

        # User A accesses their own tasks
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        response = client.get("/api/user-a/tasks", headers=headers)

        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["title"] == "User A's task"
        assert tasks[0]["user_id"] == "user-a"

    def test_user_can_update_own_task(self, client: TestClient, session: Session):
        """Test that users can update their own tasks (positive test case)."""
        # Create a task for user A
        repo = TaskRepository(session)
        task_a = repo.create("user-a", TaskCreate(title="Original title"))
        session.commit()

        # User A updates their own task
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        update_data = {"title": "Updated title", "completed": True}

        response = client.put(f"/api/user-a/tasks/{task_a.id}", json=update_data, headers=headers)

        assert response.status_code == 200
        updated_task = response.json()
        assert updated_task["title"] == "Updated title"
        assert updated_task["completed"] == True

    def test_user_can_delete_own_task(self, client: TestClient, session: Session):
        """Test that users can delete their own tasks (positive test case)."""
        # Create a task for user A
        repo = TaskRepository(session)
        task_a = repo.create("user-a", TaskCreate(title="Task to delete"))
        session.commit()
        task_id = task_a.id

        # User A deletes their own task
        token_a = generate_test_token("user-a", "usera@example.com")
        headers = {"Authorization": f"Bearer {token_a}"}

        response = client.delete(f"/api/user-a/tasks/{task_id}", headers=headers)

        assert response.status_code == 204

        # Verify task is deleted
        deleted_task = session.get(Task, task_id)
        assert deleted_task is None

    def test_missing_token_returns_401_not_403(self, client: TestClient):
        """Test that missing tokens return 401, not 403 (authentication vs authorization)."""
        # No Authorization header provided
        response = client.get("/api/user-a/tasks")

        assert response.status_code == 401
        assert response.json()["code"] == "AUTH_MISSING"

    def test_invalid_token_returns_401_not_403(self, client: TestClient):
        """Test that invalid tokens return 401, not 403."""
        headers = {"Authorization": "Bearer invalid.token.here"}

        response = client.get("/api/user-a/tasks", headers=headers)

        assert response.status_code == 401
        assert response.json()["code"] == "AUTH_INVALID"

    def test_expired_token_returns_401_not_403(self, client: TestClient):
        """Test that expired tokens return 401, not 403."""
        # Generate expired token for user-a (expired 1 hour ago)
        secret = os.getenv("BETTER_AUTH_SECRET")
        now = datetime.utcnow()
        payload = {
            "user_id": "user-a",
            "email": "usera@example.com",
            "iat": int(now.timestamp()),
            "exp": int((now - timedelta(hours=1)).timestamp())  # Expired 1 hour ago
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/user-a/tasks", headers=headers)

        assert response.status_code == 401
        assert response.json()["code"] == "AUTH_EXPIRED"
