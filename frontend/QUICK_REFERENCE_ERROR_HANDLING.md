# Quick Reference: Error Handling in Todo App

**Quick guide for developers working with session expiry and authorization errors**

---

## Import Statements

```typescript
// API Client
import { apiClient, ApiError } from '@/services/api-client';
import { retryStoredRequest, clearStoredRequestContext } from '@/services/api-client';

// Components
import AccessDenied, { InlineAccessDenied } from '@/components/AccessDenied/AccessDenied';

// Hooks
import useApiError from '@/hooks/useApiError';

// Better Auth
import { authClient } from '@/lib/better-auth';
```

---

## Handling 401 (Session Expiry) in Components

### Automatic Handling (Default)

The API client automatically handles 401 responses:

```typescript
try {
  const tasks = await apiClient.get('/api/user-123/tasks');
  // No special handling needed - 401 auto-redirects to login
} catch (error) {
  // Only non-401 errors reach here
  console.error('Error:', error);
}
```

### Manual Session Check

```typescript
import { isAuthenticated } from '@/lib/better-auth';

const authenticated = await isAuthenticated();
if (!authenticated) {
  router.push('/login');
}
```

---

## Handling 403 (Authorization Failure)

### Option 1: Using useApiError Hook (Recommended)

```typescript
import useApiError from '@/hooks/useApiError';

function MyComponent() {
  const { error, setError, returnToDashboard } = useApiError();

  async function fetchData() {
    try {
      const data = await apiClient.get('/api/user-123/tasks');
      setTasks(data);
    } catch (err) {
      setError(err); // Automatically categorizes error
    }
  }

  // Display AccessDenied for 403 errors
  if (error?.isAccessDenied) {
    return (
      <InlineAccessDenied
        message={error.message}
        onReturnToDashboard={returnToDashboard}
      />
    );
  }

  return <div>Content</div>;
}
```

### Option 2: Manual Error Handling

```typescript
import { ApiError } from '@/services/api-client';
import AccessDenied from '@/components/AccessDenied/AccessDenied';

function MyComponent() {
  const [error, setError] = useState<ApiError | null>(null);

  async function fetchData() {
    try {
      const data = await apiClient.get('/api/user-123/tasks');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      }
    }
  }

  if (error?.statusCode === 403) {
    return <AccessDenied message={error.message} />;
  }

  return <div>Content</div>;
}
```

### Option 3: Using ErrorBoundary (For Component Tree Errors)

```typescript
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

// In parent component or layout
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// ErrorBoundary automatically shows AccessDenied for 403 errors
```

---

## Login Page Integration

### Reading Session Expiry Status

```typescript
const searchParams = useSearchParams();
const expiredParam = searchParams.get('expired');
const redirectPath = searchParams.get('redirect') || '/dashboard';

if (expiredParam === 'true') {
  // Show "session expired" message
  setErrors({ general: 'Your session has expired. Please log in again.' });
}
```

### Retrying After Re-authentication

```typescript
import { retryStoredRequest, getStoredRequestContext } from '@/services/api-client';

// After successful login
if (getStoredRequestContext() !== null) {
  try {
    await retryStoredRequest();
    console.log('Successfully retried stored request');
  } catch (error) {
    console.error('Failed to retry:', error);
  }
}
```

---

## Common Patterns

### Pattern 1: Fetch Data with Error Handling

```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(true);
const { error, setError, hasError } = useApiError();

useEffect(() => {
  async function fetchTasks() {
    try {
      const data = await apiClient.get<Task[]>('/api/user-123/tasks');
      setTasks(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }
  fetchTasks();
}, []);

if (loading) return <Loading />;
if (error?.isAccessDenied) return <InlineAccessDenied />;
if (hasError) return <ErrorMessage message={error.message} />;
return <TaskList tasks={tasks} />;
```

### Pattern 2: Form Submission with Error Handling

```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    const newTask = await apiClient.post('/api/user-123/tasks', {
      title,
      description,
    });
    onSuccess(newTask);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.statusCode === 403) {
        setError('You cannot perform this action');
      } else if (err.statusCode === 422) {
        setError('Invalid data. Please check your input.');
      } else {
        setError(err.message);
      }
    }
  } finally {
    setLoading(false);
  }
}
```

### Pattern 3: Wrapping with ErrorBoundary

```typescript
// In layout or page component
export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        // Optional: Log to error tracking service
        console.error('ErrorBoundary caught:', error);
      }}
    >
      <Navbar />
      <main>{children}</main>
    </ErrorBoundary>
  );
}
```

---

## Status Code Reference

