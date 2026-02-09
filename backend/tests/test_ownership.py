"""
Cross-user isolation and ownership tests.

Tests verify that the ownership enforcement mechanisms prevent
data leakage between users at the database query level.
"""

import pytest
from src.models.task import TaskCreate


def test_cross_user_data_leakage(task_repository, db_session):
    """
    Test large-scale cross-user data isolation.

    Create 1000 tasks across 100 users, verify query filtering
    at database level returns only user's own tasks.
    """
    num_users = 100
    tasks_per_user = 10
    total_tasks = num_users * tasks_per_user

    # Create tasks for multiple users
    for user_idx in range(num_users):
        user_id = f"user-{user_idx}"
        for task_idx in range(tasks_per_user):
            task_repository.create(
                user_id,
                TaskCreate(title=f"Task {task_idx} for user {user_idx}")
            )

    # Verify each user sees only their own tasks
    for user_idx in range(num_users):
        user_id = f"user-{user_idx}"
        user_tasks = task_repository.get_all(user_id)

        # Should have exactly tasks_per_user tasks
        assert len(user_tasks) == tasks_per_user

        # All tasks should belong to this user
        assert all(t.user_id == user_id for t in user_tasks)

        # No tasks from other users
        other_user_ids = [f"user-{i}" for i in range(num_users) if i != user_idx]
        assert not any(t.user_id in other_user_ids for t in user_tasks)

    # Total number of tasks in database should match
    # (This would require admin access, not tested here since we enforce ownership)


def test_ownership_prevents_enumeration(task_repository, user_a_id, user_b_id):
    """
    Test that ownership failures don't reveal task existence.

    Verify that attempting to access another user's task returns
    None (same as non-existent task), preventing enumeration attacks.
    """
    # User A creates a task
    task_a = task_repository.create(user_a_id, TaskCreate(title="User A's task"))

    # User B attempts to access by ID
    result = task_repository.get_by_id(user_b_id, task_a.id)

    # Should return None (same as if task didn't exist)
    assert result is None

    # Attempt to access genuinely non-existent task
    result_nonexistent = task_repository.get_by_id(user_b_id, 99999)

    # Should also return None (indistinguishable from ownership failure)
    assert result_nonexistent is None


def test_ownership_isolation_across_operations(task_repository, user_a_id, user_b_id):
    """
    Test ownership enforcement across all CRUD operations.

    Verify User B cannot:
    - Read User A's task
    - Update User A's task
    - Toggle User A's task
    - Delete User A's task
    """
    # User A creates a task
    task = task_repository.create(user_a_id, TaskCreate(title="User A's task", completed=False))

    # User B attempts read
    assert task_repository.get_by_id(user_b_id, task.id) is None

    # User B attempts update
    from src.models.task import TaskUpdate
    assert task_repository.update(user_b_id, task.id, TaskUpdate(title="Hacked")) is None

    # User B attempts toggle
    assert task_repository.toggle_complete(user_b_id, task.id) is None

    # User B attempts delete
    assert task_repository.delete(user_b_id, task.id) is False

    # User A can still access their task (unchanged)
    task_a = task_repository.get_by_id(user_a_id, task.id)
    assert task_a is not None
    assert task_a.title == "User A's task"
    assert task_a.completed is False
