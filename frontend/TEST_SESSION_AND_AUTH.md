# Testing Session Expiry and Authorization (User Stories 3 & 4)

This document provides step-by-step instructions for testing the session expiry handling and authorization enforcement features.

**Feature:** 003-frontend-fullstack-integration
**User Stories:** US3 (Session Expiry) and US4 (Authorization Enforcement)
**Tasks:** T044-T062
**Created:** 2026-02-09

---

## Prerequisites

1. Backend is running on `http://localhost:8000`
2. Frontend is running on `http://localhost:3000`
3. You have at least 2 test user accounts created

---

## User Story 3: Session Expiry and Re-authentication

### Test Case 1: Token Expiry During Task Creation

**Objective:** Verify that when JWT expires during task creation, user is redirected to login with clear message

**Steps:**

1. **Setup:**
   - Log in to the application
   - Navigate to the dashboard
   - Open browser DevTools → Application → Cookies
   - Note the `better-auth.session_token` cookie

2. **Simulate Token Expiry:**
   - Option A (Manual): Delete the `better-auth.session_token` cookie
   - Option B (Backend): Temporarily set JWT expiry to 30 seconds in backend `.env`:
     ```
     JWT_EXPIRATION_MINUTES=0.5
     ```
   - Wait for token to expire

3. **Trigger Action:**
   - Click "Add Task" button
   - Fill in task details (title, description)
   - Click "Create Task"

4. **Expected Behavior:**
   - Request returns 401 status
   - User is automatically redirected to `/login?expired=true`
   - Login page displays: "Your session has expired. Please log in again to continue your action."
   - Session is cleared (Better Auth signOut called)

5. **Verify:**
   - Check browser console for "Authentication failed: Token expired or invalid"
   - Verify redirect URL contains `expired=true` parameter
   - Confirm no crash or error boundary triggered

### Test Case 2: Session Restoration After Re-authentication

**Objective:** Verify that after re-login, user can resume their action

**Steps:**

1. **Continue from Test Case 1:**
   - After being redirected to login, enter valid credentials
   - Click "Log in"

2. **Expected Behavior:**
   - Login is successful
   - User is redirected to dashboard
   - Previously entered task data is **not** automatically re-submitted (context storage is in place but user must re-initiate)

3. **Verify:**
   - Login page shows "Login successful! Redirecting..."
   - User lands on dashboard successfully
   - JWT token is present in cookies
   - User can now create tasks normally

### Test Case 3: Token Expiry During Task Edit

**Objective:** Verify session expiry handling during edit operations

**Steps:**

1. **Setup:**
   - Log in and create a test task
   - Simulate token expiry (see Test Case 1, step 2)

2. **Trigger Action:**
   - Click "Edit" on an existing task
   - Modify task details
   - Click "Save"

3. **Expected Behavior:**
   - Same as Test Case 1
   - Redirect to login with session expired message
   - After re-login, user can edit tasks normally

### Test Case 4: Fresh JWT After Re-authentication

**Objective:** Verify that new JWT allows normal operations

**Steps:**

1. **After Re-authentication:**
   - Check cookies: New `better-auth.session_token` should be present
   - Perform multiple task operations:
     - Create a task
     - Edit a task
     - Mark task as complete
     - Delete a task

2. **Expected Behavior:**
   - All operations succeed without authentication errors
   - No redirects to login
   - Normal application behavior

---

## User Story 4: Authorization Enforcement

### Test Case 5: Cross-User Access Prevention

**Objective:** Verify that accessing another user's resources returns 403

**Steps:**

1. **Setup:**
   - Log in as User A (e.g., `user1@example.com`)
   - Note your user ID in the URL (e.g., `/api/user-abc123/tasks`)
   - Create 1-2 test tasks

2. **Log in as Second User:**
   - Log out from User A
   - Log in as User B (e.g., `user2@example.com`)
   - Note User B's user ID (e.g., `user-xyz789`)

3. **Attempt Cross-User Access:**
   - Open browser DevTools → Console
   - Execute this JavaScript to attempt accessing User A's tasks:
     ```javascript
     fetch('http://localhost:8000/api/user-abc123/tasks', {
       headers: {
         'Authorization': 'Bearer ' + document.cookie.match(/better-auth\.session_token=([^;]+)/)[1]
       }
     }).then(r => r.json()).then(console.log)
     ```
   - Replace `user-abc123` with User A's actual user ID

4. **Expected Behavior:**
   - Backend returns 403 Forbidden status
   - Response body contains:
     ```json
     {
       "error": "Access Denied: You cannot access another user's resources.",
       "code": "ACCESS_DENIED"
     }
     ```

5. **Verify:**
   - Check browser console: Error logged
   - If this triggers a page action, AccessDenied component should display
   - No crash or application freeze

### Test Case 6: Backend JWT Validation

**Objective:** Verify backend validates JWT user_id against URL user_id

**Steps:**

1. **Review Backend Code:**
   - Open `backend/src/api/task_routes.py`
   - Locate the JWT validation middleware
   - Verify it extracts `sub` (subject) from JWT
   - Verify it compares JWT `sub` with `user_id` path parameter

2. **Expected Implementation:**
   ```python
   # In JWT middleware
   jwt_user_id = payload.get("sub")
   url_user_id = request.path_params.get("user_id")

   if jwt_user_id != url_user_id:
       raise HTTPException(status_code=403, detail="Access denied")
   ```

