# Decision A Implementation - API Response Format Standardization

**Date**: 2026-01-12 16:43 UTC  
**User Selection**: Option A for both decisions
**Decision 1**: Standardize frontend to match backend REST format
**Decision 2**: Redirect to `/` on 401 (already implemented ✅)

---

## Discovery Results

### Backend Response Format (CORRECT ✅)
Backend uses REST convention with resource-specific keys:
- `/api/quests` → `{ quests: Quest[] }`
- `/api/goals` → `{ goals: Goal[] }`
- `/api/habits` → `{ habits: Habit[] }`
- `/api/focus` → `{ sessions: FocusSession[] }`
- `/api/focus/active` → `{ session: FocusSession }`
- `/api/focus?stats=true` → `{ stats: FocusStats }`

### Frontend API Calls (WRONG - NEEDS FIX)
Frontend expects `{ data: ... }` wrapper, but backend doesn't provide it:
- quests.ts: `response.data` → should be `response.quests`
- goals.ts: `response.data` → should be `response.goals`
- habits.ts: `response.data` → should be `response.habits`
- focus.ts: `response.data` → should be `response.sessions` or `response.stats` or `response.session`
- exercise.ts, learn.ts, etc: Similar mismatches

---

## Implementation Plan

### Phase 5: FIX - Update 20+ Frontend API Files

**Files to Update** (in order of priority for critical features):
1. `app/frontend/src/lib/api/quests.ts` - Plan My Day dependency
2. `app/frontend/src/lib/api/goals.ts` - Plan My Day dependency
3. `app/frontend/src/lib/api/habits.ts` - Plan My Day dependency
4. `app/frontend/src/lib/api/focus.ts` - Focus sustainability critical
5. `app/frontend/src/lib/api/exercise.ts` - Workouts
6. `app/frontend/src/lib/api/learn.ts` - Learning
7. `app/frontend/src/lib/api/books.ts` - Books
8. And 12+ others

**Change Pattern**:
```typescript
// BEFORE: Response wrapper expects { data: T }
export async function listQuests(status?: QuestStatus): Promise<QuestsList> {
  const response = await apiGet<{ data: QuestsList }>(`/api/quests${query}`);
  return response.data;  // ❌ data field doesn't exist
}

// AFTER: Direct resource access
export async function listQuests(status?: QuestStatus): Promise<QuestsList> {
  const response = await apiGet<{ quests: QuestsList }>(`/api/quests${query}`);
  return response.quests;  // ✅ matches backend
}
```

---

## Status

- ✅ Phase 1: Discovery complete
- ⏳ Phase 2: Documentation (THIS FILE)
- ⏳ Phase 5: Implementation (20+ files)
- ⏳ Validation: cargo check + npm lint
- ⏳ Deployment: Ready for push

---

## Files to Change

### Critical Path (Blocking Features) - 4 files
1. `app/frontend/src/lib/api/quests.ts` - 6 changes
2. `app/frontend/src/lib/api/goals.ts` - 5 changes
3. `app/frontend/src/lib/api/habits.ts` - 2 changes
4. `app/frontend/src/lib/api/focus.ts` - 9 changes

### Important (Feature Complete) - 4 files
5. `app/frontend/src/lib/api/exercise.ts` - 10 changes
6. `app/frontend/src/lib/api/learn.ts` - 9 changes
7. `app/frontend/src/lib/api/books.ts` - 6 changes
8. `app/frontend/src/lib/api/ideas.ts` - 5 changes

### Secondary (Reference/Admin) - 8+ files
9. `app/frontend/src/lib/api/user.ts`
10. `app/frontend/src/lib/api/onboarding.ts`
11. `app/frontend/src/lib/api/market.ts`
12. `app/frontend/src/lib/api/feedback.ts`
13. `app/frontend/src/lib/api/inbox.ts`
14. `app/frontend/src/lib/api/infobase.ts`
15. `app/frontend/src/lib/api/references.ts`
16. `app/frontend/src/lib/api/references_library.ts`

---

## Authorization 401 Fix

**Status**: ✅ Already Implemented  
**File**: `app/frontend/src/lib/api/client.ts:132`  
**Behavior**: Redirects to `/` (correct per Decision 2 Option A)  
**No changes needed**

---

## Next Step

Ready for Phase 5 (FIX). Will now implement all 40+ response format corrections in frontend API files.
