"""
Task model for user task management with ownership enforcement.

This module defines SQLModel classes for the Task entity with strict
user ownership rules. All tasks belong to exactly one user (identified
by user_id), and ownership is enforced at the query level.
"""

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class TaskBase(SQLModel):
    """
    Shared fields for Task creation and responses.

    Attributes:
        title: Task title (required, max 500 characters)
        description: Optional detailed description (max 5000 characters)
        completed: Completion status (defaults to False)
    """
    title: str = Field(min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(default=None, max_length=5000, description="Task description")
    completed: bool = Field(default=False, description="Completion status")


class Task(TaskBase, table=True):
    """
    Database model for Task entity with user ownership.

    Security: All queries MUST filter by user_id to enforce data isolation.

    Attributes:
        id: Unique identifier (auto-generated)
        user_id: Owner's user identifier (non-nullable, indexed, immutable)
        created_at: Creation timestamp (UTC, immutable)
        updated_at: Last modification timestamp (UTC, auto-updated)
    """
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class TaskCreate(TaskBase):
    """
    Schema for creating a new task.

    Note: user_id is injected from authentication context, not from client input.
    """
    pass


class TaskUpdate(SQLModel):
    """
    Schema for updating a task (all fields optional).

    Note: user_id, id, and created_at are immutable and cannot be updated.
    """
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: Optional[bool] = Field(default=None)


class TaskRead(TaskBase):
    """
    Schema for task responses (includes id and timestamps).

    Used for API responses to clients.
    """
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