3. **Test with Invalid JWT:**
   - Attempt API call with malformed JWT token
   - Expected: 401 Unauthorized (not 403)
   - Frontend should clear session and redirect to login

### Test Case 7: Frontend Error Boundary for 403

**Objective:** Verify ErrorBoundary catches 403 without crash

**Steps:**

1. **Trigger 403 in Component:**
   - Modify dashboard to force 403 error (temporary test code):
     ```typescript
     // In dashboard page, add this line temporarily
     throw new ApiError("Test 403", 403, "ACCESS_DENIED");
     ```

2. **Expected Behavior:**
   - ErrorBoundary catches the error
   - AccessDenied component is displayed
   - "Return to Dashboard" button is shown
   - No white screen or application crash

3. **Cleanup:**
   - Remove the test code after verification

### Test Case 8: Unauthenticated Access Handling

**Objective:** Verify unauthenticated users get 401 (not 403)

**Steps:**

1. **Setup:**
   - Log out completely
   - Clear all cookies
   - Try to access `/dashboard` directly

2. **Expected Behavior:**
   - Middleware detects no session
   - User is redirected to `/login?redirect=/dashboard`
   - **NOT** a 403 error (since user isn't authenticated to be authorized)

3. **API Call Test:**
   - Make direct API call without JWT:
     ```javascript
     fetch('http://localhost:8000/api/user-123/tasks')
       .then(r => r.json())
       .then(console.log)
     ```

4. **Expected Response:**
   - 401 Unauthorized status
   - Not 403 Forbidden (user isn't authenticated yet)

### Test Case 9: Malformed JWT Token Handling

**Objective:** Verify malformed tokens trigger authentication error

**Steps:**

1. **Setup:**
   - Log in normally
   - Open browser DevTools → Console

2. **Corrupt the JWT:**
   - Execute:
     ```javascript
     document.cookie = "better-auth.session_token=invalid.jwt.token; path=/";
     ```

3. **Trigger API Call:**
   - Refresh the dashboard page
   - Or click any action (create task, edit, etc.)

4. **Expected Behavior:**
   - Backend rejects malformed JWT → 401 response
   - Frontend detects 401
   - Session is cleared
   - User is redirected to login
   - Message: "Your session has expired. Please log in again."

5. **Verify:**
   - No 403 error (authorization check happens after authentication)
   - Clean redirect without crash

---

## Acceptance Criteria Checklist

### User Story 3: Session Expiry
- [ ] T044: 401 interceptor detects expired tokens
- [ ] T045: Session cleared using Better Auth signOut
- [ ] T046: Redirect to `/login?expired=true` on 401
- [ ] T047: Toast component exists (already implemented)
- [ ] T048: "Session expired" message displays on login page
- [ ] T049: Request context preserved (non-GET requests)
- [ ] T050: Session restoration after re-authentication works
- [ ] T051: Token expiry during task creation handled gracefully
- [ ] T052: Token expiry during task editing handled gracefully
- [ ] T053: Fresh JWT allows normal operations

### User Story 4: Authorization
- [ ] T054: 403 handler implemented in api-client.ts
- [ ] T055: AccessDenied component created
- [ ] T056: "Access Denied" message displays on 403
- [ ] T057: "Return to Dashboard" button navigates correctly
- [ ] T058: Cross-user access prevented (manual URL modification test)
- [ ] T059: Backend validates JWT user_id vs URL user_id
- [ ] T060: ErrorBoundary catches 403 without crash
- [ ] T061: Unauthenticated users get login redirect (not 403)
- [ ] T062: Malformed JWT triggers 401 with session clear

---

## Debugging Tips

### If Session Expiry Isn't Working:

1. **Check JWT Expiration:**
   - Verify `JWT_EXPIRATION_MINUTES` in backend `.env`
   - Decode JWT token at https://jwt.io to check expiry timestamp

2. **Check API Client:**
   - Open `frontend/src/services/api-client.ts`
   - Verify 401 handler calls `authClient.signOut()`
   - Verify redirect to `/login?expired=true`

3. **Check Login Page:**
   - Open `frontend/src/app/login/page.tsx`
   - Verify `expiredParam` query parameter is read
   - Verify error message is displayed

### If Authorization Isn't Working:

1. **Check Backend Validation:**
   - Open `backend/src/api/task_routes.py` or JWT middleware
   - Verify JWT `sub` claim is compared with URL `user_id`
   - Verify 403 is returned on mismatch

2. **Check Frontend 403 Handler:**
   - Open `frontend/src/services/api-client.ts`
   - Verify 403 response throws ApiError with statusCode 403
   - Check ErrorBoundary catches 403 and shows AccessDenied

3. **Check Browser Console:**
   - Look for error logs
   - Check network tab for actual status codes
   - Verify JWT token is being sent in Authorization header

---

## Next Steps

After completing all test cases:

1. Mark tasks T044-T062 as complete in `specs/003-frontend-fullstack-integration/tasks.md`
2. Document any issues found in GitHub issues or task notes
3. Proceed to Phase 7: Polish & Cross-Cutting Concerns (T063-T075)

---

## Notes

- All tests should be performed in both Chrome and Firefox
- Test on both desktop and mobile viewport sizes
- Verify console has no uncaught errors
- Ensure all redirects happen smoothly without flashing
- Check that error messages are user-friendly and actionable
