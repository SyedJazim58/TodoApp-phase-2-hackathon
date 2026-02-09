"""
Task repository for data access with ownership enforcement.

All repository methods require explicit user_id parameter and enforce
ownership verification at the query construction level. Methods return
None for ownership failures, allowing the caller to handle as appropriate.
"""

from typing import Optional, List
from sqlmodel import Session, select
from datetime import datetime
import logging

from src.models.task import Task, TaskCreate, TaskUpdate
from src.exceptions import DatabaseError

logger = logging.getLogger(__name__)


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
        try:
            # Create task with user_id from authentication context
            task = Task(
                user_id=user_id,
                title=task_data.title,
                description=task_data.description,
                completed=task_data.completed
            )

            # Persist to database
            self.session.add(task)
            self.session.commit()
            self.session.refresh(task)

            logger.info(f"Task created: id={task.id}, user_id={user_id}")
            return task

        except Exception as e:
            self.session.rollback()
            logger.error(f"Failed to create task for user_id={user_id}: {e}")
            raise DatabaseError("create_task", e)

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
        try:
            # Single query combines existence check and ownership check
            statement = select(Task).where(
                Task.id == task_id,
                Task.user_id == user_id
            )
            task = self.session.exec(statement).first()

            return task

        except Exception as e:
            logger.error(f"Failed to get task id={task_id} for user_id={user_id}: {e}")
            raise DatabaseError("get_task_by_id", e)

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
        try:
            # Query filtered at database level by user_id
            statement = select(Task).where(Task.user_id == user_id)
            tasks = self.session.exec(statement).all()

            return list(tasks)

        except Exception as e:
            logger.error(f"Failed to get tasks for user_id={user_id}: {e}")
            raise DatabaseError("get_all_tasks", e)

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
        try:
            # Fetch task with ownership verification
            task = self.get_by_id(user_id, task_id)

            if task is None:
                return None

            # Apply updates (only provided fields)
            if task_data.title is not None:
                task.title = task_data.title
            if task_data.description is not None:
                task.description = task_data.description
            if task_data.completed is not None:
                task.completed = task_data.completed

            # Refresh updated_at timestamp
            task.updated_at = datetime.utcnow()

            self.session.add(task)
            self.session.commit()
            self.session.refresh(task)

            logger.info(f"Task updated: id={task_id}, user_id={user_id}")
            return task

        except Exception as e:
            self.session.rollback()
            logger.error(f"Failed to update task id={task_id} for user_id={user_id}: {e}")
            raise DatabaseError("update_task", e)

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
        try:
            # Fetch task with ownership verification
            task = self.get_by_id(user_id, task_id)

            if task is None:
                return None

            # Flip completed status
            task.completed = not task.completed

            # Refresh updated_at timestamp
            task.updated_at = datetime.utcnow()

            self.session.add(task)
            self.session.commit()
            self.session.refresh(task)

            logger.info(f"Task toggled: id={task_id}, user_id={user_id}, completed={task.completed}")
            return task

        except Exception as e:
            self.session.rollback()
            logger.error(f"Failed to toggle task id={task_id} for user_id={user_id}: {e}")
            raise DatabaseError("toggle_complete", e)

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
        try:
            # Fetch task with ownership verification
            task = self.get_by_id(user_id, task_id)

            if task is None:
                return False

            # Permanently delete from database
            self.session.delete(task)
            self.session.commit()

            logger.info(f"Task deleted: id={task_id}, user_id={user_id}")
            return True

        except Exception as e:
            self.session.rollback()
            logger.error(f"Failed to delete task id={task_id} for user_id={user_id}: {e}")
            raise DatabaseError("delete_task", e)
