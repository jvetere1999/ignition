# Starter Engine Architecture

## Web Tree Map

The visible components of the Starter Engine are located in the Frontend codebase.

```
app/frontend/
├── src/app/(app)/today/
│   ├── page.tsx               # Server Component (Shell)
│   ├── TodayClient.tsx        # Data Fetching & State container
│   ├── TodayGridClient.tsx    # Layout Logic & Soft Landing/Reduced Mode enforcement
│   ├── StarterBlock.tsx       # Primary "Next Action" CTA
│   ├── QuickPicks.tsx         # Dynamic UI Quick Actions
│   ├── ReducedModeBanner.tsx  # "Welcome Back" / Soft Landing UI
│   ├── MomentumBanner.tsx     # Post-action Feedback UI
│   └── ...                    # Other widgets (DailyPlan, Explore, etc.)
└── src/lib/today/
    ├── softLanding.ts         # Client-side Session Logic
    └── ...
```

## Backend + Database Map

The decision logic and data aggregation reside in the Backend.

```
app/backend/
└── crates/api/src/routes/
    └── today.rs               # CORE LOGIC: Aggregation, Quick Pick generation, User State
```

### Database Tables (Postgres)
The Engine reads from these tables to make decisions:

*   **Users & State**: `users` (`created_at`, `last_activity_at`), `user_progress` (streaks).
*   **Planning**: `daily_plans`, `daily_plan_items`.
*   **Activity**: `focus_sessions`, `habits`, `habit_completions`, `user_quest_progress`, `inbox_items`.

### Neo4j Projection
*   **Status**: Not currently implemented / Not used in runtime path.
*   **Plan**: Future integration for "Sequence Transitions" and advanced weighting.

## Key Logic Locations

| Concept | Location | Type |
| :--- | :--- | :--- |
| **Data Aggregation** | `crates/api/src/routes/today.rs` -> `get_today_data` | Backend |
| **Quick Pick Logic** | `crates/api/src/routes/today.rs` -> `fetch_dynamic_ui` | Backend |
| **Reduced Mode Trigger** | `crates/api/src/routes/today.rs` -> `fetch_user_state` (`returning_after_gap`) | Backend |
| **Soft Landing Logic** | `src/lib/today/softLanding.ts` | Frontend (Client) |
| **Visibility Rules** | `src/app/(app)/today/TodayClient.tsx` -> `computeVisibility` | Frontend (Client) |
