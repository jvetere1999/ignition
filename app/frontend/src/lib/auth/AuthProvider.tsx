"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSession, signOut as apiSignOut, getSignInUrl, type AuthUser } from "./api-auth";

/**
 * Auth context type
 */
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider?: 'google' | 'azure') => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_INVALID_COOKIE = "session_invalid=1; Max-Age=120; Path=/; SameSite=Lax";
const SESSION_INVALID_CLEAR = "session_invalid=; Max-Age=0; Path=/; SameSite=Lax";

function setSessionInvalidCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = SESSION_INVALID_COOKIE;
}

function clearSessionInvalidCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = SESSION_INVALID_CLEAR;
}

/**
 * Auth Provider - manages session state via backend API
 *
 * Replaces NextAuth.js SessionProvider.
 * All auth logic is in the Rust backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session on mount and when window gains focus
    const fetchSession = useCallback(async () => {
      console.log('[AuthProvider] fetchSession called');
      setIsLoading(true);
      try {
        console.log('[AuthProvider] Fetching session...');
        const session = await getSession();
        console.log('[AuthProvider] Session fetch succeeded:', session.user);
        setUser(session.user);
      } catch (err) {
        console.error('[AuthProvider] Session fetch failed:', err);
        setUser(null);
      } finally {
        console.log('[AuthProvider] Setting isLoading to false');
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
      console.log('[AuthProvider] Mounted');
      fetchSession();

      // Refetch on focus (user might have logged in/out in another tab)
      const handleFocus = () => {
        console.log('[AuthProvider] Window focused, refetching session');
        fetchSession();
      };

      // Listen for cross-tab session termination (triggered by 401 in another tab)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === '__session_terminated__' && event.newValue) {
          console.log('[AuthProvider] Detected session termination from another tab');
          try {
            const data = JSON.parse(event.newValue);
            console.log('[AuthProvider] Session terminated at:', new Date(data.timestamp).toISOString(), 'reason:', data.reason);
            // Clear local user state
            setUser(null);
            // Redirect to landing page
            window.location.href = '/';
          } catch (error) {
            console.error('[AuthProvider] Error parsing session termination event:', error);
          }
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('storage', handleStorageChange);
      return () => {
        console.log('[AuthProvider] Unmounted');
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [fetchSession]);

  useEffect(() => {
    if (isLoading) return;
    if (typeof window === "undefined") return;

    if (user) {
      clearSessionInvalidCookie();
      return;
    }

    setSessionInvalidCookie();

    // Redirects are handled by the app layout; avoid competing navigation here.
  }, [isLoading, user]);

  // Sign in - redirect to backend OAuth endpoint
  const signIn = useCallback((provider: 'google' | 'azure' = 'google') => {
    // Get current pathname to redirect back after auth
    const redirectPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const redirectUrl = getSignInUrl(provider, redirectPath);
    console.log('[AuthProvider] Redirecting to:', redirectUrl);
    // Use window.location.href for full page redirect (only way to properly redirect to external OAuth)
    window.location.href = redirectUrl;
  }, []);

  // Sign out - call backend and redirect
  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  // Refresh session data
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook that requires authentication
 * Redirects to sign in if not authenticated
 */
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading, signIn } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  return {
    isLoading,
    user,
    isAuthenticated,
  };
}

/**
 * SessionProvider - alias for AuthProvider for backwards compatibility
 */
export const SessionProvider = AuthProvider;
