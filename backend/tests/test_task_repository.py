"""
Unit tests for TaskRepository with ownership enforcement.

Tests cover:
- Task creation with user_id
- Ownership isolation (User A cannot access User B's tasks)
- Required field validation
- CRUD operations with ownership verification
- Timestamp management
"""

import pytest
from datetime import datetime
from src.models.task import TaskCreate, TaskUpdate
from src.exceptions import DatabaseError


# Tests will be added incrementally as we implement repository methods
# Following TDD approach: write tests first, ensure they fail, then implement


def test_create_task_with_user_id(task_repository, user_a_id):
    """
    Test task creation with user_id.

    Verify that:
    - Task is persisted with correct user_id
    - All fields are stored correctly
    - Timestamps are auto-generated
    """
    task_data = TaskCreate(
        title="Buy groceries",
        description="Milk, bread, eggs",
        completed=False
    )

    task = task_repository.create(user_a_id, task_data)

    assert task.id is not None
    assert task.user_id == user_a_id
    assert task.title == "Buy groceries"
    assert task.description == "Milk, bread, eggs"
    assert task.completed is False
    assert task.created_at is not None
    assert task.updated_at is not None


def test_create_task_ownership_isolation(task_repository, user_a_id, user_b_id):
    """
    Test that User A's task is not accessible by User B.

    Verify ownership filtering:
    - User A creates a task
    - User B attempts to retrieve it by ID
    - get_by_id returns None (task appears not to exist for User B)
    """
    # User A creates a task
    task_data = TaskCreate(title="User A's task")
    task = task_repository.create(user_a_id, task_data)

    # User B attempts to access User A's task
    result = task_repository.get_by_id(user_b_id, task.id)

    # Should return None (ownership filter prevents access)
    assert result is None


def test_create_task_validates_required_fields(task_repository, user_a_id):
    """
    Test that Pydantic validation enforces required title field.

    This test verifies validation happens at the model layer
    before repository interaction.
    """
    from pydantic import ValidationError

    # Attempt to create task without title
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate()

    assert "title" in str(exc_info.value).lower()


# User Story 2: Retrieve User's Task List

def test_get_all_filters_by_user(task_repository, user_a_id, user_b_id):
    """
    Test that get_all returns only user's tasks.

    Verify:
    - User A creates 3 tasks
    - User B creates 2 tasks
    - User A's query returns exactly 3 tasks
    - User B's query returns exactly 2 tasks
    - All tasks have correct user_id
    """
    # User A creates 3 tasks
    task_repository.create(user_a_id, TaskCreate(title="Task A1"))
    task_repository.create(user_a_id, TaskCreate(title="Task A2"))
    task_repository.create(user_a_id, TaskCreate(title="Task A3"))

    # User B creates 2 tasks
    task_repository.create(user_b_id, TaskCreate(title="Task B1"))
    task_repository.create(user_b_id, TaskCreate(title="Task B2"))

    # Query User A's tasks
    tasks_a = task_repository.get_all(user_a_id)
    tasks_b = task_repository.get_all(user_b_id)

    assert len(tasks_a) == 3
    assert len(tasks_b) == 2
    assert all(t.user_id == user_a_id for t in tasks_a)
    assert all(t.user_id == user_b_id for t in tasks_b)


def test_get_by_id_ownership_filter(task_repository, user_a_id, user_b_id):
    """
    Test that User A cannot access User B's task via get_by_id.

    Verify ownership filtering returns None.
    """
    # User B creates a task
    task = task_repository.create(user_b_id, TaskCreate(title="User B's task"))

    # User A attempts to access it
    result = task_repository.get_by_id(user_a_id, task.id)

    assert result is None


def test_get_all_empty_list(task_repository, user_a_id):
    """
    Test that empty list is returned for user with no tasks.
    """
    tasks = task_repository.get_all(user_a_id)

    assert tasks == []
    assert isinstance(tasks, list)


# User Story 3: Update Task with Ownership Verification

def test_update_task_with_ownership(task_repository, user_a_id):
    """
    Test that User A can update their own task.

    Verify:
    - Task is updated with new values
    - updated_at timestamp is refreshed
    """
    import time

    # Create task
    task = task_repository.create(user_a_id, TaskCreate(title="Original title"))
    original_updated_at = task.updated_at

    # Wait to ensure timestamp difference
    time.sleep(0.1)

    # Update task
    update_data = TaskUpdate(title="Updated title", description="New description")
    updated_task = task_repository.update(user_a_id, task.id, update_data)

    assert updated_task is not None
    assert updated_task.title == "Updated title"
    assert updated_task.description == "New description"
    assert updated_task.updated_at > original_updated_at


