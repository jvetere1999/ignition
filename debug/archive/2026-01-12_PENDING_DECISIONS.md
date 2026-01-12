# PENDING DECISIONS - AWAITING USER INPUT

**Status**: 🟠 **BLOCKING NEW WORK - DO NOT PROCEED**  
**Date**: 2026-01-12 16:42 UTC

---

## ⏳ Decision #1: API Response Format Standardization (P0)

**Issue**: New production errors - Plan my day, Focus, Quests, Ignitions all returning 500 errors

**Root Cause**: Response format mismatch between backend and frontend

**Current State**:
- Backend: Returns `{ data: response }` format
- Frontend: Expects different formats depending on endpoint

**Three Options**:

### Option A: Standardize Backend to REST Format ⭐ RECOMMENDED
- Change all backend endpoints to return `{ <resource>: data }` format
- Example: `{ goals: [...] }`, `{ quests: [...] }`, `{ session: {...} }`
- Effort: 3-4 hours
- Benefit: REST convention, cleaner separation
- Risk: Multiple route files must be changed correctly

### Option B: Standardize Frontend to Backend Format
- Change all frontend files to expect `{ data: response }` format
- Keep backend as-is
- Effort: 2-3 hours
- Benefit: No backend changes
- Risk: Extra nesting level, less intuitive API

### Option C: Hybrid - Fix Critical Paths Only
- Fix only Plan my day, Focus, Quests, Ignitions
- Leave other features as-is
- Effort: 1 hour
- Benefit: Fastest unblock
- Risk: Technical debt, inconsistent codebase

**Decision Needed**: Select A, B, or C

**Impact If Not Decided**: 
- Cannot fix current production failures
- Plan my day, Focus, Quests, Ignitions remain broken
- ~20 features blocked

---

## ⏳ Decision #2: Auth Redirect Target on 401 (P1 - Lower Priority)

**Issue**: When session expires, where should user be redirected?

**Current Code Location**: `app/frontend/src/lib/api/client.ts:132`

### Option A: Redirect to Main Landing Page `/` ⭐ RECOMMENDED
- User sees landing page, can browse or sign in
- Clean slate experience
- Pros: Natural flow, user choice, no loop
- Cons: Loses context of where they were

### Option B: Redirect to Sign-In Page `/auth/signin`
- Forces user to re-authenticate immediately
- Pros: Direct path to login, clear action
- Cons: More aggressive, less friendly

**Decision Needed**: Select A or B

**Impact If Not Decided**: 
- Lower priority (auth already implemented)
- Can decide later

---

## ✅ Already Decided (Not Pending)

| Item | Decision | Status |
|------|----------|--------|
| Schema mismatch (is_read) | Option A | ✅ COMPLETE |
| P0-P5 decisions | Various | ✅ ALL COMPLETE |

---

## What I'm Blocked On

**Cannot proceed with**:
1. Fixing Plan my day errors → Need Decision #1 (A/B/C)
2. Fixing Focus errors → Need Decision #1 (A/B/C)
3. Fixing Quest errors → Need Decision #1 (A/B/C)
4. Fixing Ignition errors → Need Decision #1 (A/B/C)
5. Auth redirect fix → Need Decision #2 (A/B) - lower priority

**What I've Done So Far**:
- ✅ Fixed is_read → is_processed in today.rs:438
- ✅ Regenerated schema (generate_schema.sh)
- ✅ Validated: cargo check (0 errors), npm lint (0 errors)
- ⏳ Waiting for decision before pushing to production

---

## Next Steps

**User Action Required**:
1. **Read Decisions #1 and #2 above**
2. **Reply with your selections**:
   - Decision #1: Option A, B, or C?
   - Decision #2: Option A or B?

**Then I Will**:
1. Implement your selected options
2. Test thoroughly
3. Prepare for deployment

---

**Status**: Halted and waiting for your decisions. No further work will proceed until you confirm.
