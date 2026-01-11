/**
 * Safe API Call Hook
 *
 * Wraps API calls with automatic error notification.
 * Tracks endpoint, method, and status for debugging.
 */

import { useCallback } from 'react';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';
import { logApiError } from '@/lib/logger/errorLogger';

/**
 * Hook for safe API calls with error handling
 *
 * @example
 * const { callApi, isLoading } = useSafeApiCall();
 *
 * const handleFetch = async () => {
 *   const data = await callApi(
 *     () => apiGet('/api/endpoint'),
 *     { endpoint: '/api/endpoint', method: 'GET' }
 *   );
 * };
 */
export function useSafeApiCall() {
  const { notify } = useErrorNotification();

  const callApi = useCallback(
    async <T,>(
      apiCall: () => Promise<T>,
      context: {
        endpoint: string;
        method: string;
        userId?: string;
        params?: Record<string, unknown>;
        requestBody?: unknown;
      }
    ): Promise<T | null> => {
      try {
        return await apiCall();
      } catch (error) {
        const apiError = error as Error & { status?: number; type?: string; details?: Record<string, unknown> };

        // Log with context for debugging
        logApiError(apiError, context);

        return null;
      }
    },
    [notify]
  );

  return { callApi };
}

/**
 * Hook for catching and displaying errors from try-catch blocks
 *
 * @example
 * const { handleError } = useCatchError();
 *
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleError(error, { endpoint: '/api/endpoint', method: 'POST' });
 * }
 */
export function useCatchError() {
  const { notify } = useErrorNotification();

  const handleError = useCallback(
    (
      error: unknown,
      context: {
        endpoint: string;
        method: string;
        userId?: string;
      }
    ) => {
      const apiError = error as Error & { status?: number; type?: string; details?: Record<string, unknown> };

      if (apiError instanceof Error) {
        logApiError(apiError, {
          ...context,
          params: undefined,
          requestBody: undefined,
        });
      } else {
        notify(`${context.method} ${context.endpoint} failed: ${String(error)}`, {
          endpoint: context.endpoint,
          method: context.method,
          type: 'error',
        });
      }
    },
    [notify]
  );

  return { handleError };
}
