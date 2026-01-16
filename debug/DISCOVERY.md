# UI Sync & Caching Discovery

## Current Issue Summary
Users report frequent random UI refreshes while simultaneously seeing data cached in memory that's being synced to the database. The sync poll clears entire UI state instead of seamlessly updating only changed elements.

## Current Architecture

### SyncStateContext (app/frontend/src/lib/sync/SyncStateContext.tsx)
- **Polling Interval**: 30 seconds
- **Strategy**: Memory-only state, no localStorage persistence
- **ETag Support**: YES - checks if data changed via ETag header
- **Behavior on No Change**: Updates lastSyncAt only, doesn't re-render
- **Behavior on Change**: Updates ALL state (progress, badges, focus, plan, user) at once

### pollAll() API (app/frontend/src/lib/api/sync.ts)
- **Endpoint**: `GET /api/sync/poll`
- **Response**: Single request containing:
  - progress (level, XP, coins, streak)
  - badges (inbox, quests, habits, overdue)
  - focus (active session + pause state)
  - plan (completion status)
  - user (profile + settings)
  - server_time
  - etag

### Issue Root Causes

#### 1. Full State Replacement vs Partial Updates
**Problem**: When ANY field changes, ALL state is re-set
```typescript
setProgress(data.progress);  // Entire progress object
setBadges(data.badges);      // Entire badges object
setFocus(data.focus);        // Entire focus object
setPlan(data.plan);          // Entire plan object
setUser(data.user);          // Entire user object
```

**Effect**: Components subscribed to any part of state re-render completely

#### 2. No Differential Caching
- Backend sends entire payload every poll
- Frontend has no way to know WHICH fields changed
- Even unchanged focus session causes UI re-render

#### 3. Component Subscription Granularity
- useSyncState() hook exposes entire context
- Components can't selectively subscribe to changed fields only
- Any update triggers all subscribers

## Proposed Solution: Seamless Sync Payload

### Design: Differential Payload System
```typescript
interface DifferentialSyncPayload {
  // Only include fields that changed since last poll
  changed_fields: string[];
  
  // Partial updates instead of full objects
  updates: {
    progress?: Partial<ProgressData>;
    badges?: Partial<BadgeData>;
    focus?: Partial<FocusStatusData>;
    plan?: Partial<PlanStatusData>;
    user?: Partial<UserData>;
  };
  
  // Full fallback for critical fields
  full_snapshot?: {
    progress: ProgressData;
    badges: BadgeData;
    // ... etc (sent every N polls)
  };
  
  etag: string;
  server_time: string;
}
```

### Implementation Steps

#### Step 1: Backend Enhancement
- Track last sent payload
- Compare with current state
- Only include changed fields in `updates` object
- Send full snapshot every 5th poll (fallback recovery)

#### Step 2: Frontend Merge Logic
```typescript
const mergeDifferential = (
  current: SyncState,
  differential: DifferentialSyncPayload
) => {
  // Use full snapshot if provided (every 5th poll)
  if (differential.full_snapshot) {
    return differential.full_snapshot;
  }
  
  // Otherwise merge only changed fields
  return {
    ...current,
    ...differential.updates
  };
};
```

#### Step 3: Selective Re-render
- Create separate hooks: `useProgress()`, `useBadges()`, `useFocus()`, etc
- Each hook only re-renders when its specific field changes
- Components no longer do unnecessary re-renders

#### Step 4: Debounce Rapid Changes
- Batch UI updates within 100ms window
- Prevents multiple renders for rapid state changes
- Maintains visual stability

## Additional: Memory-to-Database Sync Issue

### Current Problem
- User action updates memory immediately
- Sync poll happens every 30 seconds
- Data might be stale between updates

### Solution: Optimistic Updates + Confirmation
```typescript
// Immediate optimistic update
setProgress({...progress, current_xp: progress.current_xp + 10});

// Send to backend
await updateXP(10);

// Verification on next poll (not forced refresh)
// Confidence increases as polls confirm value
```

## Passcode Integration Planning

### Current Flow
1. User logs in via OAuth
2. TOSModal shows (TOS + age verification checkboxes)
3. User gains access to app

### New Flow
1. User logs in via OAuth
2. **NEW**: OnboardingFlow page (separate route)
   - TOS + Age verification (existing TOSModal content)
   - Passcode creation/setup (NEW)
   - Security questions (future)
3. User gains access to app

### Implementation Details
- **Route**: `/auth/onboarding` (takes precedence for new accounts)
- **Prerequisite**: User has `tos_accepted = true` AND needs passcode
- **Passcode**: 4-6 digit numeric PIN for vault access
- **Storage**: Encrypted in database (not in auth token)
- **Usage**: Required for sensitive operations (vault unlock, transfers, etc)

## Next Steps

1. ✓ Create discovery document (THIS FILE)
2. Implement DifferentialSyncPayload on backend
3. Update frontend merge logic in SyncStateContext
4. Extract granular hooks (useProgress, useBadges, etc)
5. Add debouncing to batch updates
6. Create /auth/onboarding page flow
7. Add passcode creation UI
8. Integrate passcode into vault access
9. Test with frequent user interactions
10. Monitor UI render counts and sync efficiency
