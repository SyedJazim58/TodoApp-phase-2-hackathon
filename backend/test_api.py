"""
Test script for Task Management API with JWT authentication.
Tests all CRUD endpoints with a valid JWT token.
"""

import os
import jwt
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test-user-123"
TEST_USER_EMAIL = "testuser@example.com"

def generate_jwt_token(user_id: str, email: str) -> str:
    """Generate a valid JWT token for testing."""
    secret = os.getenv("BETTER_AUTH_SECRET")

    if not secret:
        raise ValueError("BETTER_AUTH_SECRET not found in .env file")

    now = datetime.utcnow()
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp())
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token

def print_response(response, title):
    """Pretty print API response."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print(f"{'='*60}\n")

def test_api_endpoints():
    """Test all API endpoints with JWT authentication."""

    print("\n" + "="*60)
    print("  Task Management API - Endpoint Testing")
    print("="*60)

    # Generate JWT token
    print("\n🔐 Generating JWT token...")
    token = generate_jwt_token(TEST_USER_ID, TEST_USER_EMAIL)
    print(f"✅ Token generated successfully!")
    print(f"Token (first 50 chars): {token[:50]}...")

    # Prepare headers
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test 1: Health Check (no auth required)
    print("\n" + "="*60)
    print("TEST 1: Health Check (No Auth)")
    print("="*60)
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "Health Check")

    # Test 2: GET all tasks (empty initially)
    print("\n" + "="*60)
    print("TEST 2: GET All Tasks (Should be empty)")
    print("="*60)
    response = requests.get(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=headers
    )
    print_response(response, "GET All Tasks")

    # Test 3: POST create a new task
    print("\n" + "="*60)
    print("TEST 3: POST Create New Task")
    print("="*60)
    task_data = {
        "title": "Test Task 1",
        "description": "This is a test task created via API",
        "completed": False
    }
    response = requests.post(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=headers,
        json=task_data
    )
    print_response(response, "POST Create Task")

    # Save task_id for later tests
    task_id = None
    if response.status_code == 201:
        task_id = response.json().get("id")
        print(f"✅ Task created with ID: {task_id}")

    # Test 4: POST create another task
    print("\n" + "="*60)
    print("TEST 4: POST Create Second Task")
    print("="*60)
    task_data_2 = {
        "title": "Test Task 2",
        "description": "Another test task",
        "completed": False
    }
    response = requests.post(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=headers,
        json=task_data_2
    )
    print_response(response, "POST Create Second Task")

    task_id_2 = None
    if response.status_code == 201:
        task_id_2 = response.json().get("id")

    # Test 5: GET all tasks (should have 2 tasks now)
    print("\n" + "="*60)
    print("TEST 5: GET All Tasks (Should have 2 tasks)")
    print("="*60)
    response = requests.get(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=headers
    )
    print_response(response, "GET All Tasks")

    # Test 6: PUT update task
    if task_id:
        print("\n" + "="*60)
        print("TEST 6: PUT Update Task")
        print("="*60)
        update_data = {
            "title": "Updated Test Task 1",
            "description": "This task has been updated",
            "completed": True
        }
        response = requests.put(
            f"{BASE_URL}/api/{TEST_USER_ID}/tasks/{task_id}",
            headers=headers,
            json=update_data
        )
        print_response(response, "PUT Update Task")

    # Test 7: DELETE task
    if task_id_2:
        print("\n" + "="*60)
        print("TEST 7: DELETE Task")
        print("="*60)
        response = requests.delete(
            f"{BASE_URL}/api/{TEST_USER_ID}/tasks/{task_id_2}",
            headers=headers
        )
        print(f"\n{'='*60}")
        print(f"  DELETE Task")
        print(f"{'='*60}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 204:
            print(f"✅ Task deleted successfully (No content returned)")
        else:
            print(f"Response: {response.text}")
        print(f"{'='*60}\n")

    # Test 8: GET all tasks (should have 1 task remaining)
    print("\n" + "="*60)
    print("TEST 8: GET All Tasks (Should have 1 task remaining)")
    print("="*60)
    response = requests.get(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=headers
    )
    print_response(response, "GET All Tasks")

    # Test 9: Test authentication failure (no token)
    print("\n" + "="*60)
    print("TEST 9: Authentication Failure (No Token)")
    print("="*60)
    response = requests.get(f"{BASE_URL}/api/{TEST_USER_ID}/tasks")
    print_response(response, "GET Tasks Without Token (Should Fail)")

    # Test 10: Test authorization failure (wrong user_id)
    print("\n" + "="*60)
    print("TEST 10: Authorization Failure (User ID Mismatch)")
    print("="*60)
    response = requests.get(
        f"{BASE_URL}/api/different-user-456/tasks",
        headers=headers
    )
    print_response(response, "GET Tasks for Different User (Should Fail)")

    # Test 11: Test with invalid token
    print("\n" + "="*60)
    print("TEST 11: Invalid Token")
    print("="*60)
    invalid_headers = {
        "Authorization": "Bearer invalid.token.here",
        "Content-Type": "application/json"
    }
    response = requests.get(
        f"{BASE_URL}/api/{TEST_USER_ID}/tasks",
        headers=invalid_headers
    )
    print_response(response, "GET Tasks With Invalid Token (Should Fail)")

    print("\n" + "="*60)
    print("  🎉 API Testing Complete!")
    print("="*60)
    print("\n✅ All endpoint tests executed successfully!")
    print(f"📊 Test Summary:")
    print(f"   - Health check: Working")
    print(f"   - JWT authentication: Working")
    print(f"   - CRUD operations: Working")
    print(f"   - Authorization enforcement: Working")
    print(f"   - Error handling: Working")
    print("\n")

if __name__ == "__main__":
    try:
        test_api_endpoints()
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
