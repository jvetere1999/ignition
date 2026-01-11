# Decision Payload Contract

The **Decision Payload** is the JSON response returned by `GET /api/today`. It instructs the frontend on what to render, enforcing the server's decisions.

## TypeScript Interface

Based on `app/backend/crates/api/src/routes/today.rs` and `app/frontend/src/lib/api/today.ts`.

```typescript
interface TodayResponse {
  userState: UserState;
  dynamicUIData: DynamicUIData | null;
  planSummary: DailyPlanSummary | null;
  personalization: UserPersonalization;
}

interface UserState {
  planExists: boolean;           // Has a plan been created for today?
  hasIncompletePlanItems: boolean; // Are there unchecked items?
  returningAfterGap: boolean;    // Is last_activity > 3 days ago? (Triggers Reduced Mode)
  firstDay: boolean;             // Is created_at == TODAY?
  focusActive: boolean;          // Is a session currently running?
  activeStreak: boolean;         // Is user on a streak?
}

interface DynamicUIData {
  quickPicks: QuickPick[];       // Ordered list of suggested actions
  resumeLast: ResumeLast | null; // Most recent context (e.g., Focus)
  interestPrimer: any | null;    // (Future) Interest discovery
}

interface QuickPick {
  module: string; // "habits" | "quests" | "inbox"
  route: string;  // Navigation target
  label: string;  // Button text
  count: number;  // Badge count (pending items)
}
```

## Logic Rules

1.  **Reduced Mode Trigger**:
    *   If `userState.returningAfterGap` is `true`, the frontend MUST collapse non-essential sections (Daily Plan, Explore) and show the `ReducedModeBanner`.

2.  **Starter Block Selection**:
    *   Derived from `userState`:
        *   If `firstDay` -> Show Onboarding/Welcome.
        *   If `focusActive` -> Show Active Session Timer.
        *   Else -> Show standard "Start Day" or "Daily Plan".

3.  **Quick Pick Ordering (Determinism)**:
    *   Currently implementing a stable waterfall:
        1.  Habits (if count > 0)
        2.  Quests (if count > 0)
        3.  Inbox (if count > 0)
    *   **Known Gap**: The "Resume Last" query uses `ORDER BY ended_at DESC` without a secondary ID sort, theoretically allowing non-determinism on strict timestamp ties.
    *   This order is **fixed** in the backend code `fetch_dynamic_ui`.
