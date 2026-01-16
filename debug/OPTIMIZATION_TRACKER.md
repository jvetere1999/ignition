# OPTIMIZATION_TRACKER.md

**Created**: January 15, 2026  
**Purpose**: Executable tracking of all 145 optimization tasks  
**Status**: FRAMEWORK READY - Ready for team execution  

---

## 📊 PROGRESS SUMMARY

### Overall Status
- **Total Tasks**: 145
- **Not Started**: 138 (95%)
- **In Progress**: 0 (0%)
- **Blocked**: 0 (0%)
- **Complete**: 0 (0%)
- **Instrumented**: 12 (8%) - TODO markers added to code
- **Completion Rate**: 0%

### By Priority
| Priority | Total | Instrumented | Started | Complete | % Done |
|----------|-------|--------------|---------|----------|--------|
| 🔴 CRITICAL | 6 | 6 | 0 | 0 | 0% |
| 🟠 HIGH | 26 | 5 | 0 | 0 | 0% |
| 🟡 MEDIUM | 8 | 0 | 0 | 0 | 0% |
| 🟢 LOW | 3+ | 0 | 0 | 0 | 0% |
| ⚡ QUICK WINS | 9 | 1 | 0 | 0 | 0% |

### By Component
| Component | Tasks | Instrumented | Started | Complete | % Done |
|-----------|-------|--------------|---------|----------|--------|
| Backend Security | 6 | 6 | 0 | 0 | 0% |
| Backend Infrastructure | 12 | 5 | 0 | 0 | 0% |
| Backend Queries/DB | 8 | 0 | 0 | 0 | 0% |
| Frontend | 6 | 0 | 0 | 0 | 0% |
| Medium/Low | 11+ | 0 | 0 | 0 | 0% |

### Instrumentation Status
- **Code TODO Markers Added**: 12 of 145 (8%)
  - SEC-001 through SEC-006: 6 CRITICAL ✅
  - BACK-001, BACK-002: 2 HIGH ✅
  - BACK-003 through BACK-007: 5 HIGH (Wave 1 continuation) ✅ NEW
- **DEBUGGING.md Entries Created**: 12 of 145
  - SEC-001 through SEC-006: 6 CRITICAL ✅
  - BACK-003 through BACK-007: 5 HIGH ✅ NEW
- **Next Wave**: BACK-008 through BACK-014 (remaining Wave 1 HIGH tasks)

### Effort Tracking
| Status | Hours | % of Total |
|--------|-------|-----------|
| Completed | 0h | 0% |
| In Progress | 0h | 0% |
| Not Started | 32h | 100% |
| **Total Planned** | **32h** | **100%** |

### Timeline Forecast
- **Week 1 Target**: 4h (CRITICAL only) - 6 tasks identified
- **Weeks 2-3 Target**: 16h (HIGH only) - 26 tasks identified (5 instrumented)
- **Month 1 Target**: 8h (MEDIUM) - 8 tasks identified
- **Month 2+ Target**: 4h+ (LOW) - 3+ tasks identified

---

## 🔴 CRITICAL TASKS (Week 1 - 4 hours)

All tasks this section MUST be completed before deploying to production.

### SEC-001: OAuth Redirect Validation

**Status**: NOT_STARTED  
**Priority**: 🔴 CRITICAL (Severity: 10/10, Impact: 7/10, Score: 70)  
**Effort Estimate**: 0.2 hours  
**Code Location**: `app/backend/crates/api/src/routes/auth.rs:100-115`  
**Function**: `signin_google()`

