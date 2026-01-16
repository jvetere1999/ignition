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

This ensures the instruction file stays current and progress is tracked in this file itself.

---

## ANALYSIS TEMPLATE

Every component analysis follows this structure:

```markdown
# [COMPONENT_NAME] Code Cleanup Analysis

**Analyzed**: YYYY-MM-DD HH:MM UTC  
**Component**: [backend_sync | frontend_synccontext | backend_habits | etc]  
**Status**: COMPLETE / IN-PROGRESS / BLOCKED  
**Lines Analyzed**: XXX  
**Findings**: X issues identified  

## 1. COMMON OPERATIONS TO EXTRACT

### Operation: [Name]
- **Location**: file.rs:123-145, file.rs:200-215
- **Current Pattern**: [Code snippet]
- **Extraction**: Create function `extracted_name()`
- **Impact**: Used in N places, saves M lines
- **Priority**: HIGH / MEDIUM / LOW
- **Effort**: X hours

---

## 2. CODE CLEANUP OPPORTUNITIES

### Issue: [Type]
- **Location**: file.rs:123
- **Current**: [Code]
- **Better**: [Code]
- **Why**: [Explanation]
- **Effort**: X hours
- **Risk**: LOW / MEDIUM / HIGH

---

## 3. MISSING COMMENTS/DOCUMENTATION

### Location**: file.rs:50-75
- **Current**: [Code without docs]
- **Needs**: [What comment is needed]
- **Type**: DOCSTRING / INLINE / MODULE_COMMENT
- **Effort**: 15 minutes

---

## 4. DEPRECATION CANDIDATES

### Code: [Function/Module name]
- **Location**: file.rs:XXX
- **Reason**: [Why it should be deprecated]
- **Alternative**: [What to use instead]
- **Users**: [Where it's used]
- **Action**: DEPRECATE / REMOVE / REFACTOR
- **Effort**: X hours

---

## 5. LINT ERRORS & WARNINGS

### Warning: [Type]
- **Location**: file.rs:123
- **Current**: [Code]
- **Fix**: [How to fix]
- **Effort**: 5-15 minutes

---

## SUMMARY

| Category | Count | Total Effort | Priority |
|----------|-------|--------------|----------|
| Common Operations | X | X hours | [HIGH/MED/LOW] |
| Code Cleanup | X | X hours | [HIGH/MED/LOW] |
| Documentation | X | X hours | [HIGH/MED/LOW] |
| Deprecations | X | X hours | [HIGH/MED/LOW] |
| Lint Fixes | X | X hours | [HIGH/MED/LOW] |

**Total Effort**: XX hours  
**Recommended Action**: [PROCEED / DEFER / SCHEDULE]

---

## NEXT STEPS

- [ ] Share findings with team
- [ ] Prioritize by effort/impact
- [ ] Schedule implementation
```

---

## BACKEND COMPONENTS TO ANALYZE

### TIER 1: HIGH IMPACT (Sync-related, will be modified for optimization)

- [ ] `backend_sync_polls` - /sync/poll and related endpoints
  - File: `app/backend/crates/api/src/routes/sync.rs` (542 lines)
  - Why: Core optimization target, duplicated query logic
  
- [ ] `backend_badges_queries` - Badge count extraction
  - File: `app/backend/crates/api/src/routes/sync.rs` (lines 400-480)
  - Why: 4 similar queries, can be deduplicated
  
- [ ] `backend_progress_fetcher` - Progress data aggregation
  - File: `app/backend/crates/api/src/routes/sync.rs` (lines 240-280)
  - Why: Complex XP calculation, document assumptions
  
- [ ] `backend_habits_repo` - Habits repository pattern
  - File: `app/backend/crates/api/src/db/habits_goals_repos.rs` (686 lines)
  - Why: Large monolithic repo, identify extract-able operations

- [ ] `backend_quests_repo` - Quests repository pattern
  - File: `app/backend/crates/api/src/db/quests_repos.rs` (XXX lines)
  - Why: Similar pattern to habits, consistency opportunity

- [ ] `backend_focus_repo` - Focus/session repository
  - File: `app/backend/crates/api/src/db/focus_repos.rs` (XXX lines)
  - Why: Complex session state management

### TIER 2: MEDIUM IMPACT (Used by sync, but separate concern)

- [ ] `backend_gamification_logic` - XP and coin calculations
  - File: `app/backend/crates/api/src/db/gamification_repos.rs`
  - Why: Hard to test, complex business logic
  
- [ ] `backend_vault_state` - Vault lock synchronization
  - File: `app/backend/crates/api/src/routes/vault.rs`
  - Why: Cross-device sync logic, document invariants
  
- [ ] `backend_error_handling` - AppError and error responses
  - File: `app/backend/crates/api/src/error.rs`
  - Why: Consistency in error serialization
  
- [ ] `backend_auth_middleware` - Authentication & session
  - File: `app/backend/crates/api/src/middleware/auth.rs`
  - Why: Critical path, ensure no dead code

- [ ] `backend_response_wrappers` - Generic wrapper patterns
  - Multiple files in `routes/`
  - Why: Possible to simplify or standardize

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

## ANALYSIS EXECUTION WORKFLOW

