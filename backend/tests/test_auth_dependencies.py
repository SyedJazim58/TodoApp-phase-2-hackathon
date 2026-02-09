"""
Unit tests for FastAPI authentication dependencies.

Tests cover header extraction, user_id matching, and error scenarios
for the get_current_user dependency function.
"""

import pytest
import jwt
import os
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
from unittest.mock import Mock

from src.auth.dependencies import get_current_user
from src.auth.exceptions import AuthenticationError, AuthorizationError


def generate_test_token(user_id: str, email: str, exp_delta: int = 86400) -> str:
    """Generate a test JWT token (default 24 hours to avoid timing issues)."""
    secret = os.getenv("BETTER_AUTH_SECRET")
    now = datetime.utcnow()

    payload = {
        "user_id": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=exp_delta)).timestamp())
    }

    return jwt.encode(payload, secret, algorithm="HS256")


def create_mock_request(user_id: str) -> Request:
    """Create a mock FastAPI Request object with user_id in path."""
    mock_request = Mock(spec=Request)
    mock_request.path_params = {"user_id": user_id}
    return mock_request


class TestGetCurrentUser:
    """Test suite for get_current_user FastAPI dependency."""

    @pytest.mark.asyncio
    async def test_valid_token_with_matching_user_id(self):
        """Test that valid token with matching user_id returns authenticated user."""
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-123")

        user = await get_current_user(request, f"Bearer {token}")

        assert user["user_id"] == "user-123"
        assert user["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_missing_authorization_header_raises_401(self):
        """Test that missing Authorization header raises HTTP 401."""
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, None)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_MISSING"

    @pytest.mark.asyncio
    async def test_empty_authorization_header_raises_401(self):
        """Test that empty Authorization header raises HTTP 401."""
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, "")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_MISSING"

    @pytest.mark.asyncio
    async def test_malformed_authorization_header_missing_bearer(self):
        """Test that Authorization header without 'Bearer' prefix raises HTTP 401."""
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, token)  # Missing "Bearer " prefix

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_INVALID"

    @pytest.mark.asyncio
    async def test_malformed_authorization_header_wrong_scheme(self):
        """Test that Authorization header with wrong scheme (not 'Bearer') raises HTTP 401."""
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, f"Basic {token}")  # Wrong scheme

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_INVALID"

    @pytest.mark.asyncio
    async def test_user_id_mismatch_raises_403(self):
        """Test that valid token with mismatched user_id raises HTTP 403."""
        # Token for user-123, but URL requests user-456
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-456")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, f"Bearer {token}")

        assert exc_info.value.status_code == 403
        assert exc_info.value.detail["code"] == "AUTH_FORBIDDEN"
        assert "cannot access another user" in exc_info.value.detail["error"].lower()

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self):
        """Test that expired tokens raise HTTP 401 with AUTH_EXPIRED."""
        # Generate token that expired 1 hour ago
        token = generate_test_token("user-123", "test@example.com", exp_delta=-3600)
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, f"Bearer {token}")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_EXPIRED"

    @pytest.mark.asyncio
    async def test_invalid_signature_raises_401(self):
        """Test that tokens with invalid signature raise HTTP 401."""
        # Generate token with wrong secret
        token = jwt.encode(
            {
                "user_id": "user-123",
                "email": "test@example.com",
                "iat": int(datetime.utcnow().timestamp()),
                "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp())
            },
            "wrong-secret-key",
            algorithm="HS256"
        )
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, f"Bearer {token}")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_INVALID"

    @pytest.mark.asyncio
    async def test_token_without_bearer_prefix_raises_401(self):
        """Test that token without 'Bearer ' prefix in header raises HTTP 401."""
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-123")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, token)  # No "Bearer " prefix

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "AUTH_INVALID"

    @pytest.mark.asyncio
    async def test_multiple_spaces_in_bearer_header(self):
        """Test that Authorization header with extra spaces is handled correctly."""
        token = generate_test_token("user-123", "test@example.com")
        request = create_mock_request("user-123")

        # Header with multiple spaces between Bearer and token
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request, f"Bearer  {token}")  # Double space

        # Should fail because split(" ") creates empty string
        assert exc_info.value.status_code == 401
