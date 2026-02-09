"""
Authentication-specific exception classes.

Defines custom exceptions for authentication (401) and authorization (403) failures.
"""

from typing import Optional


class AuthenticationError(Exception):
    """
    Exception raised for authentication failures (HTTP 401).

    This includes:
    - Missing Authorization header
    - Invalid token signature
    - Expired token
    - Malformed token
    - Missing required claims
    """

    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = 401
    ):
        """
        Initialize AuthenticationError.

        Args:
            message: Human-readable error message
            code: Machine-readable error code (AUTH_MISSING, AUTH_INVALID, AUTH_EXPIRED)
            status_code: HTTP status code (default: 401)
        """
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class AuthorizationError(Exception):
    """
    Exception raised for authorization failures (HTTP 403).

    This occurs when:
    - Valid JWT token but user_id in token doesn't match user_id in URL
    - User attempting to access another user's resources
    """

    def __init__(
        self,
        message: str,
        code: str = "AUTH_FORBIDDEN",
        status_code: int = 403
    ):
        """
        Initialize AuthorizationError.

        Args:
            message: Human-readable error message
            code: Machine-readable error code (default: AUTH_FORBIDDEN)
            status_code: HTTP status code (default: 403)
        """
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)
