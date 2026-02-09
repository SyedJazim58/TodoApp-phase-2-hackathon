"""
Unit tests for Task model validation and behavior.

Tests cover:
- Task creation with all fields
- Task creation with minimal fields (title only)
- Validation failures (title too long, invalid types)
- Default values (completed=False, timestamps auto-set)
"""

import pytest
from datetime import datetime
from src.models.task import Task, TaskCreate, TaskUpdate
from pydantic import ValidationError
from sqlmodel import Session, create_engine, SQLModel


def test_task_creation_with_all_fields():
    """Test creating a task with all fields populated."""
    task = Task(
        user_id="user123",
        title="Buy groceries",
        description="Milk, bread, eggs",
        completed=False
    )

    assert task.user_id == "user123"
    assert task.title == "Buy groceries"
    assert task.description == "Milk, bread, eggs"
    assert task.completed is False
    assert task.created_at is not None
    assert task.updated_at is not None
    assert isinstance(task.created_at, datetime)
    assert isinstance(task.updated_at, datetime)


def test_task_creation_with_minimal_fields():
    """Test creating a task with only required fields (title and user_id)."""
    task = Task(
        user_id="user123",
        title="Minimal task"
    )

    assert task.user_id == "user123"
    assert task.title == "Minimal task"
    assert task.description is None
    assert task.completed is False  # Default value
    assert task.created_at is not None
    assert task.updated_at is not None


def test_task_create_schema():
    """Test TaskCreate schema for API requests."""
    task_create = TaskCreate(
        title="New task",
        description="Task description",
        completed=False
    )

    assert task_create.title == "New task"
    assert task_create.description == "Task description"
    assert task_create.completed is False


def test_task_update_schema_all_fields_optional():
    """Test TaskUpdate schema allows all fields to be optional."""
    task_update = TaskUpdate()

    assert task_update.title is None
    assert task_update.description is None
    assert task_update.completed is None

    task_update = TaskUpdate(title="Updated title")
    assert task_update.title == "Updated title"
    assert task_update.description is None
    assert task_update.completed is None


def test_task_title_validation_too_long():
    """Test that title exceeding 500 characters fails validation."""
    long_title = "x" * 501

    with pytest.raises(ValidationError) as exc_info:
        Task.model_validate({"user_id": "user123", "title": long_title})

    assert "title" in str(exc_info.value).lower()


def test_task_title_validation_empty():
    """Test that empty title fails validation (min_length=1)."""
    with pytest.raises(ValidationError) as exc_info:
        Task.model_validate({"user_id": "user123", "title": ""})

    assert "title" in str(exc_info.value).lower()


def test_task_title_required():
    """Test that title is required."""
    with pytest.raises(ValidationError) as exc_info:
        Task.model_validate({"user_id": "user123"})

    assert "title" in str(exc_info.value).lower()


def test_task_user_id_required():
    """Test that user_id is required."""
    with pytest.raises(ValidationError) as exc_info:
        Task.model_validate({"title": "Test task"})

    assert "user_id" in str(exc_info.value).lower()


def test_task_completed_default_value():
    """Test that completed defaults to False."""
    task = Task(user_id="user123", title="Test task")

    assert task.completed is False


def test_task_timestamps_auto_set():
    """Test that created_at and updated_at are automatically set."""
    before = datetime.utcnow()
    task = Task(user_id="user123", title="Test task")
    after = datetime.utcnow()

    assert before <= task.created_at <= after
    assert before <= task.updated_at <= after


def test_task_description_max_length():
    """Test that description has max length of 5000 characters."""
    long_description = "x" * 5001

    with pytest.raises(ValidationError) as exc_info:
        Task.model_validate({"user_id": "user123", "title": "Test", "description": long_description})

    assert "description" in str(exc_info.value).lower()


def test_task_description_optional():
    """Test that description is optional and defaults to None."""
    task = Task(user_id="user123", title="Test task")

    assert task.description is None
