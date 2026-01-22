# API Endpoints Documentation

**Version**: 1.0  
**Last Updated**: January 17, 2026  
**Base URL**: `https://api.ecent.online` (or `process.env.NEXT_PUBLIC_API_URL`)

---

## Overview

All API requests go through the centralized `apiClient` (see `client.ts`).

**Patterns**:
- Authentication: Uses HTTP-only cookies (no Authorization header needed)
- Request Format: JSON with `Content-Type: application/json`
- Response Format: JSON with `{ data: T, message?: string }`
- Error Format: `{ message: string, code?: string, details?: object }`

---

## Authentication

### POST /api/auth/signin
Sign in user (OAuth or email/password)

**Request**:
```typescript
{
  provider: 'google' | 'azure' | 'email',
  code?: string,           // OAuth authorization code
  email?: string,          // Email auth
  password?: string        // Email auth
}
```

**Response**:
```typescript
{
  user_id: string,
  email: string,
  name: string,
  onboarding_complete: boolean
}
```

**Errors**: 401 (invalid credentials), 400 (invalid provider)

---

### POST /api/auth/signout
Sign out user (clears session)

**Response**: `{ message: "Signed out successfully" }`

---

### GET /api/auth/session
Get current session info

**Response**:
```typescript
{
  user_id: string,
  email: string,
  session_active: boolean
}
```

**Errors**: 401 (no active session)

---

## Sync & Polling

### GET /api/sync/poll
Poll all UI optimization data (goals, habits, quests, badges, focus status)

**Query Parameters**:
- `etag` (optional): If-None-Match for conditional requests

**Response**:
```typescript
{
  progress: ProgressData,
  badges: BadgeData,
  focus: FocusStatusData,
  plan: PlanStatusData,
  user: UserData,
  etag: string
}
```

**Headers**: Returns `ETag` header for caching

---

## Goals

### GET /api/goals
List all goals for user

**Query Parameters**:
- `status` (optional): 'active' | 'completed' | 'archived'
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 20

**Response**:
```typescript
{
  goals: Goal[],
  total: number,
  page: number,
  limit: number
}
```

---

### POST /api/goals
Create new goal

**Request**:
```typescript
{
  name: string,
  description?: string,
  target_date?: string (ISO 8601),
  priority?: 'high' | 'medium' | 'low'
}
```

**Response**: `Goal` object

---

### GET /api/goals/:id
Get specific goal

**Response**: `Goal` object

---

### PUT /api/goals/:id
Update goal

**Request**: Partial goal object (all fields optional)

**Response**: Updated `Goal` object

---

### DELETE /api/goals/:id
Delete goal

**Response**: `{ message: "Goal deleted" }`

---

### GET /api/goals/:id/progress
Get goal progress details

**Response**:
```typescript
{
  goal_id: string,
  completed_tasks: number,
  total_tasks: number,
  progress_percent: number,
  last_updated: string
}
```

---

## Habits

### GET /api/habits
List all habits

**Query Parameters**:
- `frequency` (optional): 'daily' | 'weekly' | 'monthly'
- `page` (optional): Pagination

**Response**: `{ habits: Habit[], total: number, page: number }`

---

### POST /api/habits
Create new habit

**Request**:
```typescript
{
  name: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  target: number (times per period)
}
```

**Response**: `Habit` object

---

### PUT /api/habits/:id
Update habit

**Request**: Partial habit object

**Response**: Updated `Habit` object

---

### DELETE /api/habits/:id
Delete habit

**Response**: `{ message: "Habit deleted" }`

---

### POST /api/habits/:id/log
Log habit completion (mark as done today)

**Request**: `{ date?: string }` (optional, defaults to today)

**Response**: `{ completed: true, streak: number }`

---

## Quests

### GET /api/quests
List all quests

**Query Parameters**:
- `status` (optional): 'active' | 'completed' | 'failed'

**Response**: `{ quests: Quest[], total: number }`

---

### POST /api/quests
Create new quest

**Request**:
```typescript
{
  title: string,
  description?: string,
  rewards?: { xp: number, coins: number }
}
```

**Response**: `Quest` object

---

### GET /api/quests/:id
Get specific quest

**Response**: `Quest` object

---

### POST /api/quests/:id/complete
Complete quest

**Request**: `{ completed_at?: string }`

**Response**: `{ quest_id: string, rewards: RewardData }`

---

## Focus Sessions

### GET /api/focus/sessions
List all focus sessions (paginated)

**Query Parameters**:
- `status` (optional): 'active' | 'paused' | 'completed'
- `limit` (optional): default 20

**Response**: `{ sessions: FocusSession[], total: number }`

---

### POST /api/focus/sessions
Create new focus session

**Request**:
```typescript
{
  goal_id: string,
  duration_minutes: number,
  focus_type?: 'pomodoro' | 'deep_work'
}
```

