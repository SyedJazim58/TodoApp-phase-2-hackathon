# API Contract: Frontend-Backend Integration

**Feature**: 003-frontend-fullstack-integration
**Date**: 2026-02-09
**Version**: 1.0

## Overview

This contract defines the API endpoints and communication patterns between the Next.js frontend and JWT-secured FastAPI backend for task management operations. All endpoints require JWT authentication via Authorization header.

## Common Headers

### Request Headers
- `Authorization: Bearer <jwt_token>` (required for all endpoints)
- `Content-Type: application/json` (required for POST/PUT requests)

### Response Headers
- `Content-Type: application/json`

## Authentication Flow

1. **Login/Signup**: User authenticates via Better Auth → JWT issued
2. **API Request**: Frontend includes JWT in Authorization header
3. **Backend Validation**: JWT signature verified using BETTER_AUTH_SECRET
4. **User ID Validation**: JWT user_id compared with URL user_id
5. **Data Filtering**: Responses filtered by authenticated user_id

## Error Responses

All error responses follow the same format:
```json
{
  "error": "descriptive error message",
  "code": "error_code"
}
```

### Common Error Codes
- `AUTH_EXPIRED`: JWT token has expired (401)
- `AUTH_INVALID`: JWT token is invalid or malformed (401)
- `ACCESS_DENIED`: Attempted to access different user's resources (403)
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist for user (404)
- `VALIDATION_ERROR`: Request data doesn't meet validation requirements (422)
- `SERVER_ERROR`: Internal server error (500)

## Endpoints

### Health Check
```
GET /health
```
**Description**: Verify API availability (no authentication required)
**Response**:
- `200 OK` - `{ "status": "healthy", "timestamp": "ISO date" }`

### Get User Tasks
```
GET /api/{user_id}/tasks
```
**Description**: Retrieve all tasks for the authenticated user
**Path Parameters**:
- `user_id`: User ID from authenticated session (validated against JWT)
**Headers**:
- `Authorization: Bearer <jwt_token>`
**Response**:
- `200 OK` - Array of Task objects
- `401 Unauthorized` - Invalid or expired JWT
- `403 Forbidden` - JWT user_id doesn't match URL user_id
```json
[
  {
    "id": "uuid-string",
    "user_id": "user-identifier",
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "created_at": "ISO date",
    "updated_at": "ISO date"
  }
]
```

### Create Task
```
POST /api/{user_id}/tasks
```
**Description**: Create a new task for the authenticated user
**Path Parameters**:
- `user_id`: User ID from authenticated session (validated against JWT)
**Headers**:
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`
**Request Body**:
```json
{
  "title": "Task title (required)",
  "description": "Task description (optional)",
  "completed": false (optional, default false)
}
```
**Response**:
- `201 Created` - Created Task object
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid or expired JWT
- `403 Forbidden` - JWT user_id doesn't match URL user_id
- `422 Validation Error` - Validation failed
```json
{
  "id": "uuid-string",
  "user_id": "user-identifier",
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

### Get Specific Task
```
GET /api/{user_id}/tasks/{task_id}
```
**Description**: Retrieve a specific task for the authenticated user
**Path Parameters**:
- `user_id`: User ID from authenticated session (validated against JWT)
- `task_id`: ID of the task to retrieve
**Headers**:
- `Authorization: Bearer <jwt_token>`
**Response**:
- `200 OK` - Task object
- `401 Unauthorized` - Invalid or expired JWT
- `403 Forbidden` - JWT user_id doesn't match URL user_id or task belongs to different user
- `404 Not Found` - Task not found for user
```json
{
  "id": "uuid-string",
  "user_id": "user-identifier",
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

### Update Task
```
PUT /api/{user_id}/tasks/{task_id}
```
**Description**: Update a specific task for the authenticated user
**Path Parameters**:
- `user_id`: User ID from authenticated session (validated against JWT)
- `task_id`: ID of the task to update
**Headers**:
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`
**Request Body** (all fields optional):
```json
{
  "title": "Task title (optional)",
  "description": "Task description (optional)",
  "completed": true/false (optional)
}
```
**Response**:
- `200 OK` - Updated Task object
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or expired JWT
- `403 Forbidden` - JWT user_id doesn't match URL user_id or task belongs to different user
- `404 Not Found` - Task not found for user
- `422 Validation Error` - Validation failed
```json
{
  "id": "uuid-string",
  "user_id": "user-identifier",
  "title": "Updated task title",
  "description": "Updated task description",
  "completed": true,
  "created_at": "Original creation date",
  "updated_at": "ISO date"
}
```

### Delete Task
```
DELETE /api/{user_id}/tasks/{task_id}
```
**Description**: Delete a specific task for the authenticated user
**Path Parameters**:
- `user_id`: User ID from authenticated session (validated against JWT)
- `task_id`: ID of the task to delete
**Headers**:
- `Authorization: Bearer <jwt_token>`
**Response**:
- `204 No Content` - Task successfully deleted
- `401 Unauthorized` - Invalid or expired JWT
- `403 Forbidden` - JWT user_id doesn't match URL user_id or task belongs to different user
- `404 Not Found` - Task not found for user