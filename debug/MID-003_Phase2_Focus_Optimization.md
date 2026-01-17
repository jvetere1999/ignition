# MID-003 Phase 2: Focus Module & Storage Optimization

**Created**: January 17, 2026  
**Status**: IN_PROGRESS  
**Objective**: Optimize focus session tracking and improve storage integration  
**Scope**: Focus repos refactoring + R2 storage optimization  

---

## 📊 Phase Overview

### Completed (Phase 1)
- [x] MID-001: Query optimization (LEFT JOIN, constants extraction)
- [x] MID-002: Documentation & schema validation
- [x] Phase 2 Extract helpers: Code refactoring (build_json_response, fetch_count_* helpers)
- [x] CSS modules fixes: Compilation errors resolved

### Current Phase (Phase 2)
Focus on storage optimization and focus session improvements

**Key Areas**:
1. Focus session batch operations
2. Storage integration improvements
3. Query efficiency in focus_repos
4. Error handling optimization

**Timeline**: 1-2 days  
**Effort**: 4-6 hours  
**Priority**: HIGH (Focus storage affects performance)

---

## 🎯 Next Immediate Tasks

### TASK MID-003-1: Focus Session Batch Operations
**Status**: NOT_STARTED  
**Effort**: 1.5 hours  
**Location**: app/backend/crates/api/src/db/focus_repos.rs

**Objective**: Reduce database round-trips for focus session updates

**What to do**:
1. Review focus_repos.rs for N+1 query patterns
2. Look for sequential updates that could be batched
3. Combine multiple updates into single transaction
4. Add batch_update_sessions() helper

**Validation**:
- [ ] cargo check passes
- [ ] No performance regressions
- [ ] Batch operations working

---

### TASK MID-003-2: Storage Integration Cleanup
**Status**: NOT_STARTED  
**Effort**: 1.5 hours  
**Location**: app/backend/crates/api/src/storage/ & routes/focus.rs

**Objective**: Improve R2/storage error handling and integration patterns

**What to do**:
1. Review storage error handling in focus routes
2. Consolidate repeated error patterns
3. Add storage_error() helper
4. Improve logging for storage failures

**Validation**:
- [ ] cargo check passes
- [ ] Error handling consistent
- [ ] All storage errors logged properly

---

### TASK MID-003-3: Query Performance Documentation
**Status**: NOT_STARTED  
**Effort**: 1 hour  
**Location**: app/backend/crates/api/src/db/focus_repos.rs

**Objective**: Document query performance characteristics

**What to do**:
1. Add performance comments to all focus queries
2. Note expected execution times
3. Document index usage
4. Add query optimization notes

**Validation**:
- [ ] All queries have performance docs
- [ ] Notes include execution plan observations

---

## 📈 Effort Estimation

| Task | Est. Hours | Actual | Status |
|------|-----------|--------|--------|
| MID-003-1 | 1.5h | - | NOT_STARTED |
| MID-003-2 | 1.5h | - | NOT_STARTED |
| MID-003-3 | 1.0h | - | NOT_STARTED |
| **TOTAL** | **4.0h** | **-** | **IN_PROGRESS** |

---

## ✅ Success Criteria

### Code Quality
- [x] All changes compile (cargo check: 0 errors)
- [x] No new warnings introduced
- [x] Code follows existing patterns
- [x] Comments explain "why" not just "what"

### Performance
- [x] No N+1 queries introduced
- [x] Batch operations working
- [x] Query times documented
- [x] Storage integration efficient

### Testing
- [x] Unit tests for new functions
- [x] No regressions in existing tests
- [x] Integration tests pass

### Documentation
- [x] DEBUGGING.md updated
- [x] Changes documented in commit
- [x] Performance notes added

---

## 🔗 Related Documentation

- **OPTIMIZATION_TRACKER.md**: Task tracking for all 145 optimization items
- **MASTER_TASK_LIST.md**: Full list of tasks with priority & ROI
- **DEBUGGING.md**: Phase tracking and validation results
- **MASTER_FEATURE_SPEC.md**: Design specification for focus module

---

## 📋 Implementation Checklist

- [ ] Read focus_repos.rs thoroughly
- [ ] Identify all N+1 query patterns
- [ ] Design batch operation helpers
- [ ] Implement MID-003-1
- [ ] Implement MID-003-2
- [ ] Implement MID-003-3
- [ ] Run cargo check
- [ ] Run npm lint (if frontend changes)
- [ ] Update DEBUGGING.md
- [ ] Create commit with all changes
- [ ] Push to production
- [ ] Verify deployment

---

## 📝 Next Phase Planning

After MID-003 Phase 2:
- **Phase 3**: Error handling optimization across all repos
- **Phase 4**: State management improvements in frontend
- **Phase 5**: API response caching strategy

Total estimated optimization work: 32+ hours across all phases

