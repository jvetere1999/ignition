/**
 * Error Notification Component
 *
 * Displays sequential error notifications as a jeweled notification panel.
 * Shows endpoint, method, status, and error message for each error.
 * Includes expandable error log view.
 */

'use client';

import { useState } from 'react';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';

export function ErrorNotifications() {
  const { errors, removeError, clearErrors, getErrorLog } = useErrorNotification();
  const [showLog, setShowLog] = useState(false);

  if (errors.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md space-y-2 z-50">
      {/* Error List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {errors.map((error, index) => (
          <div
            key={error.id}
            className={`p-3 rounded-lg border-l-4 shadow-md transition-all ${getTypeColor(error.type)}`}
            role="alert"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-lg leading-none mt-0.5">{getTypeEmoji(error.type)}</span>
                <div className="flex-1">
                  {/* Message */}
                  <p className="font-medium text-sm leading-tight">{error.message}</p>

                  {/* Request Context */}
                  {error.endpoint && (
                    <p className="text-xs opacity-75 mt-1 font-mono">
                      {error.method || 'REQ'} {error.endpoint}
                      {error.status && ` (${error.status})`}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs opacity-60 mt-0.5">
                    {error.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeError(error.id)}
                className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>

            {/* Details (if present) */}
            {error.details && Object.keys(error.details).length > 0 && (
              <details className="mt-2 text-xs opacity-80">
                <summary className="cursor-pointer font-medium">Details</summary>
                <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}

            {/* Stack Trace (if present) */}
            {error.stackTrace && (
              <details className="mt-2 text-xs opacity-80">
                <summary className="cursor-pointer font-medium">Stack Trace</summary>
                <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                  {error.stackTrace}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setShowLog(!showLog)}
          className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          {showLog ? 'Hide' : 'View'} Log
        </button>
        <button
          onClick={clearErrors}
          className="flex-1 px-2 py-1 bg-red-200 hover:bg-red-300 rounded transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Error Log */}
      {showLog && (
        <div className="p-3 bg-gray-900 rounded-lg text-gray-100 text-xs font-mono shadow-lg">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {getErrorLog() || 'No errors logged'}
          </pre>
        </div>
      )}
    </div>
  );
}
