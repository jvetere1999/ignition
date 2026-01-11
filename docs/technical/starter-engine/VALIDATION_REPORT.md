# Starter Engine Validation Report

**Date:** January 10, 2026
**Status:** PASSED (With 1 Minor Gap Identified)

This document certifies the "Triple Validation" of the Starter Engine documentation against the codebase.

## 1. Consistency Validation
*   **Check:** No contradictions across docs.
*   **Result:** ✅ **Pass**.
    *   `README.md` correctly identifies the system as "Server-Driven".
    *   `DATAFLOW.md` accurately maps the flow from `today.rs` to `TodayClient.tsx`.
    *   `FUTURE_SPEC` docs clearly distinguish between "Current State" (Postgres-only) and "Initiative Requirements" (Neo4j).

## 2. Implementation Validation
*   **Check:** Every "current behavior" statement points to a real file path/function.
*   **Result:** ✅ **Pass**.
    *   **Backend Aggregation**: Verified in `app/backend/crates/api/src/routes/today.rs` (`get_today_data`, `fetch_dynamic_ui`).
    *   **Frontend Logic**: Verified in `app/frontend/src/app/(app)/today/TodayClient.tsx` (`computeVisibility`).
    *   **Soft Landing**: Verified in `app/frontend/src/lib/today/softLanding.ts`.
    *   **Quick Picks**: Confirmed strict "Waterfall" logic (Habits -> Quests -> Inbox) in `fetch_dynamic_ui`.

## 3. Safety & Determinism Validation
*   **Check:** Privacy rules and Determinism enforcement.
*   **Result:** ⚠️ **Conditional Pass**.
    *   **Privacy**: ✅ Confirmed `user_id` is the only identifier used in logic. No PII in decision payloads.
    *   **Determinism (General)**: ✅ Main Quick Pick lists are hardcoded order (Deterministic).
    *   **Determinism (Gap Found)**: ⚠️ "Resume Last" query uses `ORDER BY ended_at DESC LIMIT 1`.
        *   *Risk:* If two sessions end at the exact same millisecond, Postgres order is undefined.
        *   *Remediation:* Future query must be updated to `ORDER BY ended_at DESC, id ASC` to comply with the new "Determinism Policy" (Requirement #4).

## 4. Gaps Identified
| Gap | Location | Resolution |
| :--- | :--- | :--- |
| **Tie-Breaking** | `today.rs` (Resume Last) | Update query to include ID in sort key. |
| **Telemetry** | Frontend/Backend | No structured usage events found. Only standard page loads. |

## 5. File Verification
| Document Ref | Actual Path | Status |
| :--- | :--- | :--- |
| `today.rs` | `app/backend/crates/api/src/routes/today.rs` | ✅ Exists |
| `TodayClient.tsx` | `app/frontend/src/app/(app)/today/TodayClient.tsx` | ✅ Exists |
| `softLanding.ts` | `app/frontend/src/lib/today/softLanding.ts` | ✅ Exists |
| `flags/index.ts` | `app/frontend/src/lib/flags/index.ts` | ✅ Exists |