| Code | Meaning | Auto-Handled | Action |
|------|---------|--------------|--------|
| 401 | Session expired / Invalid JWT | ✅ Yes | Auto-redirects to login with expiry message |
| 403 | Authorization failure | ❌ No | Throw ApiError, catch in component |
| 404 | Resource not found | ❌ No | Handle in component |
| 422 | Validation error | ❌ No | Handle in component |
| 500+ | Server error | ❌ No | Handle in component |
| 0 | Network error | ❌ No | Handle in component |

---

## Error Messages

### Standard Error Messages by Code

```typescript
// Use these consistent messages across the app
const ERROR_MESSAGES = {
  401: 'Your session has expired. Please log in again.',
  403: 'Access Denied: You cannot access another user\'s resources.',
  404: 'The requested resource was not found.',
  422: 'Request validation failed. Please check your input.',
  500: 'A server error occurred. Please try again later.',
  0: 'Unable to connect to the server. Please check your internet connection.',
};
```

---

## Testing Error Handling

### Simulate 401 (Session Expiry)

```javascript
// In browser console
document.cookie = "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
// Then perform any action
```

### Simulate 403 (Authorization)

```javascript
// In browser console - attempt to access another user's tasks
const otherUserId = 'user-xyz789'; // Different from your user ID
fetch(`http://localhost:8000/api/${otherUserId}/tasks`, {
  headers: {
    'Authorization': 'Bearer ' + yourJwtToken
  }
}).then(r => r.json()).then(console.log);
```

### Simulate Malformed JWT

```javascript
// In browser console
document.cookie = "better-auth.session_token=invalid.jwt.token; path=/";
// Then perform any action
```

---

## Troubleshooting

### Problem: 401 not redirecting to login

**Check:**
1. API client is imported from `@/services/api-client`
2. Request uses `apiClient.get/post/put/delete` methods
3. `requiresAuth` is not set to `false`
4. Browser console shows no JavaScript errors

### Problem: 403 not showing AccessDenied component

**Check:**
1. Component wraps API calls in try/catch
2. Error is instance of `ApiError`
3. Error has `statusCode === 403`
4. ErrorBoundary is present in component tree (if using boundary)

### Problem: Context not preserved after re-login

**Check:**
1. Request was non-GET method (POST, PUT, DELETE, PATCH)
2. Request failed with 401 status
3. SessionStorage has `pending_request_context` key
4. Context is less than 5 minutes old

---

## Best Practices

1. **Always use apiClient:** Don't use raw `fetch()` for authenticated requests
2. **Wrap with ErrorBoundary:** Wrap major sections to catch unexpected errors
3. **Use useApiError hook:** Consistent error handling across components
4. **Clear error messages:** Use user-friendly language, not technical jargon
5. **Provide recovery paths:** Always give users a way to recover or navigate away
6. **Log errors:** Console log errors for debugging (remove in production)
7. **Handle all status codes:** Don't assume only 200 or 401 can occur
8. **Test error scenarios:** Regularly test 401 and 403 flows

---

## Component API Reference

### AccessDenied Component

```typescript
interface AccessDeniedProps {
  message?: string; // Default: standard access denied message
  showDashboardButton?: boolean; // Default: true
  onReturnToDashboard?: () => void; // Custom callback
}

// Usage
<AccessDenied
  message="You cannot access this task"
  onReturnToDashboard={() => router.push('/dashboard')}
/>
```

### InlineAccessDenied Component

```typescript
interface InlineAccessDeniedProps {
  message?: string; // Default: standard message
  onReturnToDashboard?: () => void; // Custom callback
}

// Usage - for inline display
<InlineAccessDenied message="Access denied to this resource" />
```

### useApiError Hook

```typescript
interface UseApiErrorReturn {
  error: ErrorState | null; // Current error or null
  setError: (error: Error | ApiError | string) => void;
  clearError: () => void;
  hasError: boolean; // Quick check if error exists
  returnToDashboard: () => void; // Navigate to /dashboard
}

interface ErrorState {
  message: string;
  code?: string;
  statusCode?: number;
  isAccessDenied: boolean; // True if 403
  isAuthenticationError: boolean; // True if 401
}
```

---

## Quick Commands

```bash
# View error handling implementation
code frontend/src/services/api-client.ts
code frontend/src/components/AccessDenied/AccessDenied.tsx
code frontend/src/hooks/useApiError.ts

# Run tests
npm run test # (when tests are implemented)

# Check test documentation
code frontend/TEST_SESSION_AND_AUTH.md
```

---

## Need Help?

- **Full Documentation:** See `IMPLEMENTATION_SUMMARY_US3_US4.md`
- **Testing Guide:** See `TEST_SESSION_AND_AUTH.md`
- **Code Examples:** See components in `src/app/dashboard/page.tsx`
