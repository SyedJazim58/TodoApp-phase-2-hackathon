"""
Custom exceptions for backend core data layer.

This module defines domain exceptions that are raised by repository
and service layers, then translated to HTTP responses by FastAPI
exception handlers.
"""


class DatabaseError(Exception):
    """
    Raised when database operation fails.

    Wraps original exception but does NOT expose it to HTTP responses.
    Logged for debugging but clients receive generic error message.

    Attributes:
        operation: High-level operation name (e.g., "create_task", "query_tasks")
        original_exception: Original exception from database layer (for logging only)
    """

    def __init__(self, operation: str, original_exception: Exception):
        """
        Initialize DatabaseError with operation context.

        Args:
            operation: Name of the operation that failed
            original_exception: Original exception from database layer
        """
        self.operation = operation
        self.original_exception = original_exception
        super().__init__(f"Database error during {operation}")


class ResourceNotFoundError(Exception):
    """
    Raised when resource not found or ownership verification fails.

    Intentionally ambiguous - does not distinguish between:
    - Resource doesn't exist
    - Resource exists but belongs to different user

    This prevents task ID enumeration attacks by returning identical
    error responses regardless of the actual reason.

    Attributes:
        resource_type: Type of resource (e.g., "task")
        resource_id: Identifier of resource
    """

    def __init__(self, resource_type: str, resource_id: int):
        """
        Initialize ResourceNotFoundError.

        Args:
            resource_type: Type of resource that wasn't found
            resource_id: ID of the resource
        """
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} not found: {resource_id}")
