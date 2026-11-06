/**
 * In-memory Token and Session Manager for Next.js EMS Client
 * - Stores JWT access tokens in memory (never in localStorage/sessionStorage)
 * - Refresh tokens are kept in secure HttpOnly cookies managed by the NestJS backend
 * - Provides a mutex-like promise queue to prevent simultaneous refresh request races
 */

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
type AuthChangeListener = (token: string | null) => void;
const listeners: Set<AuthChangeListener> = new Set();

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
  listeners.forEach((listener) => {
    try {
      listener(token);
    } catch {
      // ignore listener error
    }
  });
};

export const clearAccessToken = (): void => {
  inMemoryAccessToken = null;
  listeners.forEach((listener) => {
    try {
      listener(null);
    } catch {
      // ignore listener error
    }
  });
};

export const subscribeToAuthChanges = (listener: AuthChangeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Thread-safe token refresh mechanism with single-flight mutex
 * Prevents refresh-token rotation races when multiple API requests receive 401 concurrently.
 */
export async function executeRefreshToken(
  apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Transmits HttpOnly refreshToken cookie with the request
        credentials: "include",
      });

      if (!response.ok) {
        clearAccessToken();
        return null;
      }

      const data = await response.json();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }

      clearAccessToken();
      return null;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

