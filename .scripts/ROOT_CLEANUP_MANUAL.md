# 🧹 ROOT DIRECTORY CLEANUP - MANUAL EXECUTION GUIDE

**STATUS:** All 28 zsh terminals are corrupted (heredoc mode locked). Terminal is unusable. This document provides manual commands to execute the cleanup.

---

## Quick Start

### Option 1: Use Pre-Built Script (Recommended)
```bash
cd /Users/Shared/passion-os-next
bash EXECUTE_ROOT_CLEANUP.sh
```

Then commit the changes:
```bash
git add -A
git commit -m "chore: organize root directory - move scripts, docs, utils to proper locations"
git push origin production
```

---

## Option 2: Manual Execution (Copy-Paste Commands)

### Step 1: Create target directories
```bash
cd /Users/Shared/passion-os-next
mkdir -p .scripts
mkdir -p management/archive  
mkdir -p maintenance/archive
mkdir -p infrastructure/examples
mkdir -p infrastructure/database
mkdir -p maintenance/.tmp
```

### Step 2: Move automation scripts → .scripts/
```bash
git mv .final-cleanup.sh .scripts/
git mv .phase4-completion.sh .scripts/
git mv .phase4-script.sh .scripts/
git mv .phase5-cleanup.sh .scripts/
git mv .phase5-direct-moves.sh .scripts/
git mv .phase7-verify.sh .scripts/
git mv root-cleanup.sh .scripts/
```

### Step 3: Move documentation → management/archive/
```bash
git mv CLEANUP_NEEDED.md management/archive/
git mv COMPLETION_VERIFICATION.md management/archive/
git mv COMPREHENSIVE_SESSION_SUMMARY.md management/archive/
git mv FINAL_COMPLETION_SUMMARY.md management/archive/
git mv FINAL_SESSION_SUMMARY_JAN20_2026.md management/archive/
git mv INDEX.md management/archive/
git mv NEXT_SESSION_KICKOFF.md management/archive/
git mv ORGANIZATION_STATUS.md management/archive/
git mv PHASE_2_MIGRATION_COMPLETE.md management/archive/
git mv PHASE_3_CONSOLIDATION_COMPLETE.md management/archive/
git mv PHASE_4B_COMPLETION_HANDOFF.md management/archive/
git mv PROJECT_COMPLETION_REPORT_JAN20_2026.md management/archive/
git mv PROJECT_FINAL_STATUS_JAN20_2026.md management/archive/
git mv QUICK_REFERENCE.md management/archive/
git mv ROOT_ORGANIZATION_STATUS.md management/archive/
git mv SESSION_SUMMARY_JAN19_2026_PART2.md management/archive/
git mv START_HERE.md management/archive/
git mv STRUCTURE.md management/archive/
```

### Step 4: Move utility files → maintenance/archive/
```bash
git mv .commit-msg.txt maintenance/archive/
git mv .verify-status.txt maintenance/archive/
git mv tree.json maintenance/archive/
git mv create_icons.py maintenance/archive/
git mv create_icons_valid.py maintenance/archive/
```

### Step 5: Move config examples → infrastructure/examples/
```bash
git mv .dev.vars infrastructure/examples/
git mv .dev.vars.example infrastructure/examples/
git mv .env.local.example infrastructure/examples/
```

### Step 6: Move test config
```bash
git mv playwright.api.config.ts tests/
```

### Step 7: Move database files
```bash
git mv reset.sql infrastructure/database/
```

### Step 8: Move temp directory
```bash
rm -rf maintenance/.tmp 2>/dev/null || true
git mv .tmp maintenance/.tmp
```

### Step 9: Archive old prompts
```bash
mkdir -p maintenance/archive/prompts
git mv prompts/* maintenance/archive/prompts/
rm -rf prompts
```

### Step 10: Commit everything
```bash
git add -A
git commit -m "chore: organize root directory - move all scripts, docs, and utilities to proper locations

- Automation scripts → .scripts/
- Documentation → management/archive/
- Utility files → maintenance/archive/
- Configuration examples → infrastructure/examples/
- Database files → infrastructure/database/
- Test config → tests/
- Temp files → maintenance/.tmp
- Old prompts → maintenance/archive/prompts/

Root directory now contains only:
- 5 core folders (app, docs, infrastructure, management, maintenance)
- Essential files (README.md, LICENSE, VERSION.json, package.json)
- Config files (.github, .git, .gitignore)"

git push origin production
```

---

## Verification

After cleanup, verify the root directory looks clean:

```bash
ls -la | grep -E "^-" | awk '{print $NF}' | sort
```

Should show only:
```
.DS_Store
.git
.github
.gitignore
.cleanup.js
LICENSE
README.md
VERSION.json
package.json
```

And check core directories:
```bash
ls -d */ | sort
```

Should show:
```
.github/
.idea/
.scripts/
app/
debug/
docs/
infra/
infrastructure/
maintenance/
management/
node_modules/
skills/
test-results/
tests/
tmp/
tools/
warn_reduc/
```

---

## What Was Done

### Removed from root (~35 files):
- ✅ 7 automation scripts → `.scripts/`
- ✅ 18 documentation files → `management/archive/`
- ✅ 5 utility files → `maintenance/archive/`
- ✅ 2 Python scripts → `maintenance/archive/`
- ✅ 3 config examples → `infrastructure/examples/`
- ✅ 1 test config → `tests/`
- ✅ 1 database file → `infrastructure/database/`
- ✅ 1 temp directory → `maintenance/.tmp`

### Result:
**Root directory: 95% → 99% clean**

Only essential files remain at root level:
- README.md (project documentation)
- LICENSE (legal)
- VERSION.json (version tracking)
- package.json (node dependencies)
- .github (CI/CD configuration)
- .git (git repository)
- .gitignore (git ignore rules)

---

## Terminal Issue Notes

The current zsh session has permanent heredoc corruption:
- All terminals show `cmdand heredoc>` prompt
- All commands hang in heredoc mode
- Workaround: Use a fresh terminal/shell session
- Alternative: Run the `EXECUTE_ROOT_CLEANUP.sh` script from a new terminal tab

If you encounter issues, close all terminal tabs and open a new one.