**Response**: `FocusSession` object (with `session_id`)

---

### GET /api/focus/sessions/:id
Get focus session details

**Response**: `FocusSession` object

---

### POST /api/focus/sessions/:id/pause
Pause active focus session

**Request**: `{}`

**Response**: `{ paused_at: string, elapsed_minutes: number }`

---

### POST /api/focus/sessions/:id/resume
Resume paused focus session

**Request**: `{}`

**Response**: `{ resumed_at: string }`

---

### POST /api/focus/sessions/:id/end
End focus session

**Request**: `{}`

**Response**: `{ completed_at: string, total_minutes: number, xp_earned: number }`

---

## Vault

### GET /api/vault/status
Get vault status (locked/unlocked)

**Response**:
```typescript
{
  vault_id: string,
  is_locked: boolean,
  last_accessed: string
}
```

---

### POST /api/vault/lock
Deprecated. Passkey sessions no longer lock the vault client-side.

**Request**: `{ reason?: string }`

**Response**: `{ vault_locked_at: string }`

---

### POST /api/vault/unlock
Deprecated. Vault unlock happens with passkey authentication.

**Request**: `{}`

**Response**: `{ vault_unlocked_at: string }`

---

### POST /api/vault/recovery
Deprecated. Passphrase recovery is no longer part of the flow.

**Request**: `{ action: 'generate' | 'reset' }`

**Response**: `{ codes: string[], vault_id: string }`

---

## User Profile

### GET /api/user/profile
Get current user profile

**Response**:
```typescript
{
  user_id: string,
  email: string,
  name: string,
  avatar_url?: string,
  preferences: UserPreferences
}
```

---

### PUT /api/user/profile
Update user profile

**Request**:
```typescript
{
  name?: string,
  avatar_url?: string
}
```

**Response**: Updated user profile

---

### GET /api/user/preferences
Get user preferences

**Response**:
```typescript
{
  theme: 'light' | 'dark',
  language: string,
  notifications_enabled: boolean,
  daily_digest_time?: string
}
```

---

### PUT /api/user/preferences
Update user preferences

**Request**: Partial preferences object

**Response**: Updated preferences

---

## Error Handling

### Error Response Format

```typescript
{
  message: string,           // User-friendly error message
  code?: string,             // Error code for programmatic handling
  details?: {                // Additional error context
    field?: string,          // For validation errors
    [key: string]: unknown
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource already exists or state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Server error |

---

## Usage Examples

### Using apiClient directly

```typescript
import { apiClient } from '@/lib/api/client';

// GET
const goals = await apiClient.get('/api/goals');

// POST
const newGoal = await apiClient.post('/api/goals', {
  name: 'Learn TypeScript',
  priority: 'high'
});

// PUT
const updated = await apiClient.put('/api/goals/123', {
  name: 'Master TypeScript'
});

// DELETE
await apiClient.delete('/api/goals/123');
```

### Using useQuery hook

```typescript
import { useQuery } from '@/lib/cache/invalidation';

function GoalsList() {
  const { data: goals, isLoading, error, refetch } = useQuery({
    queryFn: () => apiClient.get('/api/goals'),
    invalidateOn: ['goals'],
    onSuccess: (data) => console.log('Goals loaded'),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {goals?.map(goal => <li key={goal.id}>{goal.name}</li>)}
    </ul>
  );
}
```

### Using useMutation hook

```typescript
import { useMutation } from '@/lib/cache/invalidation';

function CreateGoal() {
  const { mutate, isLoading, error } = useMutation({
    mutationFn: (data) => apiClient.post('/api/goals', data),
    invalidateOn: 'CREATE_GOAL',
    onSuccess: () => alert('Goal created!'),
  });

  return (
    <button onClick={() => mutate({ name: 'New Goal' })} disabled={isLoading}>
      Create Goal
    </button>
  );
}
```

---

## Authentication Notes

- Sessions are stored in HTTP-only cookies (cannot be accessed via JavaScript)
- All API requests automatically include cookies (credentials: 'include')
- On 401 response, SyncStateContext shows error notification
- Manual session check available via `GET /api/auth/session`

---

## Caching Strategy

- **GET requests**: Deduplicated (same request in flight shares response)
- **Mutations**: Clear GET cache on POST/PUT/DELETE
- **Polling**: 30-second interval via SyncStateContext
- **Manual refresh**: Call `refetch()` from useQuery or `refresh()` from useSyncState

---

## Migration Checklist

- [ ] All API calls use `apiClient` from `lib/api/client`
- [ ] Response types defined for all endpoints
- [ ] Error handling consistent (try/catch or hook errors)
- [ ] useQuery/useMutation used for data fetching
- [ ] Cache invalidation properly configured
- [ ] Request/response logged in dev (useEffect dependencies)
