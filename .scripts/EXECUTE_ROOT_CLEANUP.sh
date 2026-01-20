#!/bin/bash
#
# EXECUTE THIS TO COMPLETELY CLEAN THE ROOT DIRECTORY
# Run: bash EXECUTE_ROOT_CLEANUP.sh
#

cd "$(dirname "$0")" || exit 1

echo "🧹 ROOT DIRECTORY CLEANUP - EXECUTION STARTED"
echo "=============================================="
echo ""

# Create target directories
mkdir -p .scripts
mkdir -p management/archive
mkdir -p maintenance/archive

# Move automation scripts
echo "1️⃣  Moving automation scripts to .scripts/"
git mv .final-cleanup.sh .scripts/ 2>/dev/null && echo "  ✓ .final-cleanup.sh"
git mv .phase4-completion.sh .scripts/ 2>/dev/null && echo "  ✓ .phase4-completion.sh"
git mv .phase4-script.sh .scripts/ 2>/dev/null && echo "  ✓ .phase4-script.sh"
git mv .phase5-cleanup.sh .scripts/ 2>/dev/null && echo "  ✓ .phase5-cleanup.sh"
git mv .phase5-direct-moves.sh .scripts/ 2>/dev/null && echo "  ✓ .phase5-direct-moves.sh"
git mv .phase7-verify.sh .scripts/ 2>/dev/null && echo "  ✓ .phase7-verify.sh"
git mv root-cleanup.sh .scripts/ 2>/dev/null && echo "  ✓ root-cleanup.sh"

# Move documentation
echo ""
echo "2️⃣  Moving documentation to management/archive/"
git mv CLEANUP_NEEDED.md management/archive/ 2>/dev/null && echo "  ✓ CLEANUP_NEEDED.md"
git mv COMPLETION_VERIFICATION.md management/archive/ 2>/dev/null && echo "  ✓ COMPLETION_VERIFICATION.md"
git mv COMPREHENSIVE_SESSION_SUMMARY.md management/archive/ 2>/dev/null && echo "  ✓ COMPREHENSIVE_SESSION_SUMMARY.md"
git mv FINAL_COMPLETION_SUMMARY.md management/archive/ 2>/dev/null && echo "  ✓ FINAL_COMPLETION_SUMMARY.md"
git mv FINAL_SESSION_SUMMARY_JAN20_2026.md management/archive/ 2>/dev/null && echo "  ✓ FINAL_SESSION_SUMMARY_JAN20_2026.md"
git mv INDEX.md management/archive/ 2>/dev/null && echo "  ✓ INDEX.md"
git mv NEXT_SESSION_KICKOFF.md management/archive/ 2>/dev/null && echo "  ✓ NEXT_SESSION_KICKOFF.md"
git mv ORGANIZATION_STATUS.md management/archive/ 2>/dev/null && echo "  ✓ ORGANIZATION_STATUS.md"
git mv PHASE_2_MIGRATION_COMPLETE.md management/archive/ 2>/dev/null && echo "  ✓ PHASE_2_MIGRATION_COMPLETE.md"
git mv PHASE_3_CONSOLIDATION_COMPLETE.md management/archive/ 2>/dev/null && echo "  ✓ PHASE_3_CONSOLIDATION_COMPLETE.md"
git mv PHASE_4B_COMPLETION_HANDOFF.md management/archive/ 2>/dev/null && echo "  ✓ PHASE_4B_COMPLETION_HANDOFF.md"
git mv PROJECT_COMPLETION_REPORT_JAN20_2026.md management/archive/ 2>/dev/null && echo "  ✓ PROJECT_COMPLETION_REPORT_JAN20_2026.md"
git mv PROJECT_FINAL_STATUS_JAN20_2026.md management/archive/ 2>/dev/null && echo "  ✓ PROJECT_FINAL_STATUS_JAN20_2026.md"
git mv QUICK_REFERENCE.md management/archive/ 2>/dev/null && echo "  ✓ QUICK_REFERENCE.md"
git mv ROOT_ORGANIZATION_STATUS.md management/archive/ 2>/dev/null && echo "  ✓ ROOT_ORGANIZATION_STATUS.md"
git mv SESSION_SUMMARY_JAN19_2026_PART2.md management/archive/ 2>/dev/null && echo "  ✓ SESSION_SUMMARY_JAN19_2026_PART2.md"
git mv START_HERE.md management/archive/ 2>/dev/null && echo "  ✓ START_HERE.md"
git mv STRUCTURE.md management/archive/ 2>/dev/null && echo "  ✓ STRUCTURE.md"

# Move utility files
echo ""
echo "3️⃣  Moving utility files to maintenance/archive/"
git mv .commit-msg.txt maintenance/archive/ 2>/dev/null && echo "  ✓ .commit-msg.txt"
git mv .verify-status.txt maintenance/archive/ 2>/dev/null && echo "  ✓ .verify-status.txt"
git mv tree.json maintenance/archive/ 2>/dev/null && echo "  ✓ tree.json"

# Move Python icon scripts
echo ""
echo "4️⃣  Moving Python utility scripts to maintenance/"
git mv create_icons.py maintenance/archive/ 2>/dev/null && echo "  ✓ create_icons.py"
git mv create_icons_valid.py maintenance/archive/ 2>/dev/null && echo "  ✓ create_icons_valid.py"

# Move config examples
echo ""
echo "5️⃣  Moving config files to infrastructure/"
git mv .dev.vars infrastructure/examples/ 2>/dev/null && echo "  ✓ .dev.vars"
git mv .dev.vars.example infrastructure/examples/ 2>/dev/null && echo "  ✓ .dev.vars.example"
git mv .env.local.example infrastructure/examples/ 2>/dev/null && echo "  ✓ .env.local.example"

# Move test config
echo ""
echo "6️⃣  Moving playwright config"
git mv playwright.api.config.ts tests/ 2>/dev/null && echo "  ✓ playwright.api.config.ts"

# Move misc files
echo ""
echo "7️⃣  Moving misc files"
git mv reset.sql infrastructure/database/ 2>/dev/null && echo "  ✓ reset.sql"

# Move old temp location
echo ""
echo "8️⃣  Reorganizing .tmp/ to maintenance/"
if [ -d ".tmp" ]; then
  git mv .tmp maintenance/.tmp 2>/dev/null && echo "  ✓ .tmp/ moved to maintenance/"
fi

# Move old prompts directory
echo ""
echo "9️⃣  Moving prompts/ to archive"
mkdir -p maintenance/archive/prompts
git mv prompts/* maintenance/archive/prompts/ 2>/dev/null && echo "  ✓ prompts/ archived"

# Show final state
echo ""
echo "=============================================="
echo "✅ ROOT CLEANUP COMPLETE"
echo "=============================================="
echo ""
echo "ROOT DIRECTORY NOW CONTAINS:"
echo ""
ls -la | grep -v "^d" | grep -v "^total" | awk '{print "  " $NF}' | grep -v "^  \." | sort
echo ""
echo "CORE DIRECTORIES:"
echo ""
ls -1d */ | awk '{print "  📁 " $0}'
echo ""
echo "Next steps:"
echo "  1. Run: git status"
echo "  2. Review changes"
echo "  3. Run: git commit -m 'chore: complete root directory organization'"
echo "  4. Run: git push origin production"
echo ""
