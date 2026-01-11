# Decisions Required

**Created:** January 10, 2026  
**Status:** AWAITING INPUT  
**Purpose:** Document all ambiguous items requiring explicit decision before implementation

---

## How to Use This File

For each decision, choose an option and update the **Decision** field with your choice.
Once all decisions are made, implementation can proceed.

---

## DEC-001: Email Verification Tables

**Tables:** `verification_tokens`

**Context:** 
- Table exists in migration 0001
- No backend implementation
- No frontend implementation
- Would enable email verification flow

**Options:**
1. **KEEP** - Implement full email verification (magic links, email confirmation)
2. **DEFER** - Keep table but don't implement yet (future feature)
3. **REMOVE** - Delete from schema (OAuth-only auth)

**Recommendation:** DEFER (keep table, no code yet)

**Decision:** kill

---

## DEC-002: WebAuthn/Passkey Tables

**Tables:** `authenticators`

**Context:**
- Table exists in migration 0001
- Follows standard WebAuthn credential storage pattern
- No backend implementation
- Would enable passwordless login via device biometrics

**Options:**
1. **KEEP** - Implement WebAuthn/Passkeys support
2. **DEFER** - Keep table but don't implement yet
3. **REMOVE** - Delete from schema

**Recommendation:** DEFER (modern auth trend, keep for future)

**Decision:** kill

---

## DEC-003: Full RBAC System

**Tables:** `entitlements`, `role_entitlements`

**Context:**
- Tables exist in migration 0001
- Basic `roles` and `user_roles` ARE implemented
- Full entitlement system NOT implemented
- Would enable granular permission checks (e.g., "can_edit_quests", "can_view_analytics")

**Options:**
1. **KEEP** - Implement full RBAC with entitlements
2. **DEFER** - Keep tables but use simple role checks for now
3. **SIMPLIFY** - Remove entitlements, keep role-based only

**Recommendation:** DEFER (tables ready for when needed)

**Decision:** kill

---

## DEC-004: Skills System

**Tables:** `skill_definitions`, `user_skills`

**Context:**
- Tables exist in migration 0002
- Schema supports: skill categories, levels, star progression
- Currently NO backend implementation
- Currently NO frontend implementation
- Aligns with gamification vision (skills like Focus, Discipline, Knowledge)

**Options:**
1. **IMPLEMENT** - Full skill system with 6+ skills, levels, star rewards
2. **DEFER** - Keep tables, implement later
3. **REMOVE** - Delete from schema

**Recommendation:** **IMPLEMENT** - Core to gamification experience

**Proposed Skills:**
| Key | Name | Category | Max Level |
|-----|------|----------|-----------|
| `focus` | Focus | Mental | 100 |
| `discipline` | Discipline | Mental | 100 |
| `knowledge` | Knowledge | Academic | 100 |
| `fitness` | Fitness | Physical | 100 |
| `creativity` | Creativity | Creative | 100 |
| `wellness` | Wellness | Health | 100 |

**Decision:** Implement

---

## DEC-005: Plan Templates

**Tables:** `plan_templates`

**Context:**
- Table exists in migration 0006
- Would allow saving/sharing daily plan templates
- No backend implementation
- No frontend implementation

**Options:**
1. **IMPLEMENT** - Full template save/load/share
2. **DEFER** - Keep table, implement later
3. **REMOVE** - Delete from schema

**Recommendation:** DEFER

**Decision:** Implement

---

## DEC-006: User Rewards Table

**Tables:** `user_rewards`

**Context:**
- Table exists in migration 0017
- Stores claimable rewards (daily bonus, achievement rewards, etc.)
- Overlaps conceptually with `points_ledger`

**Options:**
1. **KEEP SEPARATE** - `user_rewards` for claimable, `points_ledger` for transactions
2. **CONSOLIDATE** - Merge into `points_ledger` with `is_claimed` column
3. **REMOVE** - Delete table, use `points_ledger` only

**Recommendation:** KEEP SEPARATE (cleaner separation)

**Decision:** Implemnt

---

## DEC-007: AI Market Recommendations

