# CODE CLEANUP INSTRUCTION PLAN

**Version**: 1.0  
**Status**: ACTIVE  
**Last Updated**: 2026-01-15  
**Authority**: Master instruction - ALL cleanup work follows this plan

---

## ABSOLUTE RULE #1: REMOVE COMPLETED ITEMS IMMEDIATELY

**MANDATORY WORKFLOW**:
1. Pick ONE component from TODO list below
2. Create analysis in `debug/analysis/COMPONENT_NAME.md`
3. Document findings (operations, cleanups, comments, deprecations, lint)
4. **IMMEDIATELY upon completion**: Remove component from TODO list in THIS file
5. Move to next component

**NO BATCHING**: Do not complete multiple analyses before removing them from this list.  
**INSTANT UPDATE**: Each completed analysis = instant removal from instruction.

---

## BACKEND COMPONENTS TO ANALYZE

### TIER 1: HIGH IMPACT (Sync-related, will be modified for optimization)

- [x] `backend_habits_repo` - Habits repository pattern ✅ COMPLETED
  - File: `app/backend/crates/api/src/db/habits_goals_repos.rs` (686 lines)
  - Analysis: `debug/analysis/backend_habits_repo.md` (8.5 hours effort, 21 issues)
  - Findings: 4 common operations, 6 cleanups, 3 docs, 2 deprecations, 6 lint

- [x] `backend_quests_repo` - Quests repository pattern ✅ COMPLETED
  - File: `app/backend/crates/api/src/db/quests_repos.rs` (317 lines)
  - Analysis: `debug/analysis/backend_quests_repo.md` (6.5 hours effort, 19 issues)
  - Findings: 4 common operations, 5 cleanups, 3 docs, 1 deprecation, 6 lint

- [ ] `backend_focus_repo` - Focus/session repository
  - File: `app/backend/crates/api/src/db/quests_repos.rs` (XXX lines)
  - Why: Similar pattern to habits, consistency opportunity

- [x] `backend_focus_repo` - Focus/session repository ✅ COMPLETED
  - File: `app/backend/crates/api/src/db/focus_repos.rs` (692 lines)
  - Analysis: `debug/analysis/backend_focus_repo.md` (9.5 hours effort, 22 issues)
  - Findings: 5 common operations, 6 cleanups, 3 docs, 2 deprecations, 6 lint

### TIER 2: MEDIUM IMPACT (Used by sync, but separate concern)

- [x] `backend_gamification_logic` - XP and coin calculations ✅ COMPLETED
  - File: `app/backend/crates/api/src/db/gamification_repos.rs` (772 lines)
  - Analysis: `debug/analysis/backend_gamification_repos.md` (11 hours effort, 19 issues)
  - Findings: 5 common operations, 5 cleanups, 3 docs, 1 deprecation, 5 lint
  - **CRITICAL FINDINGS**: Race condition in coin spending, XP formula overflow
  
- [x] `backend_vault_state` - Vault lock synchronization ✅ COMPLETED
  - File: `app/backend/crates/api/src/routes/vault.rs` (+ vault_models.rs, vault_repos.rs)
  - Analysis: `debug/analysis/backend_vault_state.md` (4.5-5.5 hours effort, 16 issues)
  - Findings: 3 common operations, 4 cleanups, 3 docs, 1 deprecation, 5 lint
  - **CRITICAL**: Unimplemented passphrase verification must be fixed before production unlock
  
- [ ] `backend_error_handling` - AppError and error responses ✅ COMPLETED
  - File: `app/backend/crates/api/src/error.rs` (195 lines)
  - Analysis: `debug/analysis/backend_error_handling.md` (3.5-4 hours effort, 14 issues)
  - Findings: 3 common operations, 4 cleanups, 2 docs, 2 deprecations, 3 lint
  