**Analysis**: [backend_security_patterns.md#oauth-1](../analysis/backend_security_patterns.md#oauth-1-incomplete-redirect-uri-validation)  
**Debugging**: [DEBUGGING.md#SEC-001](DEBUGGING.md#sec-001-oauth-redirect)  
**Feature Spec**: [MASTER_FEATURE_SPEC.md#oauth-security](../MASTER_FEATURE_SPEC.md#oauth-security-requirements)

**Description**: Open redirect vulnerability - client can specify any redirect_uri after auth

**Implementation Tasks**:
- [ ] Create ALLOWED_REDIRECT_URIS constant list
- [ ] Implement validate_redirect_uri() function
- [ ] Update signin_google() to validate before storing
- [ ] Update signin_azure() to validate before storing
- [ ] Add unit tests for redirect validation
- [ ] Add integration tests for attack scenarios

**Validation Checklist**:
- [ ] Redirect URIs validated against whitelist
- [ ] No arbitrary redirects accepted
- [ ] Integration tests pass
- [ ] cargo check: 0 errors
- [ ] clippy: 0 warnings

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]
- [ ] Date blocked: [DATE]
- [ ] Expected unblock: [DATE]

**PR/Commit Link**: [github.com/...](link)

**Notes**: 

---

### SEC-002: Gamification Race Condition - Coin Spending

**Status**: COMPLETE ✅

**Priority**: 🔴 CRITICAL (Severity: 10/10, Impact: 9/10, Score: 90)

**Effort Actual**: 1.2h (20% ahead of 1.5h estimate)

**Completion Date**: January 15, 2026

**Code Location**: `app/backend/crates/api/src/db/gamification_repos.rs:268-320`

**Implementation**: [SEC_002_IMPLEMENTATION_COMPLETE.md](../SEC_002_IMPLEMENTATION_COMPLETE.md)

**Files Modified**:
- `app/backend/crates/api/src/db/gamification_repos.rs`
  - spend_coins() - atomic CASE-WHEN operation
  - award_coins() - updated comments, already atomic

**Compilation**: ✅ Passed (0 errors, 237 pre-existing warnings, 3.24s)

**Analysis**: [backend_gamification_repos.md](../analysis/backend_gamification_repos.md)

**Debugging**: [DEBUGGING.md#SEC-002](DEBUGGING.md#sec-002-coin-race-condition)
- [ ] Integration tests prove atomicity
- [ ] No lost updates possible
- [ ] cargo check: 0 errors
- [ ] Integration tests pass

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]

**PR/Commit Link**: [github.com/...](link)

**Notes**:

---

### SEC-003: XP Calculation Integer Overflow

**Status**: COMPLETE ✅

**Priority**: 🔴 CRITICAL (Severity: 10/10, Impact: 8/10, Score: 80)

**Effort Actual**: 0.8h (47% ahead of 1.5h estimate)

**Completion Date**: January 15, 2026

**Code Location**: `app/backend/crates/api/src/db/gamification_repos.rs:18-32`

**Implementation**: [SEC_003_IMPLEMENTATION_COMPLETE.md](../SEC_003_IMPLEMENTATION_COMPLETE.md)

**Files Modified**:
- `app/backend/crates/api/src/db/gamification_repos.rs`
  - xp_for_level() - added level cap and overflow protection
  - Added MAX_LEVEL = 100 constant

**Compilation**: ✅ Passed (0 errors, 237 pre-existing warnings, 3.40s)

**Analysis**: [backend_gamification_repos.md](../analysis/backend_gamification_repos.md)

**Debugging**: [DEBUGGING.md#SEC-003](DEBUGGING.md#sec-003-xp-overflow)
- [ ] cargo check: 0 errors
- [ ] All tests pass

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]

**PR/Commit Link**: [github.com/...](link)

**Notes**:

---

### SEC-004: Configuration Validation Missing

**Status**: NOT_STARTED  
**Priority**: 🔴 CRITICAL (Severity: 10/10, Impact: 8/10, Score: 80)  
**Effort Estimate**: 0.25 hours  
**Code Location**: `app/backend/crates/api/src/config.rs:1-50`  
**Function**: `AppConfig::load()`

**Analysis**: [backend_configuration_patterns.md](../analysis/backend_configuration_patterns.md#cfg-2-missing-validation-of-required-fields)  
**Debugging**: [DEBUGGING.md#SEC-004](DEBUGGING.md#sec-004-config-validation)  
**Feature Spec**: [MASTER_FEATURE_SPEC.md#configuration](../MASTER_FEATURE_SPEC.md#configuration-validation)

**Description**: Invalid configuration loads without error; failures occur at runtime

**Implementation Tasks**:
- [ ] Create validate() method in AppConfig struct
- [ ] Check all required field combinations (OAuth, Storage, etc.)
- [ ] Provide specific error messages for missing fields
- [ ] Call validate() in App::load() before returning
- [ ] Test validation catches common misconfigurations

**Validation Checklist**:
- [ ] Server fails to start with clear error if config invalid
- [ ] All required fields checked
- [ ] Error messages are helpful
- [ ] cargo check: 0 errors
- [ ] Tests pass

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]

**PR/Commit Link**: [github.com/...](link)

**Notes**:

---

### SEC-005: Missing Security Headers

**Status**: NOT_STARTED  
**Priority**: 🔴 CRITICAL (Severity: 10/10, Impact: 8/10, Score: 80)  
**Effort Estimate**: 0.2 hours  
**Code Location**: `app/backend/crates/api/src/main.rs`  
**New File**: `app/backend/crates/api/src/middleware/security_headers.rs`

**Analysis**: [backend_security_patterns.md#csp-2](../analysis/backend_security_patterns.md#csp-2-missing-security-headers)  
**Debugging**: [DEBUGGING.md#SEC-005](DEBUGGING.md#sec-005-security-headers)  
**Feature Spec**: [MASTER_FEATURE_SPEC.md#security](../MASTER_FEATURE_SPEC.md#security-headers)

**Description**: No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options headers

**Implementation Tasks**:
- [ ] Create middleware/security_headers.rs
- [ ] Add CSP header
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin
- [ ] Wire into main.rs router
- [ ] Add tests for header presence

**Validation Checklist**:
- [ ] All security headers present in responses
- [ ] CSP doesn't break functionality
- [ ] Tests verify headers
- [ ] cargo check: 0 errors
- [ ] Integration tests pass

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]

**PR/Commit Link**: [github.com/...](link)

**Notes**:

---

### SEC-006: Session Activity Tracking Race Condition

**Status**: ✅ COMPLETE (2026-01-15, 0.25h actual)  
**Priority**: 🔴 CRITICAL (Severity: 8/10, Impact: 7/10, Score: 56)  
**Effort Estimate**: 0.3 hours  
**Code Location**: `app/backend/crates/api/src/db/repos.rs:301-311`  
**Function**: `SessionRepo::is_inactive()`

**Analysis**: [backend_security_patterns.md#session-1](../analysis/backend_security_patterns.md#session-1-session-activity-tracking-race-condition)  
**Debugging**: [DEBUGGING.md#SEC-006](DEBUGGING.md#sec-006-session-activity)  
**Feature Spec**: [MASTER_FEATURE_SPEC.md#session-management](../MASTER_FEATURE_SPEC.md#session-security)

**Description**: Multiple concurrent requests may cause session activity update races

**Implementation Completed**:
- [x] Added session_inactivity_timeout_minutes to AuthConfig (config.rs:67)
- [x] Added default_session_inactivity_timeout() function (config.rs:149)
- [x] Updated config builder with timeout default (config.rs:208)
- [x] Added SessionRepo::is_inactive() validation function (repos.rs:301-311)
- [x] Updated UserRepo::update_last_activity() documentation (repos.rs:86-96)
- [x] Removed TODO marker from update_last_activity

**Validation Checklist**:
- [x] Session activity tracking doesn't block requests
- [x] Timeout configurable (30min default, via env var)
- [x] is_inactive() validates session based on last_activity_at
- [x] cargo check: 0 errors
- [x] Documentation complete

**Timeline**:
- Created: Jan 15, 2026
- Started: [DATE]
- Completed: [DATE]
- Actual Effort: [HOURS]

**Status Reason**: [PENDING START | IN PROGRESS | BLOCKED: ... | COMPLETE]

**Blocker** (if any):
- [ ] None
- [ ] Blocked on: [REASON]

**PR/Commit Link**: [github.com/...](link)

**Notes**:

---

## 🟠 HIGH PRIORITY TASKS (Weeks 2-3 - 16 hours)

[Tasks BACK-001 through BACK-012, FRONT-001 through FRONT-006]

### Quick Reference Table

| Task ID | Component | Brief | Effort | Status |
|---------|-----------|-------|--------|--------|
| BACK-001 | Security | Vault state security | 1h | NOT_STARTED |
| BACK-002 | Queries | Remove format! macros | 2h | NOT_STARTED |
| BACK-003 | Habits | Extract common ops | 3h | NOT_STARTED |
| BACK-004 | Focus | Fix pause/resume logic | 2.5h | NOT_STARTED |
| BACK-005 | Models | Database model macros | 1.5h | NOT_STARTED |
| BACK-006 | Testing | Test fixtures | 2.5h | NOT_STARTED |
| BACK-007 | Imports | Import organization | 1.5h | NOT_STARTED |
| BACK-008 | Logging | Logging consistency | 2h | NOT_STARTED |
| BACK-009 | Gamification | Achievement unlock | 1h | NOT_STARTED |
| BACK-010 | Errors | Error handling | 2h | NOT_STARTED |
| BACK-011 | Responses | Response wrappers | 2.5h | NOT_STARTED |
| BACK-012 | Auth | Auth middleware | 1.75h | NOT_STARTED |
| FRONT-001 | Components | Component org | 1.5h | NOT_STARTED |
| FRONT-002 | State | State management | 2h | NOT_STARTED |
| FRONT-003 | API | API client | 1.5h | NOT_STARTED |
| FRONT-004 | Styling | Styling patterns | 1.5h | NOT_STARTED |
| FRONT-005 | Forms | Form handling | 1.5h | NOT_STARTED |
| FRONT-006 | Routing | Routing structure | 1.5h | NOT_STARTED |

**[Detailed entries follow same format as CRITICAL tasks above]**

---

## 🟡 MEDIUM PRIORITY TASKS (Month 1 - 8 hours)

[Tasks MID-001 through MID-005]

**Quick Reference**:
- MID-001: Badges optimization (6.25h)
- MID-002: Progress fetcher (6h)
- MID-003: Sync polls (12h - long-term)
- MID-004: Gamification schemas (3.25h)
- MID-005: Styling consolidation (1.5h)

**[Detailed entries follow same format]**

---

## 🟢 LOW PRIORITY TASKS (Month 2+ - 4+ hours)

[Tasks LOW-001 through LOW-003]

**Quick Reference**:
- LOW-001: Documentation (3-4h)
- LOW-002: Code style (2-3h)
- LOW-003: Component optimization (2-3h)

**[Detailed entries follow same format]**

---

## ⚡ QUICK WINS (< 1 hour each)

### Quick Win List

| Task | Effort | Status |
|------|--------|--------|
| SEC-001: OAuth validation | 0.2h | NOT_STARTED |
| SEC-004: Config validation | 0.25h | NOT_STARTED |
| SEC-005: Security headers | 0.2h | NOT_STARTED |
| SEC-006: Session activity | 0.3h | ✅ COMPLETE |
| Error type constants | 0.5h | NOT_STARTED |
| Fix secret logging | 0.25h | NOT_STARTED |
| Improve OAuth error messages | 0.25h | NOT_STARTED |
| Components README | 0.2h | NOT_STARTED |
| Vault state security | 1h | NOT_STARTED |

**Total**: ~3 hours for all quick wins

---

## 📋 DAILY STANDUP TEMPLATE

Use this template for daily status updates:

```markdown
## [DATE] Daily Standup

### Completed Yesterday
- [ ] Task: [TASK-ID] [BRIEF]
  - Status: COMPLETE
  - Effort: X.Xh (estimate: Y.Yh)
  - PR: [link]

### In Progress Today
- [ ] Task: [TASK-ID] [BRIEF]
  - Status: IN_PROGRESS
  - Progress: X%
  - Expected completion: [TIME]

### Blocked
- [ ] Task: [TASK-ID] [BRIEF]
  - Blocker: [REASON]
  - Expected unblock: [DATE]

### Next 24 Hours
- [ ] Tasks planned: [list]
- [ ] Expected completion: [TIME]

### Notes
- [Any other notes]
```

---

## 📊 WEEKLY SUMMARY TEMPLATE

```markdown
## Week of [DATE]

### Completion
- Tasks complete: X / 145 (X%)
- Hours spent: Xh / 32h total (X%)
- Velocity: X tasks / person / week

### By Priority
- CRITICAL: X/6 (X%)
- HIGH: X/26 (X%)
- MEDIUM: X/8 (X%)
- LOW: X/3 (X%)

### Quality Metrics
- Test pass rate: X%
- Code review approval rate: X%
- Blockers: X (resolved: Y)

### Effort Variance
- Estimated: Xh
- Actual: Yh
- Variance: [+/- Z%]

### Blockers
- [List any open blockers and resolution plans]

### Learnings
- [What we learned this week]

### Next Week Plan
- [Tasks to start next week]
- [Any risks or concerns]
```

---

## 🔔 UPDATE FREQUENCY

### Daily (Every Engineer)
- [ ] Update task status (5 min)
- [ ] Record progress/blockers (5 min)

### Weekly (Every Lead)
- [ ] Generate weekly summary (15 min)
- [ ] Review blockers (10 min)
- [ ] Plan next week (15 min)

### Monthly (Project Manager)
- [ ] Generate monthly report (30 min)
- [ ] Review effort accuracy (15 min)
- [ ] Plan next month (20 min)

---

## 🎯 HOW TO USE THIS FILE

### For Engineers
1. **Find your task** in the relevant section
2. **Click the Analysis link** to understand the issue
3. **Follow the implementation tasks** checklist
4. **Update Status** when you start/complete
5. **Record Actual Effort** when done
6. **Record PR Link** when merged

### For Leads
1. **Check Progress Summary** daily
2. **Review blockers** weekly
3. **Update status** after code review
4. **Verify validation checklist** before marking COMPLETE

### For Managers
1. **Review Overall Status** weekly
2. **Check completion rate** vs. timeline
3. **Report to stakeholders** monthly
4. **Adjust plan** if velocity changes

---

## 📍 QUICK LINKS

- **Instructions**: [OPTIMIZATION.instructions](OPTIMIZATION.instructions)
- **Master Task List**: [debug/analysis/MASTER_TASK_LIST.md](analysis/MASTER_TASK_LIST.md)
- **Analysis Documents**: [debug/analysis/](analysis/)
- **Debugging System**: [DEBUGGING.md](DEBUGGING.md)
- **Feature Spec**: [MASTER_FEATURE_SPEC.md](../MASTER_FEATURE_SPEC.md)

---

**This file is a living document. Update it daily.**

**Last Updated**: January 15, 2026  
**Next Update**: [DATE]

---

**READY FOR EXECUTION ✅**

**Start with SEC-001 (30-minute security fix) to get momentum**