### Before Starting Analysis
1. Read this instruction file
2. Pick ONE component from TODO list (start with TIER 1)
3. Read the component thoroughly (all related files)
4. Take notes in scratch format

### During Analysis
1. Create file: `debug/analysis/[COMPONENT_NAME].md`
2. Fill in template sections with findings
3. Document each finding with location + specifics
4. Be exhaustive - find ALL issues, don't defer

### After Analysis Complete
1. Validate findings are complete and accurate
2. **IMMEDIATELY**: Edit THIS FILE
3. **REMOVE** component from TODO list (delete the line)
4. Save and commit this instruction update
5. **DO NOT** proceed to next component until this file is updated

### Checkpoints
- After every 5 components analyzed: Review patterns
- After every 10 components analyzed: Consolidate findings
- After all components: Aggregated impact report

---

## CURRENT PROGRESS

### Backend Analysis Progress
- Total Tier 1: 6 components
- Total Tier 2: 5 components
- Total Tier 3: 3 components
- **Total**: 14 backend components
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 14

### Frontend Analysis Progress
- Total Tier 1: 4 components
- Total Tier 2: 4 components
- Total Tier 3: 3 components
- **Total**: 11 frontend components
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 11

### Overall
- **Total Components**: 25
- **Estimated Total Effort**: 60-80 hours
- **Rate**: 1-2 components per day
- **Timeline**: 3-4 weeks at normal pace

---

## IMPORTANT NOTES

### What to Include in Each Analysis
✅ Specific line numbers  
✅ Exact code snippets (short, contextual)  
✅ Effort estimates (hours, be realistic)  
✅ Risk assessment (LOW/MEDIUM/HIGH)  
✅ Priority (based on impact + frequency of use)  
✅ Action items (specific PR suggestions)  

### What NOT to Do
❌ Don't start implementation during analysis
❌ Don't commit code changes in analysis phase
❌ Don't skip tier 1 components for tier 3
❌ Don't defer writing analysis to "later"
❌ Don't batch multiple components in one file

### Quality Standards
- Each location must be verifiable (file:line)
- Each recommendation must have reasoning
- Effort estimates must account for testing
- Code snippets must be exact (copypasteable)

---

## REMOVAL INSTRUCTIONS (CRITICAL)

**When component analysis is complete**:

1. Open THIS FILE (`debug/CLEANUP_INSTRUCTION.md`)
2. Find the component in the TODO list
3. **DELETE the entire line** (including the [ ] checkbox)
4. Save file
5. **Verify**: `git diff` shows removal of that line
6. Commit message: `Completed cleanup analysis: backend_sync_polls`

**Example**:
```diff
- [ ] `backend_sync_polls` - /sync/poll and related endpoints
  
// Component removed from instruction

- [ ] `backend_badges_queries` - Badge count extraction
```

### Why This Matters
- Instruction file becomes **source of truth for progress**
- No separate tracking needed
- Clear what's done vs remaining
- Auto-updates as work completes

---

## STARTING THE CLEANUP

### Phase 1: Setup (15 minutes)
1. Create `debug/analysis/` folder (if not exists)
2. Read this instruction fully
3. Review first Tier 1 component files

### Phase 2: First Component (2-3 hours)
**Start with**: `backend_sync_polls`
- Reason: Highest impact, clearest scope (single file)
- Creates pattern for remaining analyses
- Directly informs optimization phase

### Phase 3: Momentum (Daily)
- Analyze 1-2 components per day
- Update this instruction immediately
- Review findings for patterns

### Phase 4: Consolidation (Weekly)
- After 5-7 components: Review patterns
- Identify common themes
- Adjust priorities if needed

---

## SUCCESS CRITERIA

This cleanup is **SUCCESSFUL** when:
- ✅ All 25 components analyzed
- ✅ All analyses in `debug/analysis/` folder
- ✅ This instruction file empty of TODO items
- ✅ 50-70 hours of improvement opportunities documented
- ✅ Clear roadmap for next phase (optimization)
- ✅ 1-2 quick wins identified for immediate implementation

---

## REFERENCE: ANALYSIS CHECKLIST

Use this to verify each analysis is complete:

```
COMPONENT: [Name]
Status: Complete? [ ] Yes

Sections Filled:
[ ] 1. Common Operations to Extract (location + impact)
[ ] 2. Code Cleanup Opportunities (before/after examples)
[ ] 3. Missing Comments/Documentation (what docs needed)
[ ] 4. Deprecation Candidates (unused code + alternatives)
[ ] 5. Lint Errors & Warnings (all flagged issues)
[ ] SUMMARY (effort table + recommendation)

Quality Checks:
[ ] All locations include file:line
[ ] All code snippets are exact & verifiable
[ ] All effort estimates are realistic (account for testing)
[ ] All risks assessed
[ ] Priorities assigned (HIGH/MED/LOW)
[ ] Next steps clear

Ready to Remove from Instruction: [ ] Yes
```

---

## FINAL NOTE

This instruction is a **living document**.

- Update IMMEDIATELY when components complete
- Remove completed items from TODO lists
- Adjust estimates as you go
- Consolidate patterns between similar components

The instruction file's state = project progress.

**Done with a component?** 
→ Remove it from THIS file
→ Next person (or future you) sees only what remains

**Start with backend_sync_polls.**
