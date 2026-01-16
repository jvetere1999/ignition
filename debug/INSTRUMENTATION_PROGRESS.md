# Code Instrumentation Progress Tracker

**Status**: Phase 1 (Code Instrumentation) In Progress  
**Date Started**: January 15, 2026  
**Target**: Add TODO markers to all 145 task locations  

---

## CRITICAL Tasks (6) - COMPLETE ✅

| Task ID | File | Line | Status | Date |
|---------|------|------|--------|------|
| SEC-001 | auth.rs | 100 | ✅ DONE | 2026-01-15 |
| SEC-002 | gamification_repos.rs | 228 | ✅ DONE | 2026-01-15 |
| SEC-003 | gamification_repos.rs | 290 | ✅ DONE | 2026-01-15 |
| SEC-004 | config.rs | TBD | ⏳ TODO | - |
| SEC-005 | auth.rs | 218 | ✅ DONE | 2026-01-15 |
| SEC-006 | repos.rs | 82 | ✅ DONE | 2026-01-15 |

**Progress**: 5/6 CRITICAL (83%)

---

## HIGH Priority Tasks (26) - Ready for Instrumentation

### Backend HIGH Priority (14 tasks)

| Task ID | File | Description | Priority | Effort | Status |
|---------|------|-------------|----------|--------|--------|
| BACK-001 | habits_goals_repos.rs | Date casting fix | HIGH | 0.5h | NOT_STARTED |
| BACK-002 | quests_repos.rs | Date casting fix | HIGH | 0.5h | NOT_STARTED |
| BACK-003 | gamification_repos.rs | Error handling consistency | HIGH | 2h | NOT_STARTED |
| BACK-004 | focus_repos.rs | Query optimization | HIGH | 1.5h | NOT_STARTED |
| BACK-005 | vault_repos.rs | Encryption validation | HIGH | 1.5h | NOT_STARTED |
| BACK-006 | search_repos.rs | Index management | HIGH | 1h | NOT_STARTED |
| BACK-007 | oauth_repos.rs | Token validation | HIGH | 1h | NOT_STARTED |
| BACK-008 | exercise_repos.rs | Data validation | HIGH | 1h | NOT_STARTED |
| BACK-009 | market_repos.rs | Transaction safety | HIGH | 1.5h | NOT_STARTED |
| BACK-010 | learn_repos.rs | Response formatting | HIGH | 0.5h | NOT_STARTED |
| BACK-011 | config.rs | Config validation | HIGH | 1h | NOT_STARTED |
| BACK-012 | error.rs | Error message consistency | HIGH | 1h | NOT_STARTED |
| BACK-013 | middleware/auth.rs | Session handling | HIGH | 1h | NOT_STARTED |
| BACK-014 | middleware/cors.rs | CORS policy review | HIGH | 0.5h | NOT_STARTED |

**Subtotal**: 14h effort

### Frontend HIGH Priority (12 tasks)

