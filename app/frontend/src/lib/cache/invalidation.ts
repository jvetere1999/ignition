/**
 * Cache Invalidation Strategy
 *
 * This module provides utilities for managing query cache invalidation
 * when mutations occur, ensuring sync state stays fresh.
 *
 * Problem: When user creates/updates a goal, the /api/sync/poll cache
 * should be invalidated to fetch fresh data immediately.
 *
 * Solution: Mutation hooks that trigger cache invalidation.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Query cache key type
 *
 * Maps action to list of cache keys it should invalidate
 */
export type CacheKeyMap = Record<string, string[]>;

/**
 * Standard cache keys used across the app
 */
export const CACHE_KEYS = {
  // Sync data
  SYNC_STATE: 'sync-state',
  BADGES: 'badges',
  PROGRESS: 'progress',
  PLAN: 'plan',
  FOCUS: 'focus',

  // Feature data
  GOALS: 'goals',
  HABITS: 'habits',
  QUESTS: 'quests',
  EXERCISES: 'exercises',
  BOOKS: 'books',
  EVENTS: 'events',
  LEARNING: 'learning',

  // User data
  USER_PROFILE: 'user-profile',
  USER_SETTINGS: 'user-settings',
  USER_PROGRESS: 'user-progress',

  // Admin data
  ADMIN_DASHBOARD: 'admin-dashboard',
  ADMIN_USERS: 'admin-users',
} as const;

/**
 * Invalidation map: which mutations invalidate which queries
 *
 * Used to keep cache fresh across the app
 */
export const INVALIDATION_MAP: CacheKeyMap = {
  // Creating/updating habits invalidates sync and habits
  'CREATE_HABIT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.HABITS, CACHE_KEYS.BADGES],
  'UPDATE_HABIT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.HABITS],
  'COMPLETE_HABIT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.HABITS, CACHE_KEYS.PROGRESS, CACHE_KEYS.BADGES],
  'DELETE_HABIT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.HABITS],

  // Creating/updating goals invalidates sync and goals
  'CREATE_GOAL': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.GOALS, CACHE_KEYS.BADGES],
  'UPDATE_GOAL': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.GOALS],
  'COMPLETE_GOAL': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.GOALS, CACHE_KEYS.PROGRESS, CACHE_KEYS.BADGES],
  'DELETE_GOAL': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.GOALS],

  // Creating/updating quests invalidates sync and quests
  'CREATE_QUEST': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.QUESTS, CACHE_KEYS.BADGES],
  'ACCEPT_QUEST': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.QUESTS],
  'COMPLETE_QUEST': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.QUESTS, CACHE_KEYS.PROGRESS, CACHE_KEYS.BADGES],
  'DELETE_QUEST': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.QUESTS],

  // Focus session changes invalidate focus cache
  'START_FOCUS': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.FOCUS],
  'PAUSE_FOCUS': [CACHE_KEYS.FOCUS],
  'RESUME_FOCUS': [CACHE_KEYS.FOCUS],
  'END_FOCUS': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.FOCUS, CACHE_KEYS.PROGRESS, CACHE_KEYS.BADGES],

  // Workouts/exercises
  'CREATE_WORKOUT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EXERCISES, CACHE_KEYS.BADGES],
  'COMPLETE_WORKOUT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EXERCISES, CACHE_KEYS.PROGRESS, CACHE_KEYS.BADGES],
  'DELETE_WORKOUT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EXERCISES],

  // Books
  'CREATE_BOOK': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.BOOKS, CACHE_KEYS.BADGES],
  'UPDATE_BOOK': [CACHE_KEYS.BOOKS],
  'DELETE_BOOK': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.BOOKS],

  // Events/Calendar
  'CREATE_EVENT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EVENTS, CACHE_KEYS.PLAN],
  'UPDATE_EVENT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EVENTS, CACHE_KEYS.PLAN],
  'DELETE_EVENT': [CACHE_KEYS.SYNC_STATE, CACHE_KEYS.EVENTS, CACHE_KEYS.PLAN],

  // User profile/settings
  'UPDATE_PROFILE': [CACHE_KEYS.USER_PROFILE],
  'UPDATE_SETTINGS': [CACHE_KEYS.USER_SETTINGS, CACHE_KEYS.SYNC_STATE],

  // Admin operations
  'ADMIN_USER_UPDATE': [CACHE_KEYS.ADMIN_USERS],
  'ADMIN_RESET_USER': [CACHE_KEYS.ADMIN_USERS, CACHE_KEYS.ADMIN_DASHBOARD],
};