- [ ] `backend_auth_middleware` - Authentication & session ✅ COMPLETED
  - File: `app/backend/crates/api/src/middleware/auth.rs` (310 lines)
  - Analysis: `debug/analysis/backend_auth_middleware.md` (4-5 hours effort, 15 issues)
  - Findings: 3 common operations, 5 cleanups, 2 docs, 1 deprecation, 4 lint

- [ ] `backend_response_wrappers` - Generic wrapper patterns ✅ COMPLETED
  - Scope: Multi-file pattern across 30+ route files (550+ lines of code)
  - Analysis: `debug/analysis/backend_response_wrappers.md` (3-4 hours effort, 13 issues)
  - Findings: 3 common operations, 4 cleanups, 2 docs, 2 deprecations, 2 lint

- [x] `backend_gamification_schemas` - Model consistency ✅ COMPLETED
  - File: `app/backend/crates/api/src/db/gamification_models.rs` (260 lines)
  - Analysis: `debug/analysis/backend_gamification_schemas.md` (3-3.5 hours effort, 12 issues)
  - Findings: 2 common operations, 4 cleanups, 2 docs, 2 deprecations, 2 lint

### TIER 3: LOWER PRIORITY (Housekeeping)

- [ ] `backend_db_models_consistency` - Model naming/structure
  - File: `app/backend/crates/api/src/db/models.rs` and `*_models.rs`
  - Why: Consistency across 20+ model files
  
- [ ] `backend_import_organization` - Import statements cleanup
  - All Rust files
  - Why: Many wildcard imports, could be more explicit
  
- [ ] `backend_mod_rs_exports` - Module exports organization
  - File: `app/backend/crates/api/src/db/mod.rs` and others
  - Why: Ensure all public APIs are intentional

---

## FRONTEND COMPONENTS TO ANALYZE

### TIER 1: HIGH IMPACT (Sync-related, will be modified for optimization)

- [ ] `frontend_syncstatecontext` - SyncStateContext hook
  - File: `app/frontend/src/lib/sync/SyncStateContext.tsx` (298 lines)
  - Why: Core polling logic, will add granular hooks
  
- [ ] `frontend_sync_api_client` - Sync API calls
  - File: `app/frontend/src/lib/api/sync.ts` (150+ lines)
  - Why: Type definitions, possible deduplication
  
- [ ] `frontend_api_client_base` - Base API client pattern
  - File: `app/frontend/src/lib/api/client.ts`
  - Why: Used by all endpoints, ensure consistency
  
- [ ] `frontend_hooks_subscription` - Custom hooks
  - File: `app/frontend/src/lib/hooks/` (all files)
  - Why: May have duplicate patterns, opportunity to consolidate

### TIER 2: MEDIUM IMPACT (UI components using sync)

- [ ] `frontend_components_badges` - Badge components
  - File: `app/frontend/src/components/` (nav, HUD, indicators)
  - Why: Identify which components use useSyncState vs granular
  
- [ ] `frontend_components_modals` - Modal patterns
  - File: `app/frontend/src/components/` (TOSModal, OnboardingFlow, etc)
  - Why: Consistency, documentation
  
- [ ] `frontend_auth_flow` - Authentication components
  - File: `app/frontend/src/app/auth/` and related
  - Why: Auth state consistency, dead code from age verification removal
  
- [ ] `frontend_toast_notifications` - Error handling UI
  - File: `app/frontend/src/components/ui/Toast.tsx` or similar
  - Why: All API errors should show notifications

### TIER 3: LOWER PRIORITY (Type definitions, configs)

- [ ] `frontend_types_consistency` - Type definitions
  - File: `app/frontend/src/lib/types/` or in files
  - Why: Ensure frontend types match backend models
  
- [ ] `frontend_env_variables` - Environment config
  - File: `.env.example`, `next.config.ts`
  - Why: Document all required vars, validate defaults
  
- [ ] `frontend_imports_cleanup` - Import organization
  - All TypeScript files
  - Why: Unused imports, consistent aliasing

