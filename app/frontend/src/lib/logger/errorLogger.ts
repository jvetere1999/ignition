/**
 * Error Logger Utility
 *
 * Provides structured error logging with endpoint context.
 * Used for explicit error tracking in API calls.
 * Uses Zustand store directly to avoid React hooks in non-hook contexts.
 */

import { useErrorStore } from '@/lib/hooks/useErrorNotification';

/**
 * Track API error with full context
 */
export function logApiError(
  error: Error & { status?: number; type?: string; details?: Record<string, unknown> },
  context: {
    endpoint: string;
    method: string;
    userId?: string;
    params?: Record<string, unknown>;
    requestBody?: unknown;
  }
) {
  const store = useErrorStore.getState();
  const errorMessage = `${context.method} ${context.endpoint} failed: ${error.message}`;

  store.addError({
    id: `api-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    message: errorMessage,
    endpoint: context.endpoint,
    method: context.method,
    status: error.status,
    type: 'error',
    details: {
      ...error.details,
      userId: context.userId,
      params: context.params,
      requestBody: context.requestBody,
    },
    stackTrace: error.stack,
  });

  // Log full context to console for debugging
  console.error('API Error with context:', {
    error: error.message,
    status: error.status,
    type: error.type,
    endpoint: context.endpoint,
    method: context.method,
    userId: context.userId,
    params: context.params,
    requestBody: context.requestBody,
    stack: error.stack,
    details: error.details,
  });
}

/**
 * Track database operation error
 */
export function logDbError(
  error: Error,
  context: {
    operation: string;
    table: string;
    query?: string;
    values?: unknown[];
  }
) {
  const store = useErrorStore.getState();
  const errorMessage = `Database ${context.operation} on ${context.table} failed: ${error.message}`;

  store.addError({
    id: `db-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    message: errorMessage,
    endpoint: `db.${context.table}`,
    method: context.operation.toUpperCase(),
    type: 'error',
    details: {
      query: context.query,
      values: context.values,
    },
    stackTrace: error.stack,
  });

  console.error('Database Error:', {
    operation: context.operation,
    table: context.table,
    error: error.message,
    query: context.query,
    values: context.values,
    stack: error.stack,
  });
}

/**
 * Track validation error
 */
export function logValidationError(
  fieldErrors: Record<string, string[]> | string,
  context?: { formName?: string; userId?: string }
) {
  const store = useErrorStore.getState();
  const errorMessage = typeof fieldErrors === 'string'
    ? fieldErrors
    : `Validation failed: ${Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ')}`;

  store.addError({
    id: `validation-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    message: errorMessage,
    endpoint: context?.formName ? `form.${context.formName}` : 'validation',
    method: 'VALIDATE',
    type: 'warning',
    details: {
      fieldErrors: typeof fieldErrors === 'object' ? fieldErrors : undefined,
      userId: context?.userId,
    },
  });

  console.warn('Validation Error:', fieldErrors, context);
}
