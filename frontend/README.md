# Frontend - Todo App Phase 2

Next.js 16+ application with App Router for multi-user task management.

## Technology Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Runtime**: React 19.2.4
- **Language**: TypeScript 5.9.3
- **Authentication**: Better Auth (to be installed in T003)
- **Styling**: Tailwind CSS or CSS Modules (to be configured in T005)
- **API Communication**: REST API with JWT authentication

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout with Better Auth provider
│   │   ├── page.tsx         # Landing page
│   │   ├── globals.css      # Global styles
│   │   ├── login/           # Login page (T020)
│   │   ├── signup/          # Signup page (T019)
│   │   ├── dashboard/       # Dashboard page (T023)
│   │   └── api/             # API routes (Better Auth handler)
│   ├── components/          # Reusable React components
│   │   ├── TaskList/        # Task list component (T030)
│   │   ├── TaskForm/        # Task form component (T031)
│   │   ├── ProtectedRoute/  # Protected route wrapper (T015)
│   │   ├── Navbar/          # Navigation bar (T022)
│   │   └── ErrorBoundary/   # Error boundary (T016)
│   ├── services/            # API clients and business logic
│   │   ├── api-client.ts    # Centralized API client (T010, T011)
│   │   ├── auth-service.ts  # Auth service wrapper (T024)
│   │   └── task-service.ts  # Task CRUD operations (T033)
│   ├── lib/                 # Utility libraries
│   │   └── better-auth.ts   # Better Auth configuration (T009)
│   └── types/               # TypeScript type definitions
│       ├── task.ts          # Task entity types (T013)
│       └── api.ts           # API response types (T014)
├── public/                  # Static assets
├── tests/                   # Frontend tests
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── .env.local               # Environment variables (T006)
```

## Development Scripts

```bash
# Install dependencies (T002, T003, T004, T005)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Variables

Create a `.env.local` file with the following variables (T006):

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Better Auth URL (same as app URL in development)
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Better Auth Secret (must match backend .env)
BETTER_AUTH_SECRET=your-secret-key-here
```

## Development Workflow

### Current Status: T001 Complete

✅ Next.js 16+ project structure created with App Router
✅ TypeScript configured with strict mode
✅ Basic directory structure in place
✅ next.config.js configured with security headers
✅ Package.json updated with proper scripts

### Next Steps

1. **T002**: Install Next.js dependencies
2. **T003**: Install Better Auth library
3. **T004**: Configure TypeScript
4. **T005**: Setup Tailwind CSS
5. **T006**: Create environment files

## Architecture Decisions

### Server Components First

By default, all components in the `app/` directory are Server Components. This provides:
- Better performance (less JavaScript sent to client)
- Direct database/API access
- Improved SEO

Client Components (`'use client'` directive) are used only when needed:
- Interactive UI elements (forms, buttons with onClick)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)

### Authentication Flow

1. User signs up/logs in via Better Auth
2. Better Auth issues JWT token (7-day expiry)
3. Token stored in session
4. API client automatically attaches token to requests
5. Backend verifies token and user identity

### API Communication

- Centralized API client (`services/api-client.ts`)
- Automatic JWT extraction and attachment
- Error handling for 401 (auth), 403 (authz), 500 (server)
- User data isolation enforced by backend

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Performance Goals

- Initial page load: < 3s
- API response time: < 2s
- UI interactions: 60fps

## Security Considerations

- JWT tokens for stateless authentication
- HTTPS enforcement in production
- Content Security Policy headers
- No sensitive data in client-side code
- User data isolation at backend level

## Related Documentation

- [Feature Spec](/specs/003-frontend-fullstack-integration/spec.md)
- [Implementation Plan](/specs/003-frontend-fullstack-integration/plan.md)
- [Tasks](/specs/003-frontend-fullstack-integration/tasks.md)
- [Backend README](/backend/README.md)

## Questions or Issues?

Refer to the project documentation or contact the development team.
