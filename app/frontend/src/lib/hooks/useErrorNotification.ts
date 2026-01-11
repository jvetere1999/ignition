/**
 * Error Notification Hook
 *
 * Provides centralized error tracking and notification display.
 * Tracks error sequence with timestamps and request context.
 * Integrates with API client for automatic error capture.
 */

import { create } from 'zustand';
import { useCallback, useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface ErrorNotification {
  id: string;
  timestamp: Date;
  message: string;
  endpoint?: string;
  method?: string;
  status?: number;
  type: 'error' | 'warning' | 'info';
  details?: Record<string, unknown>;
  stackTrace?: string;
}

export interface ErrorStore {
  errors: ErrorNotification[];
  addError: (error: ErrorNotification) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  getErrorLog: () => string;
}

// ============================================
// Zustand Store
// ============================================

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],

  addError: (error: ErrorNotification) => {
    set((state) => ({
      errors: [...state.errors, error],
    }));
    // Log to console for debugging
    console.error(`[${error.timestamp.toISOString()}] ${error.message}`, {
      endpoint: error.endpoint,
      method: error.method,
      status: error.status,
      type: error.type,
      details: error.details,
    });
  },

  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },

  getErrorLog: () => {
    const { errors } = get();
    return errors
      .map(
        (e) =>
          `[${e.timestamp.toISOString()}] ${e.type.toUpperCase()} ${e.method || 'EVENT'} ${e.endpoint || 'unknown'} (${e.status || 'N/A'}): ${e.message}`
      )
      .join('\n');
  },
}));

// ============================================
// Hook for Components
// ============================================

export function useErrorNotification() {
  const { addError, removeError, clearErrors, errors, getErrorLog } = useErrorStore();

  const notify = useCallback(
    (
      message: string,
      options?: {
        endpoint?: string;
        method?: string;
        status?: number;
        type?: 'error' | 'warning' | 'info';
        details?: Record<string, unknown>;
        stackTrace?: string;
        duration?: number;
      }
    ) => {
      const id = `error-${Date.now()}-${Math.random()}`;
      const error: ErrorNotification = {
        id,
        timestamp: new Date(),
        message,
        endpoint: options?.endpoint,
        method: options?.method,
        status: options?.status,
        type: options?.type || 'error',
        details: options?.details,
        stackTrace: options?.stackTrace,
      };

      addError(error);

      // Auto-dismiss after duration (default 8 seconds)
      if (options?.duration !== 0) {
        setTimeout(() => removeError(id), options?.duration || 8000);
      }

      return id;
    },
    [addError, removeError]
  );

  const notifyApiError = useCallback(
    (error: Error & { status?: number; type?: string; details?: Record<string, unknown> }, endpoint?: string, method?: string) => {
      return notify(error.message, {
        endpoint,
        method,
        status: error.status,
        type: 'error',
        details: error.details,
        stackTrace: error.stack,
      });
    },
    [notify]
  );

  return {
    notify,
    notifyApiError,
    removeError,
    clearErrors,
    errors,
    getErrorLog,
  };
}

// ============================================
// Global Error Handler Setup
// ============================================

export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const { addError } = useErrorStore.getState();
    const id = `unhandled-${Date.now()}`;
    addError({
      id,
      timestamp: new Date(),
      message: `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
      type: 'error',
      stackTrace: event.reason?.stack,
      details: { reason: event.reason },
    });
  });

  // Uncaught errors
  window.addEventListener('error', (event) => {
    const { addError } = useErrorStore.getState();
    const id = `uncaught-${Date.now()}`;
    addError({
      id,
      timestamp: new Date(),
      message: `Uncaught Error: ${event.message}`,
      type: 'error',
      stackTrace: event.error?.stack,
      details: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });
}
