"""
Authentication module for JWT-based stateless authentication.

This module provides JWT token verification, user identity extraction,
and FastAPI dependencies for protecting routes.
"""

from .exceptions import AuthenticationError, AuthorizationError
from .dependencies import get_current_user

__all__ = [
    "AuthenticationError",
    "AuthorizationError",
    "get_current_user",
]
