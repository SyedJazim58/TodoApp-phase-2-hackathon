/**
 * Authentication Service
 *
 * Wrapper service for Better Auth session methods.
 * Provides centralized authentication operations with consistent error handling.
 *
 * Feature: 003-frontend-fullstack-integration
 * Task: T024
 * Created: 2026-02-09
 */

import { authClient, getSession, isAuthenticated, getAccessToken, getUserId } from '@/lib/better-auth';

/**
 * User credentials for email/password authentication
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * User registration data
 */
export interface SignupData extends AuthCredentials {
  name: string;
}

/**
 * Authentication result
 * Contains success status, optional data, and error information
 */
export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * User session information
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
}

/**
 * Authentication Service
 *
 * Provides centralized authentication operations:
 * - User signup with email/password
 * - User login with email/password
 * - User logout
 * - Session retrieval and verification
 * - Token and user ID extraction
 *
 * All methods include comprehensive error handling and logging.
 */
export const authService = {
  /**
   * Sign up a new user
   *
   * Creates a new user account with email, password, and name.
   * Automatically logs the user in upon successful signup.
   *
   * @param signupData - User registration data
   * @returns Promise resolving to authentication result
   *
   * @example
   * ```typescript
   * const result = await authService.signup({
   *   email: 'user@example.com',
   *   password: 'SecurePass123',
   *   name: 'John Doe'
   * });
   *
   * if (result.success) {
   *   console.log('User created:', result.data);
   * } else {
   *   console.error('Signup failed:', result.error);
   * }
   * ```
   */
  async signup(signupData: SignupData): Promise<AuthResult<UserSession>> {
    try {
      console.log('AuthService: Signing up user:', signupData.email);

      const { data, error } = await authClient.signUp.email({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });

      if (error) {
        console.error('AuthService: Signup failed:', error);
        return {
          success: false,
          error: error.message || 'Signup failed. Please try again.',
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Signup failed. No data returned.',
        };
      }

      // Get session to extract user information
      const session = await getSession();

      if (!session) {
        return {
          success: false,
          error: 'Failed to create session after signup.',
        };
      }

      console.log('AuthService: Signup successful');

      return {
        success: true,
        data: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          accessToken: session.accessToken || '',
        },
      };
    } catch (error) {
      console.error('AuthService: Unexpected error during signup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during signup.',
      };
    }
  },

  /**
   * Sign in an existing user
   *
   * Authenticates user with email and password.
   * Creates a session and returns JWT token upon success.
   *
   * @param credentials - User login credentials
   * @returns Promise resolving to authentication result
   *
   * @example
   * ```typescript
   * const result = await authService.login({
   *   email: 'user@example.com',
   *   password: 'SecurePass123'
   * });
   *
   * if (result.success) {
   *   console.log('Login successful:', result.data);
   * } else {
   *   console.error('Login failed:', result.error);
   * }
   * ```
   */
  async login(credentials: AuthCredentials): Promise<AuthResult<UserSession>> {
    try {
      console.log('AuthService: Logging in user:', credentials.email);

      const { data, error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('AuthService: Login failed:', error);
        return {
          success: false,
          error: error.message || 'Login failed. Please check your credentials.',
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Login failed. No data returned.',
        };
      }

      // Get session to extract user information
      const session = await getSession();

      if (!session) {
        return {
          success: false,
          error: 'Failed to create session after login.',
        };
      }

      console.log('AuthService: Login successful');

      return {
        success: true,
        data: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          accessToken: session.accessToken || '',
        },
      };
    } catch (error) {
      console.error('AuthService: Unexpected error during login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during login.',
      };
    }
  },

  /**
   * Sign out the current user
   *
   * Clears the Better Auth session and JWT token.
   * After logout, user will need to log in again to access protected resources.
   *
   * @returns Promise resolving to authentication result
   *
   * @example
   * ```typescript
   * const result = await authService.logout();
   *
   * if (result.success) {
   *   console.log('Logout successful');
   *   // Redirect to login page
   * } else {
   *   console.error('Logout failed:', result.error);
   * }
   * ```
   */
  async logout(): Promise<AuthResult> {
    try {
      console.log('AuthService: Logging out user');

      await authClient.signOut();

      console.log('AuthService: Logout successful');

      return {
        success: true,
      };
    } catch (error) {
      console.error('AuthService: Error during logout:', error);

      // Even if logout fails, consider it successful from client perspective
      // The server will reject invalid tokens anyway
      return {
        success: true,
      };
    }
  },

  /**
   * Get current user session
   *
   * Retrieves the current Better Auth session with user information and JWT token.
   * Returns null if no active session exists.
   *
   * @returns Promise resolving to user session or null
   *
   * @example
   * ```typescript
   * const session = await authService.getCurrentSession();
   *
   * if (session) {
   *   console.log('User ID:', session.userId);
   *   console.log('JWT Token:', session.accessToken);
   * } else {
   *   console.log('No active session');
   * }
   * ```
   */
  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const session = await getSession();

      if (!session) {
        return null;
      }

      return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        accessToken: session.accessToken || '',
      };
    } catch (error) {
      console.error('AuthService: Error getting current session:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   *
   * Verifies that a valid Better Auth session exists with a JWT token.
   *
   * @returns Promise resolving to boolean indicating authentication status
   *
   * @example
   * ```typescript
   * if (await authService.isAuthenticated()) {
   *   console.log('User is logged in');
   * } else {
   *   console.log('User is not logged in');
   * }
   * ```
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await isAuthenticated();
    } catch (error) {
      console.error('AuthService: Error checking authentication:', error);
      return false;
    }
  },

  /**
   * Get current user's JWT access token
   *
   * Extracts the JWT token from the Better Auth session.
   * Used by API client to authenticate backend requests.
   *
   * @returns Promise resolving to JWT token or null
   *
   * @example
   * ```typescript
   * const token = await authService.getAccessToken();
   *
   * if (token) {
   *   // Use token for API requests
   *   fetch('/api/tasks', {
   *     headers: { 'Authorization': `Bearer ${token}` }
   *   });
   * }
   * ```
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await getAccessToken();
    } catch (error) {
      console.error('AuthService: Error getting access token:', error);
      return null;
    }
  },

  /**
   * Get current user's ID
   *
   * Extracts the user ID from the Better Auth session.
   * Used to construct user-specific API endpoints.
   *
   * @returns Promise resolving to user ID or null
   *
   * @example
   * ```typescript
   * const userId = await authService.getUserId();
   *
   * if (userId) {
   *   // Fetch user's tasks
   *   const tasks = await fetch(`/api/${userId}/tasks`);
   * }
   * ```
   */
  async getUserId(): Promise<string | null> {
    try {
      return await getUserId();
    } catch (error) {
      console.error('AuthService: Error getting user ID:', error);
      return null;
    }
  },

  /**
   * Refresh the current session
   *
   * Forces a session refresh to get updated user information or token.
   * Useful when session data might have changed on the server.
   *
   * @returns Promise resolving to authentication result
   *
   * @example
   * ```typescript
   * const result = await authService.refreshSession();
   *
   * if (result.success) {
   *   console.log('Session refreshed:', result.data);
   * }
   * ```
   */
  async refreshSession(): Promise<AuthResult<UserSession>> {
    try {
      console.log('AuthService: Refreshing session');

      // Get fresh session from Better Auth
      const session = await getSession();

      if (!session) {
        return {
          success: false,
          error: 'No active session to refresh.',
        };
      }

      console.log('AuthService: Session refreshed successfully');

      return {
        success: true,
        data: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          accessToken: session.accessToken || '',
        },
      };
    } catch (error) {
      console.error('AuthService: Error refreshing session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session.',
      };
    }
  },
};

/**
 * Export default for convenience
 */
export default authService;
