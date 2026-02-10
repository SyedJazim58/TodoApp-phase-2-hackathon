"""
Task API routes with JWT authentication.

All endpoints require valid JWT tokens and enforce user_id matching
between the token and URL parameters to ensure data isolation.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session

from src.auth.dependencies import get_current_user
from src.database.connection import get_session
from src.models.task import Task, TaskCreate, TaskUpdate
from src.repositories.task_repository import TaskRepository
from src.exceptions import DatabaseError

router = APIRouter()


@router.get("/api/{user_id}/tasks", response_model=List[Task])
async def get_tasks(
    user_id: str = Path(..., description="User ID from authenticated token"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> List[Task]:
    """
    Get all tasks for the authenticated user.

    Security: user_id in URL is validated against JWT token by get_current_user dependency.

    Args:
        user_id: User identifier from URL path (must match JWT token)
        current_user: Authenticated user info from JWT token
        session: Database session

    Returns:
        List[Task]: All tasks belonging to the authenticated user

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 403: If user_id doesn't match token user_id
    """
    try:
        repository = TaskRepository(session)
        tasks = repository.get_all(current_user["user_id"])
        return tasks
    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/{user_id}/tasks", response_model=Task, status_code=201)
async def create_task(
    task_data: TaskCreate,
    user_id: str = Path(..., description="User ID from authenticated token"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Task:
    """
    Create a new task for the authenticated user.

    Security: user_id in URL is validated against JWT token by get_current_user dependency.
    The task will be created with the user_id from the JWT token, not from request body.

    Args:
        task_data: Task creation data (title, description, completed)
        user_id: User identifier from URL path (must match JWT token)
        current_user: Authenticated user info from JWT token
        session: Database session

    Returns:
        Task: Created task with id and timestamps

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 403: If user_id doesn't match token user_id
        HTTPException 400: If task data validation fails
    """
    try:
        repository = TaskRepository(session)
        # Use user_id from JWT token (current_user), not from request body
        task = repository.create(current_user["user_id"], task_data)
        return task
    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/{user_id}/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    user_id: str = Path(..., description="User ID from authenticated token"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Task:
    """
    Update an existing task for the authenticated user.

    Security: user_id in URL is validated against JWT token by get_current_user dependency.
    Only the task owner can update their task.

    Args:
        task_id: Task identifier
        task_data: Task update data (title, description, completed)
        user_id: User identifier from URL path (must match JWT token)
        current_user: Authenticated user info from JWT token
        session: Database session

    Returns:
        Task: Updated task

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 403: If user_id doesn't match token user_id
        HTTPException 404: If task not found or doesn't belong to user
    """
    try:
        repository = TaskRepository(session)
        task = repository.update(current_user["user_id"], task_id, task_data)

        if task is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Task not found or access denied", "code": "TASK_NOT_FOUND"}
            )

        return task
    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/{user_id}/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    user_id: str = Path(..., description="User ID from authenticated token"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> None:
    """
    Delete a task for the authenticated user.

    Security: user_id in URL is validated against JWT token by get_current_user dependency.
    Only the task owner can delete their task.

    Args:
        task_id: Task identifier
        user_id: User identifier from URL path (must match JWT token)
        current_user: Authenticated user info from JWT token
        session: Database session

    Returns:
        None (HTTP 204 No Content on success)

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 403: If user_id doesn't match token user_id
        HTTPException 404: If task not found or doesn't belong to user
    """
    try:
        repository = TaskRepository(session)
        success = repository.delete(current_user["user_id"], task_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail={"error": "Task not found or access denied", "code": "TASK_NOT_FOUND"}
            )

        return None
    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=str(e))