**Tables:** `market_recommendations`

**Context:**
- Table exists in migration 0017
- Would store AI-generated item suggestions
- Requires AI/ML infrastructure

**Options:**
1. **IMPLEMENT** - Build recommendation engine
2. **DEFER** - Keep table for future AI features
3. **REMOVE** - Delete from schema

**Recommendation:** DEFER (future AI feature per Behavioral.md)

**Decision:** Implement 

---

## DEC-008: Training Program Scheduling

**Tables:** `program_weeks`, `program_workouts`

**Context:**
- Tables exist in migration 0011
- Would enable multi-week training programs with day-by-day scheduling
- `training_programs` IS implemented
- These child tables are NOT implemented

**Options:**
1. **IMPLEMENT** - Full program scheduling (week views, workout assignments)
2. **DEFER** - Keep tables, implement later
3. **SIMPLIFY** - Remove, keep programs simple (no week structure)

**Recommendation:** IMPLEMENT (completes fitness feature)

**Decision:** Implement

---

## DEC-009: User Interests

**Tables:** `user_interests`

**Context:**
- Table exists in migration 0014
- Would store user-selected interest tags (music genres, fitness goals, etc.)
- No backend implementation
- Could drive personalization

**Options:**
1. **IMPLEMENT** - Add interest selection in onboarding
2. **DEFER** - Keep table for future personalization
3. **REMOVE** - Delete from schema

**Recommendation:** DEFER

**Decision:** Implemnt

---

## DEC-010: Feature Flags

**Tables:** `feature_flags`

**Context:**
- Table exists in migration 0018
- Would enable runtime feature toggling
- No backend implementation
- Alternative: environment variables

**Options:**
1. **IMPLEMENT** - DB-driven feature flags with admin UI
2. **DEFER** - Keep table, use env vars for now
3. **REMOVE** - Use env vars only, delete table

**Recommendation:** DEFER (env vars sufficient for now)

**Decision:** Defer

---

## DEC-011: Duplicate Purchase Tables

**Tables:** `user_purchases` (0007) vs `user_market_purchases` (0017)

**Context:**
- Both tables track market purchases
- 0007 version has more fields (quantity, uses_remaining, refund info)
- 0017 version is simpler
- Backend references BOTH

**Options:**
1. **KEEP 0007** - Use `user_purchases` with full fields
2. **KEEP 0017** - Use `user_market_purchases` (simpler)
3. **MERGE** - Single `user_purchases` with combined fields

**Recommendation:** MERGE into single `user_purchases`

**Decision:** Merge

---

## DEC-012: Analysis Frame Chunks (Legacy)

**Tables:** `analysis_frame_chunks`

**Context:**
- Table exists in migration 0008
- SUPERSEDED by migration 0009 (`analysis_frame_manifests`, `analysis_frame_data`)
- 0009 uses binary storage, more efficient
- Not referenced in backend

**Options:**
1. **REMOVE** - Delete legacy table
2. **KEEP** - Maintain for backwards compatibility

**Recommendation:** **REMOVE** (superseded)

**Decision:** REMOVE

---

## Summary

| ID | Topic | Recommendation | Your Decision |
|----|-------|----------------|---------------|
| DEC-001 | Email Verification | DEFER | |
| DEC-002 | WebAuthn | DEFER | |
| DEC-003 | Full RBAC | DEFER | |
| DEC-004 | Skills System | **IMPLEMENT** | |
| DEC-005 | Plan Templates | DEFER | |
| DEC-006 | User Rewards | KEEP SEPARATE | |
| DEC-007 | AI Recommendations | DEFER | |
| DEC-008 | Program Scheduling | **IMPLEMENT** | |
| DEC-009 | User Interests | DEFER | |
| DEC-010 | Feature Flags | DEFER | |
| DEC-011 | Duplicate Purchases | MERGE | |
| DEC-012 | Legacy Frames | **REMOVE** | |

---

## Once Decisions Are Made

1. Update this file with decisions
2. I will generate final migration files accordingly
3. Backend/Frontend implementation will follow
