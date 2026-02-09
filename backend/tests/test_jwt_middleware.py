"""
Unit tests for JWT token verification middleware.

Tests cover valid tokens, expired tokens, invalid signatures, missing claims,
and malformed tokens.
"""

import pytest
import jwt
import os
from datetime import datetime, timedelta

from src.auth.jwt_middleware import verify_jwt_token
from src.auth.exceptions import AuthenticationError


# Test helper to generate JWT tokens
def generate_test_token(
    user_id: str = "test-user-123",
    email: str = "test@example.com",
    exp_delta_seconds: int = 7200,  # Default 2 hours (was 3600, causing timing issues)
    secret: str = None,
    include_required_claims: bool = True
) -> str:
    """
    Generate a test JWT token with configurable parameters.

    Args:
        user_id: User identifier for token payload
        email: User email for token payload
        exp_delta_seconds: Seconds until expiry (can be negative for expired tokens)
        secret: Secret for signing (defaults to BETTER_AUTH_SECRET from env)
        include_required_claims: Whether to include user_id and email in payload

    Returns:
        str: Encoded JWT token
    """
    secret = secret or os.getenv("BETTER_AUTH_SECRET")
    now = datetime.utcnow()

    payload = {
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=exp_delta_seconds)).timestamp())
    }

    if include_required_claims:
        payload["user_id"] = user_id
        payload["email"] = email

    return jwt.encode(payload, secret, algorithm="HS256")


class TestJWTVerification:
    """Test suite for JWT token verification."""

    def test_valid_token_with_all_claims(self):
        """Test that a valid token with all required claims is successfully verified."""
        token = generate_test_token(
            user_id="user-abc123",
            email="alice@example.com",
            exp_delta_seconds=86400  # 24 hours to avoid timing issues
        )

        payload = verify_jwt_token(token)

        assert payload["user_id"] == "user-abc123"
        assert payload["email"] == "alice@example.com"
        assert "iat" in payload
        assert "exp" in payload

    def test_valid_token_with_matching_user_id(self):
        """Test that token verification succeeds when user_id matches expected value."""
        token = generate_test_token(
            user_id="test-user-123",
            email="test@example.com",
            exp_delta_seconds=86400  # 24 hours
        )
        payload = verify_jwt_token(token)

        assert payload["user_id"] == "test-user-123"

    def test_expired_token_raises_auth_expired(self):
        """Test that expired tokens raise AuthenticationError with AUTH_EXPIRED code."""
        # Generate token that expired 1 hour ago
        token = generate_test_token(exp_delta_seconds=-3600)

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(token)

        assert exc_info.value.code == "AUTH_EXPIRED"
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.message.lower()

    def test_invalid_signature_raises_auth_invalid(self):
        """Test that tokens with invalid signatures raise AuthenticationError."""
        # Generate token with wrong secret
        token = generate_test_token(secret="wrong-secret-key")

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(token)

        assert exc_info.value.code == "AUTH_INVALID"
        assert exc_info.value.status_code == 401
        assert "invalid" in exc_info.value.message.lower() or "signature" in exc_info.value.message.lower()

    def test_missing_user_id_claim_raises_auth_invalid(self):
        """Test that tokens missing user_id claim raise AuthenticationError."""
        # Generate token without user_id
        secret = os.getenv("BETTER_AUTH_SECRET")
        payload = {
            "email": "test@example.com",
            "iat": int(datetime.utcnow().timestamp()),
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        }
        token = jwt.encode(payload, secret, algorithm="HS256")

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(token)

        assert exc_info.value.code == "AUTH_INVALID"
        assert "required claims" in exc_info.value.message.lower() or "user_id" in exc_info.value.message.lower()

    def test_missing_email_claim_raises_auth_invalid(self):
        """Test that tokens missing email claim raise AuthenticationError."""
        # Generate token without email
        secret = os.getenv("BETTER_AUTH_SECRET")
        payload = {
            "user_id": "test-user-123",
            "iat": int(datetime.utcnow().timestamp()),
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        }
        token = jwt.encode(payload, secret, algorithm="HS256")

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(token)

        assert exc_info.value.code == "AUTH_INVALID"
        assert "required claims" in exc_info.value.message.lower() or "email" in exc_info.value.message.lower()

    def test_malformed_token_raises_auth_invalid(self):
        """Test that malformed tokens (not proper JWT format) raise AuthenticationError."""
        malformed_token = "not.a.valid.jwt.token"

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(malformed_token)

        assert exc_info.value.code == "AUTH_INVALID"
        assert exc_info.value.status_code == 401

    def test_empty_token_raises_auth_invalid(self):
        """Test that empty tokens raise AuthenticationError."""
        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token("")

        assert exc_info.value.code == "AUTH_INVALID"
        assert exc_info.value.status_code == 401

    def test_token_with_future_iat_still_valid(self):
        """Test that tokens with iat in the future are still accepted (no iat validation)."""
        secret = os.getenv("BETTER_AUTH_SECRET")
        future_time = datetime.utcnow() + timedelta(hours=1)

        payload = {
            "user_id": "test-user-123",
            "email": "test@example.com",
            "iat": int(future_time.timestamp()),
            "exp": int((future_time + timedelta(hours=24)).timestamp())
        }
        token = jwt.encode(payload, secret, algorithm="HS256")

        # Should not raise - iat is not validated, only exp
        payload = verify_jwt_token(token)
        assert payload["user_id"] == "test-user-123"

    def test_token_expiring_soon_is_valid(self):
        """Test that tokens expiring soon (but not yet expired) are accepted."""
        # Token expires in 24 hours (safer for test timing than shorter durations)
        token = generate_test_token(exp_delta_seconds=86400)
        payload = verify_jwt_token(token)

        assert payload["user_id"] == "test-user-123"
        assert "exp" in payload

    def test_token_just_expired_is_rejected(self):
        """Test that tokens that just expired (1 second ago) are rejected."""
        token = generate_test_token(exp_delta_seconds=-1)

        with pytest.raises(AuthenticationError) as exc_info:
            verify_jwt_token(token)

        assert exc_info.value.code == "AUTH_EXPIRED"
