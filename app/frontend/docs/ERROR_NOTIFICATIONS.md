# Error Notification System

## Overview

The error notification system provides centralized error tracking and UI display for all application errors. It automatically captures and displays API errors, validation errors, database errors, and unhandled exceptions.

## Features

- **Automatic Error Capture**: API errors are automatically captured and displayed
- **Sequential Error Log**: View all errors in order with timestamps and context
- **Request Tracing**: Each error includes endpoint, method, HTTP status
- **Expandable Details**: Error details and stack traces available on-demand
- **Global Error Handler**: Catches unhandled rejections and exceptions
- **Zero Configuration**: Works automatically after component mount

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Application Code                      │
├─────────────────────────────────────────────────────┤
│  API Calls (apiGet, apiPost, etc.)                  │
│  Database Operations                                 │
│  Validation                                          │
│  Unhandled Exceptions                               │
└────────────────┬────────────────────────────────────┘
                 │ throws
                 ▼
┌─────────────────────────────────────────────────────┐
│          Error Notification System                   │
├─────────────────────────────────────────────────────┤
│  ┌─ useErrorNotification Hook                       │
│  │  • notify()                                       │
│  │  • notifyApiError()                              │
│  │  • removeError()                                  │
│  │  • getErrorLog()                                 │
│  └─ useErrorStore (Zustand)                        │
│     • Centralized error state                       │
│     • Auto-dismissed on timeout                     │
│                                                      │
│  ┌─ setupGlobalErrorHandler()                      │
│  │  • Catches unhandledrejection                    │
│  │  • Catches uncaught errors                       │
│  └─ logApiError()                                  │
│     • Structured error with context                 │
│                                                      │
└────────────────┬────────────────────────────────────┘
                 │ updates
                 ▼
┌─────────────────────────────────────────────────────┐
│          ErrorNotifications Component                │
├─────────────────────────────────────────────────────┤
│  ┌─ Error List (fixed bottom-right)                │
│  │  • Message + endpoint + method + status         │
│  │  • Expandable details / stack trace             │
│  │  • Auto-dismiss after 8s (configurable)         │
│  │                                                   │
│  ├─ Controls                                        │
│  │  • View Log button → shows full error sequence  │
│  │  • Clear All button → clears all errors         │
│  │  • Dismiss button per error (✕)                 │
│  │                                                   │
│  └─ Error Log (expandable)                         │
│     • Chronological timestamp format                │
│     • endpoint method status message               │
│     • Perfect for debugging                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## How It Works

### 1. Automatic API Error Capture

When an API call fails, the error is automatically captured by the client:

```typescript
// In app/frontend/src/lib/api/client.ts
// executeFetch() automatically tracks errors
const data = await apiGet('/api/endpoint'); // Error → auto-captured
```

**Flow**:
1. API request fails (4xx, 5xx, timeout, network error)
2. `executeFetch()` catches error
3. Error added to store with: message, endpoint, method, status, details
4. `ErrorNotifications` component renders notification

### 2. Manual Error Tracking

Use hooks for explicit error handling:

```typescript
import { useSafeApiCall } from '@/lib/hooks/useSafeApiCall';
import { logApiError } from '@/lib/logger/errorLogger';

function MyComponent() {
  const { callApi } = useSafeApiCall();
  const { handleError } = useCatchError();

  // Option 1: Safe wrapper
  const data = await callApi(
    () => apiGet('/api/endpoint'),
    { endpoint: '/api/endpoint', method: 'GET', userId: user.id }
  );

  // Option 2: Try-catch with handler
  try {
    await apiPost('/api/endpoint', body);
  } catch (error) {
    handleError(error, {
      endpoint: '/api/endpoint',
      method: 'POST'
    });
  }
}
```

### 3. Database Error Tracking

Log database operation errors with table and query context:

```typescript
import { logDbError } from '@/lib/logger/errorLogger';

try {
  await db.query('SELECT * FROM notifications WHERE is_read = $1', [true]);
} catch (error) {
  logDbError(error, {
    operation: 'SELECT',
    table: 'notifications',
    query: 'SELECT * FROM notifications WHERE is_read = $1',
    values: [true]
  });
}
```

### 4. Validation Error Tracking

Log form validation errors:

