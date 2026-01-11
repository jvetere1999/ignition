# Error Summary

Based on the logs in `.tmp/a whole bunch of fucking errors`:

## Critical Database Schema Errors
The backend is trying to query tables and columns that do not exist in the connected database.

1.  **`error returned from database: relation "inbox_items" does not exist`**
    *   **Impact:** "Ideas does not post properly", "Planning" features likely broken.
    *   **Cause:** Missing migration `0019_user_inbox_tables.sql`.

2.  **`error returned from database: column up.level does not exist`**
    *   **Impact:** Profile loading, Auth, "Igntiions buggy", "TOS popback".
    *   **Cause:** `user_profiles` table (aliased as `up`) is missing the `level` column. This might be from `0002_gamification_substrate.sql` or a later modification.

3.  **`error returned from database: relation "user_quests" does not exist`**
    *   **Impact:** "New quest doesnt persist".
    *   **Cause:** Missing `0005_quests_substrate.sql` tables.

4.  **`error returned from database: relation "habit_completions" does not exist`**
    *   **Impact:** "create habit button doest work", "non of the exercise buttons work", "New goals dont persist".
    *   **Cause:** Missing `0004_habits_goals_substrate.sql` tables.

5.  **`relation "reference_tracks" does not exist`** (Inferred from "All references tracks failed")
    *   **Impact:** Reference tracks failure.
    *   **Cause:** Missing `0008_reference_tracks_substrate.sql` or `0021_user_references_library.sql`.

## API/Functional Failures
1.  **Planner 404**: Likely due to the backend route crashing on DB errors or the route not being registered correctly, or missing data for the planner to load.
2.  **Focus not surviving refresh**: State persistence failure, likely confirmed by "session store" comments.
3.  **Market failed to load**: Likely missing `marketplace_listings` or `0007_market_substrate.sql`.

## Conclusion
The database is significantly behind the application code. It appears to be missing migrations from `0004` onwards, or they were never applied to this specific Neon instance. The `up.level` error suggests even early migrations might be partial or modified.

**Action Plan:**
1.  Sync migration files: Ensure `app/backend/migrations` matches `app/database/migrations` (which seems more complete).
2.  Reset Database: Drop all tables/schema in the target Neon DB.
3.  Re-apply ALL migrations from scratch.
