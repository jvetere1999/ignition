# CODE REVIEW AND CLEANUP INSTRUCTIONS

**Last Updated**: 2026-01-13  
**Status**: Active Cleanup Plan  
**Authority**: Comprehensive repo audit and cleanup tracker

---

## ABSOLUTE RULES

1. **Always update completed tasks** in this file with ✅ status and timestamp
2. **Document evidence** of completion (file paths, line numbers, validation results)
3. **No deletion without moving to deprecated/** (preserve history)
4. **Validate after each section** (lint, compile, test as appropriate)
5. **Update this file first** before marking any task complete

---

## REPO STRUCTURE BREAKDOWN

```
passion-os-next/
├── ROOT LEVEL (Section 1)
│   ├── Documentation files (*.md)
│   ├── Configuration files (package.json, etc.)
│   ├── Schema & generators
│   └── Scripts
├── app/ (Section 2)
│   ├── admin/
│   ├── backend/
│   ├── database/
│   ├── frontend/
│   └── r2/
├── .github/ (Section 3)
│   ├── workflows/
│   └── instructions/
├── debug/ (Section 4)
├── deprecated/ (Section 5)
├── docs/ (Section 6)
├── tests/ (Section 7)
├── tools/ (Section 8)
├── deploy/ (Section 9)
└── Other directories (Section 10)
```

---

## SECTION 1: ROOT LEVEL CLEANUP

### 1.1 Documentation Files (35+ markdown files in root)

**Status**: ⏹️ NOT STARTED

**Current State**:
- 35+ markdown files scattered in root directory
- Many are session summaries, bug reports, delivery manifests
- High redundancy with debug/ folder content
- Makes root cluttered and hard to navigate

**Cleanup Tasks**:

#### Task 1.1.1: Audit All Root Markdown Files
- [ ] Create inventory list with file purpose
- [ ] Identify duplicates with debug/ content
- [ ] Identify obsolete session summaries (older than 7 days)
- [ ] Identify files that should be in docs/
- [ ] **Evidence**: List created in this file below

**Inventory** (populate after audit):
```
# To be populated
```

#### Task 1.1.2: Move Session Summaries to debug/archive/
- [ ] Move all `*SUMMARY*.md` files older than 7 days
- [ ] Move all `DEBUG_*.md` files
- [ ] Move all `*_COMPLETE.md` files
- [ ] Move all `*_REPORT.md` files
- [ ] **Evidence**: `git mv` commands logged here
- [ ] **Validation**: Root has <10 markdown files after cleanup

**Files to Move** (populate during task):
```
# To be populated with exact commands
```

#### Task 1.1.3: Consolidate Documentation
- [ ] Merge redundant deployment docs into docs/DEPLOYMENT_SETUP.md
- [ ] Merge testing docs into docs/TESTING_GUIDE.md
- [ ] Keep only: README.md, CONTRIBUTING.md (create if missing), CHANGELOG.md (create if missing)
- [ ] **Evidence**: Diff of consolidated files
- [ ] **Validation**: Root has exactly 3 documentation files

#### Task 1.1.4: Create Missing Root Docs
- [ ] Create CONTRIBUTING.md with dev setup, git workflow, testing
- [ ] Create CHANGELOG.md with version history from git tags
- [ ] Update README.md to remove outdated content
- [ ] **Evidence**: New file paths and word counts
- [ ] **Validation**: All files pass markdown lint

**Completion Criteria**:
- ✅ Root has ≤10 markdown files
- ✅ All session summaries moved to debug/archive/
- ✅ README.md updated and concise
- ✅ CONTRIBUTING.md and CHANGELOG.md exist

---

### 1.2 Root Configuration Files

**Status**: ⏹️ NOT STARTED

**Current State**:
- package.json (root level - for E2E tests)
- playwright.api.config.ts
- .env.local.example
- .dev.vars.example
- .gitignore
- Various shell scripts

**Cleanup Tasks**:

#### Task 1.2.1: Audit Configuration Files
- [ ] Verify package.json is only for root-level E2E tests
- [ ] Check for unused dependencies
- [ ] Verify .env examples are up to date
- [ ] **Evidence**: Dependency audit output
- [ ] **Validation**: npm audit shows 0 vulnerabilities

#### Task 1.2.2: Consolidate Scripts
- [ ] Move all .sh scripts to scripts/ directory
- [ ] Exception: generate_schema.sh (frequently used, can stay)
- [ ] Update documentation for new script paths
- [ ] **Evidence**: List of moved scripts
- [ ] **Validation**: All scripts executable and documented

**Files to Check**:
- [ ] .git_commit.sh → scripts/
- [ ] commit-pitfall-fixes.sh → scripts/
- [ ] reset.sql → app/database/
- [ ] generated_*.{sql,ts,rs} → verify these are build artifacts (should be in .gitignore)

**Completion Criteria**:
- ✅ All shell scripts in scripts/ (except generate_schema.sh)
- ✅ No build artifacts in root (added to .gitignore)
- ✅ All config files documented in README.md

---

### 1.3 Schema & Code Generation

**Status**: ⏹️ NOT STARTED

**Current State**:
- schema.json (v2.0.0 - authoritative source)
- generate_schema.sh (generator runner)
- tools/schema-generator/ (Python scripts)
- Generated artifacts in root: generated_models.rs, generated_schema.sql, generated_seeds.sql, generated_types.ts

**Cleanup Tasks**:

#### Task 1.3.1: Verify Generator Output Location
- [ ] Check if generated files should be in root or tools/schema-generator/output/
- [ ] Verify .gitignore excludes generated artifacts
- [ ] Confirm pipeline uses schema.json → generate_all.py → app/backend/migrations/
- [ ] **Evidence**: .gitignore excerpt and generator script paths
- [ ] **Validation**: `git status` shows no tracked generated files

#### Task 1.3.2: Clean Up Generator Artifacts
- [ ] Remove generated_*.{sql,ts,rs} from root (if build artifacts)
- [ ] Add to .gitignore if missing
- [ ] Update generate_schema.sh documentation
- [ ] **Evidence**: .gitignore diff
- [ ] **Validation**: Clean working tree

**Completion Criteria**:
- ✅ schema.json is only schema file in root
- ✅ Generated artifacts not tracked by git
- ✅ Generator process documented in README.md

---

## SECTION 2: APP/ DIRECTORY CLEANUP

### 2.1 app/frontend/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Next.js 15 app
- OpenNext for Cloudflare Workers deployment
- ~1002 lines modified in recent pitfall fixes

**Cleanup Tasks**:

#### Task 2.1.1: Remove Unused Components
- [ ] Search for imported but unused components
- [ ] Search for components not referenced in any route
- [ ] Move to deprecated/app/frontend/unused/ if uncertain
- [ ] **Evidence**: List of removed/moved components
- [ ] **Validation**: `npm run build` succeeds, no unused warnings

#### Task 2.1.2: Consolidate Duplicate Utilities
- [ ] Audit lib/ directory for duplicate functions
- [ ] Check for multiple API client implementations
- [ ] Consolidate error handling utilities
- [ ] **Evidence**: Diff of consolidated files
- [ ] **Validation**: `npm run lint` passes, `npm run typecheck` passes

#### Task 2.1.3: Remove TODO Comments
- [ ] List all TODO comments in production code (grep "TODO")
- [ ] Either implement or document as future work in SOLUTION_SELECTION.md
- [ ] Remove stale TODOs
- [ ] **Evidence**: TODO count before/after
- [ ] **Validation**: Max 5 TODOs allowed, all documented

**Current Known TODOs** (from grep):
1. app/frontend/src/app/(app)/focus/FocusClient.tsx - Track storage implementation
2. app/frontend/src/components/references/ReferenceLibrary.tsx - Backend mapping

#### Task 2.1.4: TypeScript Strictness
- [ ] Check tsconfig.json for strict mode
- [ ] Run `npm run typecheck` and document issues
- [ ] Fix or suppress type errors with justification
- [ ] **Evidence**: Typecheck output
- [ ] **Validation**: 0 type errors (warnings acceptable)

**Completion Criteria**:
- ✅ No unused components
- ✅ ≤5 TODO comments, all documented
- ✅ TypeScript strict mode enabled
- ✅ All builds pass

---

### 2.2 app/backend/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Rust (Axum + Tower + SQLx)
- Fly.io deployment
- Pre-existing compilation errors in oauth.rs, market.rs

**Cleanup Tasks**:

#### Task 2.2.1: Fix Pre-Existing Compilation Errors
- [ ] Run `cargo check --bin ignition-api 2>&1 | tee backend_errors.log`
- [ ] Document all errors in this file
- [ ] Fix errors in order: oauth.rs, market.rs, admin.rs
- [ ] **Evidence**: Error logs before/after
- [ ] **Validation**: `cargo check` returns 0 errors

**Known Errors** (from previous scans):
1. oauth.rs - Missing `is_admin` method on User model
2. oauth.rs - AppError construction issues
3. market.rs - Multiple errors (to be documented)
4. admin.rs - Admin check logic issues

#### Task 2.2.2: Remove Unnecessary .unwrap() Calls
- [ ] Audit all .unwrap() calls outside of tests
- [ ] Replace with .expect() with descriptive messages
- [ ] Replace with proper error handling where possible
- [ ] **Evidence**: unwrap count before/after
- [ ] **Validation**: Only test code and startup code use unwrap()

**Current Known .unwrap()** (27 total, 26 in tests, 1 fixed):
- ✅ auth.rs:422 - Fixed to .expect()
- Remaining 26 in test files (acceptable)

#### Task 2.2.3: Remove TODO Comments
- [ ] Grep for "TODO" in src/ excluding tests
- [ ] Document or implement each
- [ ] **Evidence**: TODO list with resolution
- [ ] **Validation**: 0 TODOs in production code

#### Task 2.2.4: Database Query Optimization
- [ ] Identify N+1 query patterns
- [ ] Check for missing indexes in schema.json
- [ ] Verify all queries use proper parameterization
- [ ] **Evidence**: Query analysis output
- [ ] **Validation**: No SQL injection vectors, efficient queries

**Completion Criteria**:
- ✅ 0 compilation errors
- ✅ 0 TODOs in production code
- ✅ All .unwrap() justified or replaced
- ✅ All queries optimized

---

### 2.3 app/admin/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Next.js admin dashboard
- Cloudflare Workers deployment
- Auth stub with TODO comments

**Cleanup Tasks**:

#### Task 2.3.1: Remove Auth Stub TODOs
- [ ] Document Phase 08 auth integration plan in SOLUTION_SELECTION.md
- [ ] Remove inline TODOs, reference solution document
- [ ] **Evidence**: TODO removal diff
- [ ] **Validation**: Auth stub clearly marked as temporary

**Known TODOs**:
1. admin/src/lib/auth/index.ts - "TODO: Replace with real auth once backend is deployed"
2. admin/src/lib/auth/index.ts - "TODO: Integrate with backend auth at api.ecent.online"

#### Task 2.3.2: Component Cleanup
- [ ] Remove unused components
- [ ] Consolidate API clients
- [ ] **Evidence**: Component removal list
- [ ] **Validation**: Build succeeds, no warnings

**Completion Criteria**:
- ✅ Auth TODO documented in solution doc
- ✅ 0 unused components
- ✅ Build passes

---

### 2.4 app/database/

**Status**: ⏹️ NOT STARTED

**Current State**:
- PostgreSQL migrations (generated from schema.json)
- Located at app/backend/migrations/ (not app/database/)

**Cleanup Tasks**:

#### Task 2.4.1: Verify Database Directory Purpose
- [ ] Check what's actually in app/database/
- [ ] Confirm migrations are in app/backend/migrations/
- [ ] Move any stray SQL files to correct location
- [ ] **Evidence**: Directory listing
- [ ] **Validation**: Database structure documented

#### Task 2.4.2: Clean Up Old Migration Files
- [ ] Check for migration files not in current schema
- [ ] Move to deprecated/ if no longer used
- [ ] **Evidence**: Migration file audit
- [ ] **Validation**: Only current migrations in app/backend/migrations/

**Completion Criteria**:
- ✅ app/database/ purpose documented or removed
- ✅ All migrations in correct location
- ✅ No duplicate migration files

---

### 2.5 app/r2/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Cloudflare R2 storage utilities

**Cleanup Tasks**:

#### Task 2.5.1: Audit R2 Directory
- [ ] Document purpose and contents
- [ ] Check if this should be in app/backend/src/storage/
- [ ] Consolidate with backend storage code if duplicate
- [ ] **Evidence**: Directory listing and purpose
- [ ] **Validation**: Storage code consolidated

**Completion Criteria**:
- ✅ R2 directory purpose clear
- ✅ No duplicate storage code

---

## SECTION 3: .github/ CLEANUP

### 3.1 .github/workflows/

**Status**: ⏹️ NOT STARTED

**Current State**:
- 6 workflow files
- deploy-production.yml recently updated

**Cleanup Tasks**:

#### Task 3.1.1: Audit All Workflows
- [ ] List all workflows with purpose
- [ ] Check for disabled or unused workflows
- [ ] Verify all secrets are documented
- [ ] **Evidence**: Workflow inventory
- [ ] **Validation**: All workflows documented in docs/DEPLOYMENT_SETUP.md

**Known Workflows**:
1. deploy-production.yml - Main production deployment ✅
2. deploy-api-proxy.yml - API proxy deployment
3. e2e-tests.yml - End-to-end tests
4. neon-migrations.yml - Database migrations
5. schema-validation.yml - Schema validation
6. (deprecated workflows in deprecated/.github/)

#### Task 3.1.2: Remove Redundant Workflows
- [ ] Check deprecated/.github/workflows/ for old deployment workflows
- [ ] Confirm they're truly unused
- [ ] Delete if confirmed obsolete
- [ ] **Evidence**: Deleted workflow list
- [ ] **Validation**: Only active workflows in .github/workflows/

**Completion Criteria**:
- ✅ All workflows documented
- ✅ No redundant workflows
- ✅ All secrets documented

---

### 3.2 .github/instructions/

**Status**: ⏹️ NOT STARTED

**Current State**:
- 4 instruction files
- This file (CODE_REVIEW_AND_CLEANUP.instructions.md)

**Cleanup Tasks**:

#### Task 3.2.1: Audit Instruction Files
- [ ] Verify no duplicate guidance between files
- [ ] Check for outdated instructions
- [ ] Consolidate if necessary
- [ ] **Evidence**: Instruction file audit
- [ ] **Validation**: No contradictory instructions

**Current Files**:
1. DEBUGGING.instructions.md - Debugging process ✅
2. GIT_WORKFLOW.instructions.md - Git workflow
3. MANDATORY_CONTEXT.instructions.md - Context requirements
4. c1.instructions.md - Purpose unknown
5. CODE_REVIEW_AND_CLEANUP.instructions.md - This file ✅

**Completion Criteria**:
- ✅ All instruction files reviewed
- ✅ No contradictions
- ✅ All files have clear purpose

---

## SECTION 4: debug/ DIRECTORY CLEANUP

### 4.1 Active Debug Files

**Status**: ⏹️ NOT STARTED

**Current State**:
- DEBUGGING.md - Active issues tracker ✅
- SOLUTION_SELECTION.md - Decision options ✅
- Multiple session summary files
- archive/ subdirectory

**Cleanup Tasks**:

#### Task 4.1.1: Consolidate Session Summaries
- [ ] List all session summary files in debug/
- [ ] Move to archive/ if older than 7 days
- [ ] Keep only: DEBUGGING.md, SOLUTION_SELECTION.md, README.md in root
- [ ] **Evidence**: Moved file list
- [ ] **Validation**: debug/ has ≤5 files outside archive/

**Current Files** (from listing):
- DEBUGGING.md ✅
- DEBUGGING_P0_PRODUCTION_ERRORS.md
- E2E_TEST_FAILURES.md
- FINAL_PITFALL_FIXES.md
- FOLDER_STRUCTURE.md
- GITHUB_ACTIONS_VALIDATION.md
- Multiple PHASE_*.md files
- Multiple SESSION_*.md files
- Multiple PITFALL_*.md files

#### Task 4.1.2: Archive Completed Work
- [ ] Move all *_COMPLETE.md to archive/
- [ ] Move all *_STATUS.md to archive/
- [ ] Move all dated summaries to archive/
- [ ] **Evidence**: Archive operation log
- [ ] **Validation**: debug/ only has active tracking files

**Completion Criteria**:
- ✅ debug/ has ≤5 active files
- ✅ All completed work in archive/
- ✅ README.md explains structure

---

### 4.2 debug/archive/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Historical debugging documents
- Completed phase reports

**Cleanup Tasks**:

#### Task 4.2.1: Organize Archive by Date
- [ ] Create subdirectories: 2026-01/, 2025-12/, etc.
- [ ] Move files to date-based folders
- [ ] Create INDEX.md in archive/ with file listing
- [ ] **Evidence**: New directory structure
- [ ] **Validation**: All files dated and organized

**Completion Criteria**:
- ✅ Archive organized by date
- ✅ INDEX.md created
- ✅ Easy to find historical documents

---

## SECTION 5: deprecated/ DIRECTORY CLEANUP

### 5.1 Deprecated Code

**Status**: ⏹️ NOT STARTED

**Current State**:
- deprecated/agent/
- deprecated/app/
- deprecated/deploy/
- deprecated/.github/

**Cleanup Tasks**:

#### Task 5.1.1: Audit Deprecated Directory
- [ ] List all subdirectories with size
- [ ] Check if any files are mistakenly in deprecated
- [ ] Verify all files are truly obsolete
- [ ] **Evidence**: Directory listing with sizes
- [ ] **Validation**: No active code in deprecated/

#### Task 5.1.2: Create Deprecation Index
- [ ] Create deprecated/README.md explaining each subdirectory
- [ ] Document why each was deprecated
- [ ] Document date deprecated
- [ ] **Evidence**: README.md content
- [ ] **Validation**: Clear deprecation rationale

#### Task 5.1.3: Compress Old Deprecated Code
- [ ] Consider tarring deprecated code older than 3 months
- [ ] Store as deprecated/archive-YYYY-MM.tar.gz
- [ ] Document contents in deprecated/ARCHIVE_INDEX.md
- [ ] **Evidence**: Archive created
- [ ] **Validation**: Deprecated directory size reduced

**Completion Criteria**:
- ✅ Deprecated directory fully documented
- ✅ No active code accidentally deprecated
- ✅ Old code archived/compressed if appropriate

---

## SECTION 6: docs/ DIRECTORY CLEANUP

### 6.1 Documentation Structure

**Status**: ⏹️ NOT STARTED

**Current State**:
- docs/README.md
- docs/DATABASE_MANAGEMENT.md
- docs/DEPLOYMENT_SETUP.md
- docs/TESTING_GUIDE.md
- docs/CLEANUP_STRATEGY.md
- Subdirectories: archive/, behavioral/, meta/, ops/, product/, technical/

**Cleanup Tasks**:

#### Task 6.1.1: Audit Documentation Structure
- [ ] List all docs with word count
- [ ] Check for duplicate content
- [ ] Verify subdirectory purpose
- [ ] **Evidence**: Documentation inventory
- [ ] **Validation**: No redundant docs

#### Task 6.1.2: Consolidate Documentation
- [ ] Merge CLEANUP_STRATEGY.md content into this file or archive
- [ ] Merge PROJECT_REORGANIZATION_PROPOSAL.md into appropriate doc
- [ ] Update README.md to index all documentation
- [ ] **Evidence**: Consolidation diff
- [ ] **Validation**: docs/README.md is comprehensive index

#### Task 6.1.3: Organize Subdirectories
- [ ] Verify behavioral/, ops/, product/, technical/ have clear purpose
- [ ] Move misplaced files to correct subdirectory
- [ ] Create README.md in each subdirectory
- [ ] **Evidence**: Subdirectory structure
- [ ] **Validation**: Each subdirectory documented

**Completion Criteria**:
- ✅ All docs indexed in docs/README.md
- ✅ No duplicate documentation
- ✅ Clear subdirectory organization

---

## SECTION 7: tests/ DIRECTORY CLEANUP

### 7.1 E2E Test Files

**Status**: ⏹️ NOT STARTED

**Current State**:
- Playwright E2E tests in tests/
- Multiple api-*.spec.ts files
- cross-device-sync.spec.ts

**Cleanup Tasks**:

#### Task 7.1.1: Audit Test Coverage
- [ ] List all test files with test count
- [ ] Identify redundant tests
- [ ] Check for disabled/skipped tests
- [ ] **Evidence**: Test coverage report
- [ ] **Validation**: All tests documented

#### Task 7.1.2: Remove Redundant Tests
- [ ] Consolidate duplicate API tests
- [ ] Remove skipped tests (mark as TODO in backlog)
- [ ] **Evidence**: Test diff
- [ ] **Validation**: All tests run and pass

#### Task 7.1.3: Organize Test Files
- [ ] Group tests: api/, integration/, e2e/
- [ ] Update playwright.api.config.ts for new structure
- [ ] **Evidence**: New directory structure
- [ ] **Validation**: All tests still discoverable

**Completion Criteria**:
- ✅ Tests organized by type
- ✅ No redundant tests
- ✅ All tests pass or documented as TODO

---

## SECTION 8: tools/ DIRECTORY CLEANUP

### 8.1 Schema Generator

**Status**: ⏹️ NOT STARTED

**Current State**:
- tools/schema-generator/ with Python scripts
- generate_all.py is main entry point

**Cleanup Tasks**:

#### Task 8.1.1: Audit Tool Directory
- [ ] List all tools with purpose
- [ ] Check for unused scripts
- [ ] Verify all tools documented
- [ ] **Evidence**: Tool inventory
- [ ] **Validation**: All tools in README

#### Task 8.1.2: Document Schema Generator
- [ ] Create tools/schema-generator/README.md
- [ ] Document usage, inputs, outputs
- [ ] Document testing procedure
- [ ] **Evidence**: README created
- [ ] **Validation**: Can run generator from docs alone

**Completion Criteria**:
- ✅ All tools documented
- ✅ No unused scripts
- ✅ Clear usage instructions

---

## SECTION 9: deploy/ DIRECTORY CLEANUP

### 9.1 Deployment Configuration

**Status**: ⏹️ NOT STARTED

**Current State**:
- deploy/cloudflare-admin/
- deploy/cloudflare-api-proxy/
- deploy/production/
- deploy/scripts/

**Cleanup Tasks**:

#### Task 9.1.1: Audit Deployment Directory
- [ ] List all deployment configs
- [ ] Check for obsolete deployment code
- [ ] Verify all configs match .github/workflows/
- [ ] **Evidence**: Deployment inventory
- [ ] **Validation**: All configs documented

#### Task 9.1.2: Consolidate Deployment Docs
- [ ] Merge deploy/README.md into docs/DEPLOYMENT_SETUP.md
- [ ] Document each deployment target
- [ ] **Evidence**: Consolidated doc
- [ ] **Validation**: Single source of deployment truth

**Completion Criteria**:
- ✅ All deployment configs documented
- ✅ No obsolete deployment code
- ✅ Matches workflow files

---

## SECTION 10: OTHER DIRECTORIES

### 10.1 agent/, prompts/, qc/, infra/, scripts/

**Status**: ⏹️ NOT STARTED

**Current State**:
- Various support directories

**Cleanup Tasks**:

#### Task 10.1.1: Audit Other Directories
- [ ] agent/ - Purpose? Still active?
- [ ] prompts/ - Document purpose
- [ ] qc/ - Quality control? Still used?
- [ ] infra/ - Infrastructure configs? Consolidate with deploy/?
- [ ] scripts/ - Shell scripts (some moved from root)
- [ ] **Evidence**: Directory purpose documentation
- [ ] **Validation**: Each directory has README.md

#### Task 10.1.2: Consolidate or Remove
- [ ] Merge infra/ into deploy/ if redundant
- [ ] Archive qc/ if obsolete
- [ ] Document agent/ purpose or deprecate
- [ ] **Evidence**: Consolidation operations
- [ ] **Validation**: No duplicate directories

**Completion Criteria**:
- ✅ All directories documented
- ✅ No redundant directories
- ✅ Clear organizational structure

---

## GLOBAL CLEANUP TASKS

### G.1 .gitignore Audit

**Status**: ⏹️ NOT STARTED

**Cleanup Tasks**:

- [ ] Verify all build artifacts in .gitignore
- [ ] Add generated_*.{sql,rs,ts} if missing
- [ ] Check for tracked files that should be ignored
- [ ] **Evidence**: .gitignore diff
- [ ] **Validation**: `git status` shows only source files

**Completion Criteria**:
- ✅ No build artifacts tracked
- ✅ .gitignore comprehensive

---

### G.2 node_modules Cleanup

**Status**: ⏹️ NOT STARTED

**Cleanup Tasks**:

- [ ] Run `npm audit` in root, frontend, admin
- [ ] Update vulnerable dependencies
- [ ] Remove unused dependencies
- [ ] **Evidence**: Audit reports
- [ ] **Validation**: 0 high/critical vulnerabilities

**Completion Criteria**:
- ✅ All dependencies up to date
- ✅ No security vulnerabilities

---

### G.3 File Permissions

**Status**: ⏹️ NOT STARTED

**Cleanup Tasks**:

- [ ] Check all .sh files are executable
- [ ] Remove execute bit from non-executable files
- [ ] **Evidence**: Permission audit
- [ ] **Validation**: `find . -name "*.sh" ! -perm -u+x`

**Completion Criteria**:
- ✅ All scripts executable
- ✅ No spurious execute permissions

---

## COMPLETION TRACKING

### Section Status Overview

| Section | Status | Started | Completed | Tasks Done | Tasks Total |
|---------|--------|---------|-----------|------------|-------------|
| 1. Root Level | ⏹️ | - | - | 0 | 12 |
| 2. app/ | ⏹️ | - | - | 0 | 23 |
| 3. .github/ | ⏹️ | - | - | 0 | 4 |
| 4. debug/ | ⏹️ | - | - | 0 | 4 |
| 5. deprecated/ | ⏹️ | - | - | 0 | 3 |
| 6. docs/ | ⏹️ | - | - | 0 | 3 |
| 7. tests/ | ⏹️ | - | - | 0 | 3 |
| 8. tools/ | ⏹️ | - | - | 0 | 2 |
| 9. deploy/ | ⏹️ | - | - | 0 | 2 |
| 10. Other | ⏹️ | - | - | 0 | 2 |
| Global | ⏹️ | - | - | 0 | 3 |
| **TOTAL** | ⏹️ | - | - | **0** | **61** |

### Overall Progress

```
[░░░░░░░░░░░░░░░░░░░░] 0% Complete (0/61 tasks)
```

### Next Task to Execute

**Priority 1**: Section 1.1.1 - Audit All Root Markdown Files
- Purpose: Create comprehensive inventory
- Estimated time: 30 minutes
- Blocker: None
- Ready: ✅ YES

---

## USAGE INSTRUCTIONS FOR AGENT

### When Starting Cleanup Work:

1. **Read this file first** to understand current progress
2. **Pick the next incomplete task** (marked with [ ])
3. **Update status to 🔄 IN PROGRESS** with timestamp
4. **Document all changes** in the task's evidence section
5. **Run validations** specified for that task
6. **Mark task complete** with ✅ and timestamp
7. **Update completion tracking table** at bottom
8. **Commit this file** with progress update

### When Completing a Section:

1. **Verify all tasks** in section are ✅
2. **Run section-level validation** (lint, compile, tests)
3. **Update section status** to ✅ COMPLETE
4. **Update completion tracking table**
5. **Commit with message**: "Complete Section X: [Section Name]"

### Required Update Pattern:

```markdown
#### Task X.X.X: Task Name
- [x] Subtask description
- **Evidence**: [Exact evidence here]
- **Validation**: [Validation result]
- **Completed**: 2026-01-13 10:30 UTC
- **Status**: ✅ COMPLETE
```

---

## VALIDATION CHECKLIST (Run After Each Section)

### Code Validation:
- [ ] `npm run lint` (frontend, admin)
- [ ] `npm run typecheck` (frontend, admin)
- [ ] `cargo check --bin ignition-api` (backend)
- [ ] `npm run test` (E2E tests)

### Repository Health:
- [ ] `git status` shows clean working tree (no untracked build artifacts)
- [ ] All moved files use `git mv` (preserves history)
- [ ] No broken imports/references
- [ ] README.md updated if structure changed

### Documentation:
- [ ] All new/moved files documented
- [ ] No broken internal links
- [ ] This file updated with progress

---

## EMERGENCY ROLLBACK

If cleanup breaks something:

1. **Stop immediately**
2. **Document what broke** in this file
3. **Run**: `git diff HEAD` to see all changes
4. **Revert problematic changes**: `git checkout -- [files]`
5. **Update this file** with "⚠️ BLOCKED" status and reason
6. **Commit revert** with explanation

---

**Last Updated**: 2026-01-13 10:00 UTC  
**Last Completed Task**: None  
**Next Task**: Section 1.1.1 - Root Markdown Audit  
**Blocked Tasks**: None  
**Total Progress**: 0/61 tasks (0%)