```typescript
import { logValidationError } from '@/lib/logger/errorLogger';

const fieldErrors = {
  email: ['Invalid email format'],
  password: ['Must be at least 8 characters']
};

logValidationError(fieldErrors, {
  formName: 'login',
  userId: user.id
});
```

### 5. Global Error Handler

Automatic capture of:
- Unhandled promise rejections
- Uncaught exceptions
- Any error thrown without try-catch

No configuration needed - initialized automatically by `ErrorNotificationInitializer`.

## UI Components

### ErrorNotifications Component

**File**: `app/frontend/src/components/ui/ErrorNotifications.tsx`

**Features**:
- Fixed position: bottom-right corner
- Max 4 errors visible (scrollable)
- Each error shows:
  - Emoji icon (❌ error, ⚠️ warning, ℹ️ info)
  - Message
  - Method + Endpoint + HTTP Status
  - Timestamp
  - Expandable details
  - Expandable stack trace
  - Close button (✕)

**Styling**:
- Color-coded by type (error=red, warning=yellow, info=blue)
- Shadow for visibility
- Smooth animations

### Error Log Viewer

**Access**: Click "View Log" button in notifications

**Shows**:
```
[2025-01-11T10:30:45.123Z] ERROR GET /api/sync/notifications (500): column "is_read" does not exist
[2025-01-11T10:30:46.456Z] ERROR POST /api/daily-plan (500): relation "daily_plan_items" does not exist
[2025-01-11T10:30:47.789Z] WARNING GET /api/user (401): Unauthorized
```

Perfect for copy-pasting into bug reports or sharing debugging context.

## Usage Examples

### Example 1: Basic Component with Error Handling

```typescript
'use client';

import { useState } from 'react';
import { apiGet } from '@/lib/api';
import { useSafeApiCall } from '@/lib/hooks/useSafeApiCall';

export function UserProfile() {
  const [user, setUser] = useState(null);
  const { callApi } = useSafeApiCall();

  const loadUser = async () => {
    const data = await callApi(
      () => apiGet('/api/user'),
      { endpoint: '/api/user', method: 'GET' }
    );
    
    if (data) setUser(data);
  };

  return (
    <div>
      <button onClick={loadUser}>Load Profile</button>
      {user && <p>{user.name}</p>}
      {/* Errors auto-display in bottom-right */}
    </div>
  );
}
```

### Example 2: Form with Validation Errors

```typescript
'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { logValidationError, logApiError } from '@/lib/logger/errorLogger';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors: Record<string, string[]> = {};
    if (!email.includes('@')) errors.email = ['Invalid email'];
    if (password.length < 8) errors.password = ['Too short'];

    if (Object.keys(errors).length > 0) {
      logValidationError(errors, { formName: 'login' });
      return;
    }

    // Submit
    try {
      await apiPost('/api/auth/login', { email, password });
    } catch (error) {
      // Already tracked by automatic error handler
      // But you can add extra context if needed
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example 3: Data Sync with Error Context

```typescript
'use client';

import { useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { useCatchError } from '@/lib/hooks/useSafeApiCall';

export function SyncContainer() {
  const { handleError } = useCatchError();

  useEffect(() => {
    const syncData = async () => {
      try {
        const response = await apiGet('/api/sync/notifications');
        // Process response...
      } catch (error) {
        handleError(error, {
          endpoint: '/api/sync/notifications',
          method: 'GET'
        });
      }
    };

    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [handleError]);

  return <div>{/* Your component */}</div>;
}
```

## Error Categories

### API Errors
- **Source**: Network requests (4xx, 5xx, timeouts)
- **Tracked**: Endpoint, method, HTTP status, response body
- **Display**: Color-coded by type
- **Example**: `GET /api/notifications (500): column "is_read" does not exist`

### Database Errors
- **Source**: Backend query failures
- **Tracked**: Operation type, table name, query, values
- **Display**: Expandable details with query context
- **Example**: `Database SELECT on notifications failed: column "is_read" does not exist`

### Validation Errors
- **Source**: Form validation, input checks
- **Tracked**: Field names, error messages
- **Display**: Yellow warning style
- **Example**: `Validation failed: email: Invalid format; password: Too short`

### Global Errors
- **Source**: Unhandled rejections, uncaught exceptions
- **Tracked**: Error message, stack trace
- **Display**: Red error style with full stack
- **Example**: `Unhandled Promise Rejection: Cannot read property 'id' of undefined`

## Debugging Tips

### View Error Log
1. Click "View Log" button in error notifications
2. Copy log text (Ctrl+C or right-click)
3. Paste into bug report or share with team

### Check Endpoint Path
Each error shows: `METHOD ENDPOINT (STATUS)`
- `GET /api/sync/notifications (500)` - exact failing endpoint
- Use this path to find backend logs

### Expand Error Details
- Click "Details" to see response body
- Click "Stack Trace" to see where error was thrown
- Useful for reproducing issues

### Filter by Error Type
Error notification colors indicate type:
- 🔴 Red (`error`) - API/system failures
- 🟡 Yellow (`warning`) - Validation issues
- 🔵 Blue (`info`) - Informational messages

### Clear Specific Errors
- Click ✕ on individual error to dismiss
- Click "Clear All" to remove all notifications
- Errors in log persist even after dismissal

## Configuration

### Error Duration
Default: 8 seconds before auto-dismiss

**Change per error**:
```typescript
const { notify } = useErrorNotification();

notify('My error', {
  endpoint: '/api/endpoint',
  method: 'GET',
  duration: 5000, // 5 seconds
  // Or duration: 0 for no auto-dismiss
});
```

### Error Store Size Limit
By default, errors persist until cleared or dismissed.

**Limit errors in store**:
```typescript
const { errors } = useErrorStore();

// In ErrorNotifications.tsx, limit rendered errors:
errors.slice(-10).map(...) // Show only last 10
```

### Custom Error Types
Add custom types beyond 'error', 'warning', 'info':

```typescript
// Extend ErrorNotification type in useErrorNotification.ts
export interface ErrorNotification {
  type: 'error' | 'warning' | 'info' | 'debug' | 'custom';
  // ...
}
```

Then update `getTypeColor()` and `getTypeEmoji()` in ErrorNotifications component.

## Related Files

- **Hook**: [useErrorNotification.ts](../../lib/hooks/useErrorNotification.ts)
- **Component**: [ErrorNotifications.tsx](ErrorNotifications.tsx)
- **Initializer**: [ErrorNotificationInitializer.tsx](ErrorNotificationInitializer.tsx)
- **Logger**: [errorLogger.ts](../../lib/logger/errorLogger.ts)
- **Safe API Hook**: [useSafeApiCall.ts](../../lib/hooks/useSafeApiCall.ts)
- **API Client**: [client.ts](../../lib/api/client.ts) (auto-integration)

## Troubleshooting

### Errors not displaying?
1. Check `ErrorNotifications` is in layout.tsx ✓
2. Check `ErrorNotificationInitializer` is in layout.tsx ✓
3. Open browser console (F12) - errors should log there
4. Check error store: `useErrorStore.getState().errors`

### Too many errors displaying?
- Click "Clear All" to reset
- Individual errors auto-dismiss after 8s
- Or set `duration: 0` to require manual dismissal

### Error log not showing?
- Click "View Log" button
- If empty, no errors have been tracked yet
- Check console (F12) for logging output

### Stack traces not available?
- Only available for JavaScript errors caught by error handler
- API errors from server won't have stack traces
- Look at "Details" instead for error response body

## Performance Impact

- **Minimal**: Error store uses Zustand (lightweight)
- **UI**: Renders notifications on-demand (only when errors exist)
- **Memory**: Old errors auto-dismissed after timeout
- **Network**: Zero additional network calls
- **Bundle**: ~5KB gzipped for entire system

## Security Considerations

- **No PII**: Don't log personally identifiable information
- **Sensitive Data**: Be cautious with requestBody details
- **Stack Traces**: Only visible in development (consider filtering in production)
- **User Privacy**: Consider GDPR/privacy laws before logging user IDs

## Future Enhancements

- [ ] Error filtering by type/endpoint
- [ ] Bulk error export as JSON
- [ ] Integration with error tracking service (Sentry, LogRocket)
- [ ] Error replay/time-travel debugging
- [ ] Network request waterfall view
- [ ] Performance metrics alongside errors
