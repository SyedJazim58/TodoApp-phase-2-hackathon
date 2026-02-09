# Quickstart Guide: Frontend Application & Full-Stack Integration

**Feature**: 003-frontend-fullstack-integration
**Date**: 2026-02-09

## Overview

This guide covers setting up the Next.js frontend application with Better Auth integration and connecting it to the JWT-secured FastAPI backend.

## Prerequisites

1. Backend API (feature 002) must be running and accessible
2. BETTER_AUTH_SECRET configured in both frontend and backend
3. Node.js 18+ installed
4. npm or yarn package manager

## Environment Setup

### Backend Configuration
1. Ensure `BETTER_AUTH_SECRET` is set in backend `.env` file:
```bash
BETTER_AUTH_SECRET=your-secure-secret-here
DATABASE_URL=your-neon-db-url
```

### Frontend Configuration
1. Create `.env.local` in the frontend directory:
```bash
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secure-secret-here
```

## Frontend Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install required packages:
```bash
npm install next react react-dom typescript @types/react @types/node
npm install better-auth
```

## Better Auth Integration

1. Configure Better Auth in `src/lib/better-auth.ts`:
```typescript
import { initClient } from "better-auth/client";
import { betterAuthClient } from "better-auth/client/plugins";

export const client = initClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [betterAuthClient()],
});
```

2. Set up auth middleware in `middleware.ts`:
```typescript
import { authMiddleware } from "better-auth/next-js";

export default authMiddleware({
  matcher: ["/dashboard/:path*", "/api/:path*"], // Protect these routes
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## API Client Setup

1. Create centralized API client in `src/services/api-client.ts`:
```typescript
import { getSession } from "better-auth/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // Get session to extract JWT
  const session = await getSession();
  if (!session?.accessToken) {
    throw new Error('No active session');
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Clear session and redirect to login
    // Implementation for clearing Better Auth session
    window.location.href = '/login';
    return Promise.reject(new Error('Session expired'));
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T; // No content for DELETE
  }

  return response.json() as Promise<T>;
}
```

## Protected Route Component

1. Create protected route component in `src/components/ProtectedRoute/ProtectedRoute.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'better-auth/client';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export default function ProtectedRoute({ children, redirectPath = '/login' }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectPath);
    }
  }, [loading, isAuthenticated, redirectPath, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirect happens via useEffect
  }

  return <>{children}</>;
}
```

## Task CRUD Operations

1. Implement task service in `src/services/task-service.ts`:
```typescript
import { apiClient } from './api-client';
import { TaskView } from '@/types/task';

export const taskService = {
  // Get all tasks for user
  getAllTasks: async (userId: string): Promise<TaskView[]> => {
    return apiClient<TaskView[]>(`/api/${userId}/tasks`);
  },

  // Create a new task
  createTask: async (userId: string, taskData: Partial<TaskView>): Promise<TaskView> => {
    return apiClient<TaskView>(`/api/${userId}/tasks`, {
      method: 'POST',
      body: taskData,
    });
  },

  // Update a task
  updateTask: async (userId: string, taskId: string, taskData: Partial<TaskView>): Promise<TaskView> => {
    return apiClient<TaskView>(`/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      body: taskData,
    });
  },

  // Delete a task
  deleteTask: async (userId: string, taskId: string): Promise<void> => {
    await apiClient(`/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
```

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

3. Visit `http://localhost:3000` to access the application.

## Testing the Integration

1. Visit `/signup` to create a new account
2. Visit `/login` to sign in
3. Navigate to `/dashboard` to view tasks
4. Test CRUD operations to ensure JWT is properly attached to API requests
5. Verify that 401/403 responses are handled correctly

## Troubleshooting

### Common Issues:

1. **JWT not attached to requests**: Ensure Better Auth session is active and `getSession()` returns a valid access token
2. **403 errors**: Check that URL user_id matches the authenticated user_id from JWT
3. **Session not persisting**: Verify BETTER_AUTH_SECRET is consistent between frontend and backend
4. **CORS errors**: Ensure backend allows requests from frontend origin