/**
 * Cache invalidation callback type
 */
export type InvalidateCallback = (keys: string[]) => void | Promise<void>;

/**
 * Query cache manager
 *
 * Keeps track of registered invalidation callbacks and triggers them
 * when mutations occur.
 */
export class QueryCache {
  private invalidateCallbacks = new Map<string, Set<InvalidateCallback>>();
  private subscribers = new Set<InvalidateCallback>();

  /**
   * Register a callback to be called when specific keys are invalidated
   */
  onInvalidate(keys: string[], callback: InvalidateCallback): () => void {
    for (const key of keys) {
      if (!this.invalidateCallbacks.has(key)) {
        this.invalidateCallbacks.set(key, new Set());
      }
      this.invalidateCallbacks.get(key)!.add(callback);
    }

    // Return unsubscribe function
    return () => {
      for (const key of keys) {
        this.invalidateCallbacks.get(key)?.delete(callback);
      }
    };
  }

  /**
   * Register a global subscriber for all invalidations
   */
  subscribe(callback: InvalidateCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Invalidate specific cache keys
   */
  async invalidate(keys: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    // Call specific callbacks
    for (const key of keys) {
      const callbacks = this.invalidateCallbacks.get(key);
      if (callbacks) {
        callbacks.forEach((callback) => {
          promises.push(Promise.resolve(callback(keys)));
        });
      }
    }

    // Call global subscribers
    this.subscribers.forEach((callback) => {
      promises.push(Promise.resolve(callback(keys)));
    });

    await Promise.all(promises);
  }

  /**
   * Clear all callbacks
   */
  clear(): void {
    this.invalidateCallbacks.clear();
    this.subscribers.clear();
  }
}

/**
 * Global query cache instance
 */
const globalCache = new QueryCache();

/**
 * useMutation hook with automatic cache invalidation
 *
 * Wraps API mutations and automatically invalidates related caches
 *
 * Usage:
 * ```
 * const { mutate, isLoading, error } = useMutation<GoalResponse>({
 *   mutationFn: async (data) => {
 *     const response = await fetch('/api/goals', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     return response.json();
 *   },
 *   invalidateOn: 'CREATE_GOAL', // Auto-invalidates [SYNC_STATE, GOALS, BADGES]
 * });
 *
 * const handleCreate = async (formData) => {
 *   try {
 *     const result = await mutate(formData);
 *     // Show success notification
 *   } catch (error) {
 *     // Show error notification
 *   }
 * };
 * ```
 */
export interface UseMutationOptions<TData, TError = Error> {
  /** Async function that performs the mutation */
  mutationFn: (data: unknown) => Promise<TData>;

  /** Key to use for cache invalidation (maps to INVALIDATION_MAP) */
  invalidateOn?: string;

  /** Additional cache keys to invalidate */
  invalidateKeys?: string[];

  /** Called on success */
  onSuccess?: (data: TData) => void | Promise<void>;

  /** Called on error */
  onError?: (error: TError) => void | Promise<void>;

  /** Called when mutation completes (success or error) */
  onSettled?: () => void | Promise<void>;
}

export interface UseMutationResult<TData> {
  mutate: (data: unknown) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for mutations with automatic cache invalidation
 */
export function useMutation<TData, TError = Error>({
  mutationFn,
  invalidateOn,
  invalidateKeys = [],
  onSuccess,
  onError,
  onSettled,
}: UseMutationOptions<TData, TError>): UseMutationResult<TData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data: unknown): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(data);
        await onSuccess?.(result);
        
