# Todo App Phase 2

A modern multi-user web application for task management, built with a FastAPI backend, Next.js 16+ frontend, Neon Serverless PostgreSQL database, and Better Auth authentication.

## Architecture Overview

```
┌─────────────────────┐     JWT Bearer Token     ┌─────────────────────┐
│   Next.js Frontend  │ ──────────────────────►  │   FastAPI Backend   │
│   (Port 3000)       │ ◄──────────────────────  │   (Port 8000)       │
│                     │       JSON Response       │                     │
│  • App Router       │                           │  • RESTful API      │
│  • Better Auth      │                           │  • JWT Verification │
│  • Tailwind CSS     │                           │  • SQLModel ORM     │
└────────┬────────────┘                           └────────┬────────────┘
         │                                                  │
         │  Session/User Storage        Task Data (SSL)     │
         │                                                  │
         └──────────────┐  ┌────────────────────────────────┘
                        ▼  ▼
               ┌─────────────────────┐
               │  Neon Serverless    │
               │  PostgreSQL         │
               │  (Cloud-hosted)     │
               └─────────────────────┘
```

## Tech Stack

| Layer          | Technology                                  |
|----------------|---------------------------------------------|
| Frontend       | Next.js 16+ (App Router), React 19, TypeScript |
| Styling        | Tailwind CSS 4                              |
| Authentication | Better Auth + JWT (HS256)                   |
| Backend        | Python 3.11+, FastAPI 0.109+                |
| ORM            | SQLModel 0.0.14+                            |
| Database       | Neon Serverless PostgreSQL                  |
| Testing        | pytest (backend), coverage reporting        |

## Features

- User registration and login with email/password
- JWT-based API authentication with automatic token management
- Full CRUD task management (create, read, update, delete)
- Task completion toggling with optimistic UI updates
- Multi-user data isolation (users can only access their own tasks)
- Protected routes with middleware and client-side guards
- Responsive dashboard with loading skeletons and toast notifications
- Error boundaries and standardized error handling
- Security headers (CSP, X-Frame-Options, CORS)

## Project Structure

```
TodoApp phase-2/
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── main.py           # App entry point
│   │   ├── api/tasks.py      # Task CRUD endpoints
│   │   ├── auth/             # JWT middleware & dependencies
│   │   ├── database/         # SQLModel engine & session
│   │   ├── models/           # Task data models
│   │   └── repositories/    # Data access layer
│   ├── tests/                # Backend test suite
│   ├── create_table.py       # One-time schema setup
│   └── requirements.txt
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── services/         # API client & task service
│   │   ├── lib/              # Better Auth configuration
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript type definitions
│   └── package.json
├── database/                 # SQL schema files
│   └── schema/
│       └── 001_initial_schema.sql
├── specs/                    # Spec-driven development artifacts
└── history/                  # Prompt History Records
```

## API Endpoints

All task endpoints require a valid JWT Bearer token in the `Authorization` header.

| Method   | Endpoint                          | Description         | Status |
|----------|-----------------------------------|---------------------|--------|
| `GET`    | `/health`                         | Health check        | 200    |
| `GET`    | `/api/{user_id}/tasks`            | List user's tasks   | 200    |
| `POST`   | `/api/{user_id}/tasks`            | Create a task       | 201    |
| `PUT`    | `/api/{user_id}/tasks/{task_id}`  | Update a task       | 200    |
| `DELETE` | `/api/{user_id}/tasks/{task_id}`  | Delete a task       | 204    |

## Authentication Flow

1. User signs up or logs in via the frontend (Better Auth handles session creation)
2. Frontend generates a JWT token signed with `BETTER_AUTH_SECRET` (HS256, 1-hour expiry)
3. API requests include the token in the `Authorization: Bearer <token>` header
4. Backend verifies the JWT signature and extracts `user_id` and `email` claims
5. Backend validates that the JWT `user_id` matches the URL path `user_id`
6. Data is filtered to return only the authenticated user's tasks

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Neon PostgreSQL database ([neon.tech](https://neon.tech))

### Environment Setup

**Backend** — create `backend/.env` (see `backend/.env.example`):

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
BETTER_AUTH_SECRET=your-shared-secret-key
LOG_LEVEL=INFO
```

**Frontend** — create `frontend/.env.local` (see `frontend/.env.example`):

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
BETTER_AUTH_SECRET=your-shared-secret-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

> `BETTER_AUTH_SECRET` must be identical in both backend and frontend.

### Database Setup

```bash
cd backend
pip install -r requirements.txt
python create_table.py
```

### Run Backend

```bash
cd backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Run Tests

```bash
cd backend
pytest
```

## Development Approach

This project follows the **Agentic Dev Stack** workflow powered by **Spec-Kit Plus**:

1. **Write Spec** — Define feature requirements in `specs/<feature>/spec.md`
2. **Generate Plan** — Create architectural plans in `specs/<feature>/plan.md`
3. **Break into Tasks** — Produce testable tasks in `specs/<feature>/tasks.md`
4. **Implement** — Execute tasks via Claude Code with specialized agents

All development decisions are tracked through Prompt History Records (PHRs) and Architecture Decision Records (ADRs).

## License

This project is for educational and development purposes.