| Task ID | File | Description | Priority | Effort | Status |
|---------|------|-------------|----------|--------|--------|
| FRONT-001 | components/auth | Auth flow cleanup | HIGH | 1h | NOT_STARTED |
| FRONT-002 | hooks/useSync | Sync state management | HIGH | 2h | NOT_STARTED |
| FRONT-003 | hooks/useAuth | Auth context refactor | HIGH | 1h | NOT_STARTED |
| FRONT-004 | lib/api | API client consistency | HIGH | 1.5h | NOT_STARTED |
| FRONT-005 | components/forms | Form validation | HIGH | 1.5h | NOT_STARTED |
| FRONT-006 | store/* | State management | HIGH | 2h | NOT_STARTED |
| FRONT-007 | pages | Routing cleanup | HIGH | 1h | NOT_STARTED |
| FRONT-008 | components/layout | Layout refactor | HIGH | 1h | NOT_STARTED |
| FRONT-009 | styles | CSS organization | HIGH | 1h | NOT_STARTED |
| FRONT-010 | utils | Utility functions | HIGH | 1h | NOT_STARTED |
| FRONT-011 | lib/crypto | Encryption handling | HIGH | 1.5h | NOT_STARTED |
| FRONT-012 | components/ui | UI component consistency | HIGH | 1h | NOT_STARTED |

**Subtotal**: 14h effort

**HIGH Total**: 26 tasks, 28h effort

---

## Instrumentation Strategy

### Phase 1A: CRITICAL Tasks (COMPLETED ✅)
- 5 of 6 CRITICAL tasks instrumented
- SEC-004 pending (locate config.rs issue)
- **Status**: 83% complete

### Phase 1B: HIGH Priority Tasks (READY)
**Approach**: Instrument in waves
- **Wave 1** (Today): Backend HIGH tasks (BACK-001 through BACK-007)
- **Wave 2** (Tomorrow): Backend HIGH tasks (BACK-008 through BACK-014) + Frontend HIGH (FRONT-001 through FRONT-006)
- **Wave 3** (Day 3): Frontend HIGH (FRONT-007 through FRONT-012)

**Wave 1 Breakdown**:
1. BACK-001 (habits_goals_repos.rs) - Date casting
2. BACK-002 (quests_repos.rs) - Date casting
3. BACK-003 (gamification_repos.rs) - Error handling
4. BACK-004 (focus_repos.rs) - Query optimization
5. BACK-005 (vault_repos.rs) - Encryption
6. BACK-006 (search_repos.rs) - Index management
7. BACK-007 (oauth_repos.rs) - Token validation

**Time Estimate**: Wave 1 = 1-2 hours to add all TODOs

### Phase 1C: MEDIUM & LOW Tasks
- 8 MEDIUM tasks
- 3+ LOW tasks
- Estimated 3-4 hours to instrument all

---

## Next Steps (Incremental)

### Immediate (Next 1-2 hours)
- [ ] Locate exact line numbers for Wave 1 tasks (BACK-001 through BACK-007)
- [ ] Add TODO markers using pattern from SEC-001 through SEC-006
- [ ] Create entries in DEBUGGING.md for Wave 1

### This Evening
- [ ] Complete Wave 1 instrumentation
- [ ] Begin Wave 2 planning

### Tomorrow
- [ ] Execute Wave 2 (Backend HIGH continued + Frontend HIGH start)
- [ ] Update DEBUGGING.md with Wave 2 entries

### Day 3
- [ ] Complete Wave 3 (Frontend HIGH remaining)
- [ ] Begin MEDIUM priority instrumentation

---

## Reference: TODO Template

```rust
// TODO [TASK-ID]: Brief description
// Reference: analysis_doc.md#issue-section
// Roadmap: Step N of M
// Status: NOT_STARTED
```

---

## Progress Summary

| Category | Total | Done | % | ETA |
|----------|-------|------|---|-----|
| CRITICAL | 6 | 5 | 83% | ✅ Today |
| HIGH | 26 | 0 | 0% | ⏳ 2-3 days |
| MEDIUM | 8 | 0 | 0% | ⏳ 3-4 days |
| LOW | 3+ | 0 | 0% | ⏳ 4-5 days |
| **TOTAL** | **145** | **5** | **3%** | **6-8 days** |

---

## Timeline

- **Phase 1**: Code Instrumentation (6-8 days) - Add TODO markers
- **Phase 2**: DEBUGGING.md Entries (Parallel) - Already started for CRITICAL
- **Phase 3**: Team Setup (1-2 hours) - Tech lead briefing
- **Phase 4**: Execution (8-12 weeks) - Team executes 145 tasks

**All phases can proceed in parallel**. Execution can begin as soon as CRITICAL tasks are ready (TODAY).

---

**Last Updated**: 2026-01-15 (Session ongoing)  
**Next Update**: After Wave 1 completion
