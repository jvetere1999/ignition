# Error Notification System - Implementation Guide

## What Was Added

### 1. Error State Management
**File**: `app/frontend/src/lib/hooks/useErrorNotification.ts`
- Zustand store for centralized error state
- Hook `useErrorNotification()` for component integration
- Global error handler setup function
- Auto-dismissal with configurable timeout (default 8s)

### 2. Error Notification UI
**File**: `app/frontend/src/components/ui/ErrorNotifications.tsx`
- Fixed position widget (bottom-right corner)
- Color-coded by error type (error=red, warning=yellow, info=blue)
- Expandable details and stack traces
- Error log viewer showing chronological sequence
- Auto-dismiss after 8 seconds

### 3. Global Error Handler
**File**: `app/frontend/src/components/ui/ErrorNotificationInitializer.tsx`
- Catches unhandled promise rejections
- Catches uncaught exceptions
- Initializes automatically on app mount

### 4. API Client Integration
**File**: `app/frontend/src/lib/api/client.ts` (modified)
- Automatic error capture for all API calls
- Tracks endpoint, method, HTTP status
- Non-intrusive (doesn't break existing code)

### 5. Error Logging Utilities
**File**: `app/frontend/src/lib/logger/errorLogger.ts`
- `logApiError()` - API request failures with context
- `logDbError()` - Database operation failures
- `logValidationError()` - Form validation errors

### 6. Safe API Hooks
**File**: `app/frontend/src/lib/hooks/useSafeApiCall.ts`
- `useSafeApiCall()` - Wrapper for safe API calls
- `useCatchError()` - Helper for try-catch blocks

### 7. Root Layout Integration
**File**: `app/frontend/src/app/layout.tsx` (modified)
- Added `<ErrorNotifications />` component
- Added `<ErrorNotificationInitializer />` component
- No breaking changes to existing layout

## How It Works (User Flow)

```
User makes API call
         ↓
API fails (4xx, 5xx, timeout, network error)
         ↓
Error automatically captured by client.ts
         ↓
Error added to store with:
  • Message
  • Endpoint + Method
  • HTTP Status
  • Details + Stack Trace
         ↓
ErrorNotifications component renders jeweled notification
         ↓
User sees error in bottom-right corner with:
  • Emoji icon
  • Error message
  • GET /api/endpoint (500)
  • Timestamp
  • [Details] [Stack Trace] buttons
  • [✕] Close button
         ↓
Error auto-dismisses after 8s OR
User clicks "View Log" to see full sequence
```

## Key Design Decisions

1. **Zero Configuration**: Works automatically - no setup needed
2. **Non-Intrusive**: Doesn't require changes to existing API calls
3. **Sequential Tracking**: Every error logged with timestamp for debugging
4. **Type-Safe**: TypeScript interfaces for all error data
5. **Performance**: Lightweight Zustand store, efficient rendering
6. **Accessible**: Color + icons + text for visibility
7. **Developer Friendly**: Console logs + expandable UI details

## What Errors Are Captured

### Automatically (No Code Change)
- ✅ API timeouts (408)
- ✅ Server errors (500, 502, 503, etc.)
- ✅ Client errors (400, 401, 403, 404)
- ✅ Network failures (no connection)
- ✅ Unhandled promise rejections
- ✅ Uncaught exceptions

### With Explicit Logging (Minor Code Change)
- ✅ Database operation failures
- ✅ Form validation errors
- ✅ Custom business logic errors
- ✅ Feature-specific error handling

## Testing the System

### 1. Test Automatic API Error
```typescript
// In any component
const { apiGet } = require('@/lib/api');

// This will fail and show error in UI
apiGet('/api/nonexistent').catch(() => {});
```

Check bottom-right corner for error notification.

### 2. Test Manual Error Logging
```typescript
// In any component
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';

const { notify } = useErrorNotification();

notify('Test error message', {
  endpoint: '/api/test',
  method: 'GET',
  status: 500,
  type: 'error'
});
```

Should appear immediately.

### 3. Test Error Log Viewer
1. Trigger a few errors
2. Click "View Log" button
3. Should show chronological list with timestamps

### 4. Test Global Error Handler
```typescript
// In browser console
Promise.reject(new Error('Test unhandled rejection'));
throw new Error('Test uncaught error');
```

Both should appear in notifications.

## Integration with Existing Code

### No Changes Required For:
- ✅ Any existing `apiGet()`, `apiPost()`, etc. calls
- ✅ Any existing error handling with try-catch
- ✅ Any existing component code

### To Add Explicit Error Tracking:
```typescript
import { useCatchError } from '@/lib/hooks/useSafeApiCall';

function MyComponent() {
  const { handleError } = useCatchError();

  try {
    await apiGet('/api/endpoint');
  } catch (error) {
    // Add one line to explicitly track
    handleError(error, {
      endpoint: '/api/endpoint',
      method: 'GET'
    });
  }
}
```

## Error Message Format

All errors follow this pattern for consistency:

```
[METHOD ENDPOINT (STATUS)]: Message

Examples:
- GET /api/sync/notifications (500): column "is_read" does not exist
- POST /api/daily-plan (400): Validation failed: title is required
- GET /api/user (401): Unauthorized
- POST /api/endpoint (408): Request timeout
- GET /api/endpoint (0): Network error - no connection
```

## Debugging with Error Log

1. **Copy Error Log**: Click "View Log", copy full text
2. **Search for Patterns**: Look for repeated endpoints
3. **Track Sequence**: Timestamps show request order
4. **Find Root Cause**: First error often causes subsequent ones
5. **Share with Team**: Paste log in Slack/GitHub issue

Example useful log for debugging:
```
[2025-01-11T10:30:45.123Z] ERROR GET /api/sync/notifications (500): column "is_read" does not exist
[2025-01-11T10:30:45.456Z] ERROR GET /api/daily-plan (500): relation "daily_plan_items" does not exist
[2025-01-11T10:30:45.789Z] WARN GET /api/user (401): Unauthorized
```

This tells you:
- Notifications endpoint is failing (missing `is_read` column)
- Daily plan endpoint is failing (missing `daily_plan_items` table)
- User might be getting logged out (401 error)

## Next Steps

### For Developers
1. Test the error system in your app
2. Verify errors display correctly in UI
3. Check console logs for detailed debugging info
4. Use `getErrorLog()` for copy-paste debugging

### For Backend Developers
1. Watch for errors in error notification logs
2. Use the endpoint path to find corresponding backend code
3. Use the HTTP status code to diagnose issue type
4. Refer to request log in backend to correlate timing

### For QA/Testers
1. Trigger errors intentionally (go offline, server down, etc.)
2. Screenshot error notifications for bug reports
3. Copy error log for detailed issue descriptions
4. Check that errors disappear after 8s or when cleared

## Future Enhancements

Once system is stable, consider adding:
- Error filtering/search in log viewer
- Error export as JSON for analysis
- Integration with Sentry/LogRocket for production
- Performance metrics alongside errors
- Network request waterfall visualization
