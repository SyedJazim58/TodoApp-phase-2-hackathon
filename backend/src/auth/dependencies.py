"""
FastAPI dependencies for authentication and authorization.

Provides reusable dependency functions for extracting and validating
JWT tokens in route handlers.
"""

import logging
from typing import Dict, Any
from fastapi import Header, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .jwt_middleware import verify_jwt_token
from .exceptions import AuthenticationError, AuthorizationError


# Configure logging
logger = logging.getLogger(__name__)

# HTTP Bearer token scheme (for OpenAPI documentation)
security = HTTPBearer()


async def get_current_user(
    request: Request,
    authorization: str = Header(None)
) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and verify JWT token from Authorization header.

    This dependency:
    1. Extracts JWT token from Authorization header
    2. Verifies token signature and expiry
    3. Extracts user_id from token payload
    4. Validates user_id in token matches user_id in URL path
    5. Returns authenticated user info

    Args:
        request: FastAPI request object (provides URL path parameters)
        authorization: Authorization header value (format: "Bearer <token>")

    Returns:
        Dict containing authenticated user info (user_id, email)

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 403: If user_id in token doesn't match user_id in URL

    Example:
        ```python
        @app.get("/api/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user: dict = Depends(get_current_user)
        ):
            # current_user["user_id"] is guaranteed to match user_id parameter
            return {"tasks": [...]}
        ```
    """
    # Check if Authorization header is present
    if not authorization:
        logger.warning(
            "Authentication failed: Missing Authorization header",
            extra={
                "endpoint": request.url.path,
                "method": request.method,
                "client_host": request.client.host if request.client else "unknown"
            }
        )
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Missing authentication token",
                "code": "AUTH_MISSING"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Validate Authorization header format
    if not authorization.startswith("Bearer "):
        logger.warning(
            "Authentication failed: Invalid Authorization header format",
            extra={
                "endpoint": request.url.path,
                "method": request.method,
                "client_host": request.client.host if request.client else "unknown"
            }
        )
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid authorization header format. Expected: Authorization: Bearer <token>",
                "code": "AUTH_INVALID"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Extract token (remove "Bearer " prefix)
    token = authorization[7:]

    try:
        # Verify token and extract payload
        payload = verify_jwt_token(token)

        # Extract user_id from token
        token_user_id = payload.get("user_id")

        # Extract user_id from URL path parameters
        path_params = request.path_params
        url_user_id = path_params.get("user_id")

        # If URL contains user_id parameter, validate it matches token user_id
        if url_user_id and token_user_id != url_user_id:
            logger.warning(
                "Authorization failed: user_id mismatch",
                extra={
                    "endpoint": request.url.path,
                    "method": request.method,
                    "token_user_id": token_user_id,
                    "url_user_id": url_user_id,
                    "client_host": request.client.host if request.client else "unknown"
                }
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Forbidden: Cannot access another user's resources",
                    "code": "AUTH_FORBIDDEN"
                }
            )

        # Return authenticated user info
        return {
            "user_id": payload["user_id"],
            "email": payload["email"]
        }

    except AuthenticationError as e:
        # Log authentication failure
        logger.warning(
            f"Authentication failed: {e.message}",
            extra={
                "endpoint": request.url.path,
                "method": request.method,
                "error_code": e.code,
                "client_host": request.client.host if request.client else "unknown"
            }
        )

        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": e.message,
                "code": e.code
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    except HTTPException:
        # Re-raise HTTPException (from AuthorizationError handler above)
        raise

    except Exception as e:
        # Log unexpected errors
        logger.error(
            f"Unexpected authentication error: {str(e)}",
            extra={
                "endpoint": request.url.path,
                "method": request.method,
                "client_host": request.client.host if request.client else "unknown"
            },
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error during authentication",
                "code": "AUTH_INTERNAL_ERROR"
            }
        )
