"""
Pytest fixtures for backend core data layer tests.

This module provides reusable test fixtures for database sessions,
user contexts, and repository instances. Uses SQLite in-memory
database for fast, isolated unit tests.
"""

import pytest
import os
from sqlmodel import Session, create_engine, SQLModel
from typing import Generator
from dotenv import load_dotenv

# Load environment variables at test initialization
load_dotenv()

# Ensure BETTER_AUTH_SECRET is set for JWT tests
if not os.getenv("BETTER_AUTH_SECRET"):
    os.environ["BETTER_AUTH_SECRET"] = "test_secret_key_minimum_32_characters_long_for_testing"


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """
    Provide in-memory SQLite database session for testing.

    Creates a new in-memory database for each test, ensuring complete
    isolation. All tables are created before the test and dropped after.

    Yields:
        Session: SQLModel database session with transaction rollback

    Usage:
        def test_something(db_session):
            # Use db_session for database operations
            pass
    """
    # Create in-memory SQLite engine for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    # Provide session with automatic rollback
    with Session(engine) as session:
        yield session
        # Rollback happens automatically on context exit


@pytest.fixture
def user_a_id() -> str:
    """
    Provide User A's identifier for testing.

    Returns:
        str: User A's identifier
    """
    return "test-user-a"


@pytest.fixture
def user_b_id() -> str:
    """
    Provide User B's identifier for testing.

    Returns:
        str: User B's identifier
    """
    return "test-user-b"


@pytest.fixture
def task_repository(db_session: Session):
    """
    Provide TaskRepository instance with test session.

    Args:
        db_session: Test database session

    Returns:
        TaskRepository: Repository instance for testing

    Usage:
        def test_create_task(task_repository, user_a_id):
            task = task_repository.create(user_a_id, task_data)
            assert task.user_id == user_a_id
    """
    from src.repositories.task_repository import TaskRepository
    return TaskRepository(db_session)