        // Combine and invalidate cache keys
        const keysToInvalidate = [
          ...(invalidateOn ? INVALIDATION_MAP[invalidateOn] || [] : []),
          ...(invalidateKeys || []),
        ];
        if (keysToInvalidate.length > 0) {
          await globalCache.invalidate(keysToInvalidate);
        }

        return result;
      } catch (err) {
        const mutationError = err instanceof Error ? err : new Error(String(err));
        setError(mutationError);
        await onError?.(mutationError as TError);
        throw mutationError;
      } finally {
        setIsLoading(false);
        await onSettled?.();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook to subscribe to cache invalidations
 *
 * Usage:
 * ```
 * const onInvalidate = useCallback(() => {
 *   // Refetch data
 *   fetchData();
 * }, []);
 *
 * useCacheInvalidation([CACHE_KEYS.GOALS], onInvalidate);
 * ```
 */
export function useCacheInvalidation(
  keys: string[],
  callback: () => void | Promise<void>
): void {
  const callbackRef = useRef(callback);

  // Update callback ref
  callbackRef.current = callback;

  // Subscribe to invalidations on mount
  useEffect(() => {
    const unsubscribe = globalCache.onInvalidate(keys, () => {
      callbackRef.current();
    });

    return unsubscribe;
  }, [keys]);
}

/**
 * Trigger cache invalidation manually
 *
 * Usage:
 * ```
 * // After a mutation outside of useMutation
 * invalidateCache('CREATE_GOAL');
 *
 * // Or with specific keys
 * invalidateCache(['sync-state', 'goals']);
 * ```
 */
export function invalidateCache(
  mutationKeyOrKeys: string | string[]
): Promise<void> {
  const keys = Array.isArray(mutationKeyOrKeys)
    ? mutationKeyOrKeys
    : INVALIDATION_MAP[mutationKeyOrKeys] || [mutationKeyOrKeys];

  return globalCache.invalidate(keys);
}

/**
 * Clear the global cache
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Export global cache for advanced use cases
 */
export { globalCache };

// ============================================
// useQuery Hook
// ============================================

/**
 * Options for useQuery hook
 */
export interface UseQueryOptions<TData, TError = Error> {
  /** Async function that fetches the data */
  queryFn: () => Promise<TData>;

  /** Cache keys to subscribe to for auto-refetch */
  invalidateOn?: string[];

  /** Called on success */
  onSuccess?: (data: TData) => void;

  /** Called on error */
  onError?: (error: TError) => void;

  /** Enabled state - if false, query won't run */
  enabled?: boolean;

  /** Stale time in milliseconds - how long data is fresh */
  staleTime?: number;

  /** Cache time in milliseconds - how long to keep data in memory */
  cacheTime?: number;
}

/**
 * Result from useQuery hook
 */
export interface UseQueryResult<TData, TError = Error> {
  /** Fetched data */
  data: TData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: TError | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * useQuery Hook - Fetch and cache data with automatic cache invalidation
 *
 * Usage:
 * ```
 * const { data, isLoading, error, refetch } = useQuery({
 *   queryFn: () => fetchGoals(),
 *   invalidateOn: ['goals', 'sync_state'],
 *   onSuccess: (data) => console.log('Goals loaded:', data),
 * });
 * ```
 */
export function useQuery<TData, TError = Error>({
  queryFn,
  invalidateOn = [],
  onSuccess,
  onError,
  enabled = true,
}: UseQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<TError | null>(null);
  const dataRef = useRef<TData | null>(null);

  // Fetch function
  const fetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      dataRef.current = result;
      await onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? (err as TError) : new Error(String(err));
      setError(error as TError);
      await onError?.(error as TError);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, onSuccess, onError, enabled]);

  // Subscribe to cache invalidation
  useEffect(() => {
    if (invalidateOn.length === 0) {
      return;
    }

    // Subscribe to cache invalidation
    invalidateOn.forEach((key) => {
      globalCache.onInvalidate([key], () => {
        fetch();
      });
    });

    // Unsubscribe on cleanup
    return () => {
      globalCache.subscribe(() => {
        // Cleanup handled by globalCache internally
      });
    };
  }, [invalidateOn, fetch]);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
  };
}

