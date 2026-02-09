"""
JWT token verification middleware.

Provides functions for verifying JWT tokens, validating signatures,
checking expiry, and extracting user identity.
"""

import os
from typing import Dict, Any
import jwt
from datetime import datetime

from .exceptions import AuthenticationError


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token signature and expiry, then decode payload.

    This function:
    1. Verifies token signature using BETTER_AUTH_SECRET
    2. Validates token has not expired
    3. Decodes user_id and email from payload
    4. Validates required claims are present

    Args:
        token: JWT token string (without "Bearer " prefix)

    Returns:
        Dict containing decoded token payload with user_id, email, iat, exp

    Raises:
        AuthenticationError: If token is invalid, expired, or missing required claims

    Example:
        >>> token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
        >>> payload = verify_jwt_token(token)
        >>> print(payload["user_id"])
        "user-123"
    """
    # Get secret from environment variable
    secret = os.getenv("BETTER_AUTH_SECRET")

    if not secret:
        raise AuthenticationError(
            message="Server configuration error: BETTER_AUTH_SECRET not set",
            code="AUTH_CONFIG_ERROR"
        )

    try:
        # Decode and verify token
        # PyJWT automatically validates signature and expiry when verify=True (default)
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "require": ["user_id", "email", "exp", "iat"]
            }
        )

        # Validate required claims are present
        required_claims = ["user_id", "email", "exp", "iat"]
        missing_claims = [claim for claim in required_claims if claim not in payload]

        if missing_claims:
            raise AuthenticationError(
                message=f"Token missing required claims: {', '.join(missing_claims)}",
                code="AUTH_INVALID"
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise AuthenticationError(
            message="Token expired",
            code="AUTH_EXPIRED"
        )

    except jwt.InvalidSignatureError:
        raise AuthenticationError(
            message="Invalid token signature",
            code="AUTH_INVALID"
        )

    except jwt.DecodeError:
        raise AuthenticationError(
            message="Invalid token format",
            code="AUTH_INVALID"
        )

    except jwt.InvalidTokenError as e:
        # Catch-all for other JWT errors
        raise AuthenticationError(
            message=f"Invalid token: {str(e)}",
            code="AUTH_INVALID"
        )
