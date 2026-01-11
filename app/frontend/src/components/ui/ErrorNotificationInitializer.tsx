/**
 * Error Notification Initializer
 *
 * Client-side component that initializes global error handling.
 * Must be in client component to run browser-side only.
 */

'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/lib/hooks/useErrorNotification';

export function ErrorNotificationInitializer() {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return null;
}
