/**
 * Better Auth API Route Handler
 *
 * Catch-all API route for Better Auth endpoints.
 * Uses Better Auth's toNextJsHandler to directly handle
 * authentication requests (signup, login, session, signout).
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T025
 * Created: 2026-02-09
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);

/**
 * Route segment config
 *
 * Configure this route to be dynamic (not statically generated)
 * since it handles authentication requests that vary per user.
 */
export const dynamic = 'force-dynamic';
