#!/bin/bash
# Phase 5-6 COMPLETION - Direct git operations for file moves
# This script completes the root-level cleanup directly using git operations

cd /Users/Shared/passion-os-next

echo "=== PHASE 5-6: ROOT LEVEL CLEANUP ==="
echo ""

# Helper function to safely move file
safe_move() {
  local src=$1
  local dst=$2
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")" 2>/dev/null
    git mv "$src" "$dst" 2>/dev/null && echo "✓ $src → $dst" || echo "⚠ $src (exists in destination)"
  fi
}

echo "Consolidating Management Documentation..."
safe_move WEBAUTHN_IMPLEMENTATION_COMPLETE.md management/status-reports/webauthn-implementation-complete.md
safe_move PHASE_1_COMPLETE.md management/status-reports/phase-1-complete.md
safe_move PHASE_2_EXECUTION_REPORT.md management/status-reports/phase-2-execution-report.md
safe_move PHASE_2_SUMMARY.md management/status-reports/phase-2-summary.md
safe_move PHASE_3_CONSOLIDATION_COMPLETE.md management/status-reports/phase-3-consolidation-complete.md
safe_move SESSION_SUMMARY_JAN19_2026.md management/status-reports/session-summary-jan19-2026.md
safe_move SESSION_SUMMARY_JAN19_2026_PART2.md management/status-reports/session-summary-jan19-2026-part2.md
safe_move COMPREHENSIVE_SESSION_SUMMARY.md management/status-reports/comprehensive-session-summary.md
safe_move COMPREHENSIVE_CODEBASE_VALIDATION_JAN20_2026.md management/status-reports/comprehensive-codebase-validation-jan20-2026.md
safe_move VALIDATION_AUTH_FLOW_JAN20_2026.md management/status-reports/validation-auth-flow-jan20-2026.md

echo ""
echo "Consolidating Guides to docs/guides/..."
safe_move PHASE_1_KICKOFF_GUIDE.md docs/guides/phase-1-kickoff.md
safe_move PHASE_1_TASK_CARDS.md docs/guides/phase-1-task-cards.md
safe_move WEBAUTHN_IMPLEMENTATION_PLAN.md docs/guides/webauthn-implementation-plan.md
safe_move VERSIONING_SYSTEM_READY.md docs/guides/versioning-system-ready.md

echo ""
echo "Consolidating Infrastructure & Config..."
safe_move CHANGELOG.md docs/CHANGELOG.md
safe_move schema.json app/database/config/schema.json

echo ""
echo "Moving Project Organization Docs to management/..."
safe_move ACTION_PLAN_DIRECTORY_REORGANIZATION.md management/action-plan-directory-reorganization.md
safe_move DIRECTORY_STRUCTURE_PLAN.md management/directory-structure-plan.md
safe_move DIRECTORY_STRUCTURE_VISUAL.md management/directory-structure-visual.md
safe_move DIRECTORY_QUICK_REFERENCE.md management/directory-quick-reference.md
safe_move NEXT_SESSION_KICKOFF.md management/next-session-kickoff.md
safe_move QUICK_REFERENCE.md management/quick-reference.md

echo ""
echo "=== Phase 5-6 Complete ==="
echo ""
echo "Files organized to:"
echo "  - management/status-reports/ (10+ status documents)"
echo "  - management/ (project tracking and organization)"
echo "  - docs/guides/ (implementation guides and versioning)"
echo "  - docs/ (changelog)"
echo "  - app/database/config/ (schema)"