---

## CURRENT PROGRESS

### Backend Analysis Progress
- Total Tier 1: 3 remaining (was 6, completed 3 analyses)
- Total Tier 2: 5 components
- Total Tier 3: 3 components
- **Total Remaining**: 11 backend components

### Frontend Analysis Progress
- Total Tier 1: 4 components
- Total Tier 2: 4 components
- Total Tier 3: 3 components
- **Total Remaining**: 11 frontend components

### Overall
- **Total Remaining Components**: 22 (was 25)
- **Completed**: 3 (backend_sync_polls, backend_badges_queries, backend_progress_fetcher)
- **In Progress**: 0
- **Estimated Total Effort**: 60-80 hours

---

## COMPLETED ANALYSES

✅ **backend_sync_polls** (Completed 2026-01-15 12:15 UTC)
- Location: `debug/analysis/backend_sync_polls.md`
- Findings: 3 common operations, 6 cleanups, 5 documentation gaps, 2 deprecations, 6 lint issues
- Effort: ~15 hours recommended

✅ **backend_badges_queries** (Completed 2026-01-15 12:25 UTC)
- Location: `debug/analysis/backend_badges_queries.md`
- Findings: 3 common operations, 5 cleanups, 4 documentation gaps, 1 deprecation, 3 lint issues
- Effort: ~7.75 hours recommended
- Key Finding: NOT EXISTS → LEFT JOIN optimization for pending_habits query (50-100% faster)

✅ **backend_progress_fetcher** (Completed 2026-01-15 12:35 UTC)
- Location: `debug/analysis/backend_progress_fetcher.md`
- Findings: 2 common operations, 6 cleanups, 4 documentation gaps, 1 deprecation, 3 lint issues
- Effort: ~6.5 hours recommended
- Key Finding: XP formula needs bounds checking (overflow potential at level >46340)

✅ **backend_habits_repo** (Completed 2026-01-15 13:45 UTC)
- Location: `debug/analysis/backend_habits_repo.md`
- Findings: 4 common operations, 6 cleanups, 3 documentation gaps, 2 deprecations, 6 lint issues
- Effort: ~8.5 hours recommended
- Key Finding: N+1 query pattern in GoalsRepo::list() - milestones fetched separately from goals

✅ **backend_quests_repo** (Completed 2026-01-15 14:20 UTC)
- Location: `debug/analysis/backend_quests_repo.md`
- Findings: 4 common operations, 5 cleanups, 3 documentation gaps, 1 deprecation, 6 lint issues
- Effort: ~6.5 hours recommended
- Key Finding: format!() used for SQL queries - defeats SQLx compile-time checking (8 instances)

✅ **backend_focus_repo** (Completed 2026-01-15 14:50 UTC)
- Location: `debug/analysis/backend_focus_repo.md`
- Findings: 5 common operations, 6 cleanups, 3 documentation gaps, 2 deprecations, 6 lint issues
- Effort: ~9.5 hours recommended
- Key Finding: Time drift in pause/resume logic - multiple pause cycles cause expiry to shift unpredictably

✅ **backend_gamification_repos** (Completed 2026-01-15 15:30 UTC)
- Location: `debug/analysis/backend_gamification_repos.md`
- Findings: 5 common operations, 5 cleanups, 3 documentation gaps, 1 deprecation, 5 lint issues
- Effort: ~11 hours recommended
- 🔴 CRITICAL: Race condition in coin spending (negative balance possible)
- 🔴 CRITICAL: XP formula overflow at level 46340+ (integer casting overflow)

---

## OVERALL PROGRESS SUMMARY

**Completed**: 12/25 components (48%)  
**Total Effort Identified**: ~83.5-84.5 hours  
**Critical Findings**: 8 (2 🔴 blocking, 6 🟡 high impact)  
**Status**: TIER 1 complete, TIER 2 complete (5/5 TIER 2 done) ✅