def test_update_task_ownership_failure(task_repository, user_a_id, user_b_id):
    """
    Test that User B cannot update User A's task.

    Verify returns None (404 pattern).
    """
    # User A creates task
    task = task_repository.create(user_a_id, TaskCreate(title="User A's task"))

    # User B attempts to update it
    update_data = TaskUpdate(title="Hacked title")
    result = task_repository.update(user_b_id, task.id, update_data)

    assert result is None


def test_update_task_immutable_user_id(task_repository, user_a_id):
    """
    Test that user_id cannot be changed via update.

    Verify user_id remains unchanged after update.
    """
    # Create task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task"))
    original_user_id = task.user_id

    # Attempt update (user_id should be ignored)
    update_data = TaskUpdate(title="Updated title")
    updated_task = task_repository.update(user_a_id, task.id, update_data)

    assert updated_task.user_id == original_user_id


def test_update_refreshes_updated_at(task_repository, user_a_id):
    """
    Test that updated_at timestamp changes on modification.
    """
    import time

    # Create task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task"))
    original_updated_at = task.updated_at

    # Wait a moment
    time.sleep(0.1)

    # Update task
    update_data = TaskUpdate(title="New title")
    updated_task = task_repository.update(user_a_id, task.id, update_data)

    assert updated_task.updated_at > original_updated_at


# User Story 4: Toggle Task Completion Status

def test_toggle_complete_false_to_true(task_repository, user_a_id):
    """
    Test toggling incomplete task to completed.
    """
    # Create incomplete task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task", completed=False))

    # Toggle to completed
    toggled_task = task_repository.toggle_complete(user_a_id, task.id)

    assert toggled_task is not None
    assert toggled_task.completed is True


def test_toggle_complete_true_to_false(task_repository, user_a_id):
    """
    Test toggling completed task to incomplete.
    """
    # Create completed task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task", completed=True))

    # Toggle to incomplete
    toggled_task = task_repository.toggle_complete(user_a_id, task.id)

    assert toggled_task is not None
    assert toggled_task.completed is False


def test_toggle_complete_ownership_failure(task_repository, user_a_id, user_b_id):
    """
    Test that User B cannot toggle User A's task.
    """
    # User A creates task
    task = task_repository.create(user_a_id, TaskCreate(title="User A's task"))

    # User B attempts to toggle it
    result = task_repository.toggle_complete(user_b_id, task.id)

    assert result is None


def test_toggle_complete_refreshes_timestamp(task_repository, user_a_id):
    """
    Test that updated_at changes on toggle.
    """
    import time

    # Create task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task"))
    original_updated_at = task.updated_at

    time.sleep(0.1)

    # Toggle
    toggled_task = task_repository.toggle_complete(user_a_id, task.id)

    assert toggled_task.updated_at > original_updated_at


# User Story 5: Delete Task with Ownership Verification

def test_delete_task_with_ownership(task_repository, user_a_id):
    """
    Test that User A can delete their own task.
    """
    # Create task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task"))

    # Delete task
    result = task_repository.delete(user_a_id, task.id)

    assert result is True

    # Verify task is gone
    deleted_task = task_repository.get_by_id(user_a_id, task.id)
    assert deleted_task is None


def test_delete_task_ownership_failure(task_repository, user_a_id, user_b_id):
    """
    Test that User B cannot delete User A's task.
    """
    # User A creates task
    task = task_repository.create(user_a_id, TaskCreate(title="User A's task"))

    # User B attempts to delete it
    result = task_repository.delete(user_b_id, task.id)

    assert result is False


def test_delete_nonexistent_task(task_repository, user_a_id):
    """
    Test deleting non-existent task returns False without error.
    """
    result = task_repository.delete(user_a_id, 99999)

    assert result is False


def test_delete_task_permanent_removal(task_repository, user_a_id):
    """
    Test that deleted task is permanently removed.

    Verify subsequent queries return None.
    """
    # Create and delete task
    task = task_repository.create(user_a_id, TaskCreate(title="Test task"))
    task_repository.delete(user_a_id, task.id)

    # Verify removal
    result = task_repository.get_by_id(user_a_id, task.id)
    assert result is None

    # Verify not in get_all
    all_tasks = task_repository.get_all(user_a_id)
    assert all(t.id != task.id for t in all_tasks)
