#!/bin/bash
# Final Root Cleanup - Move remaining files to appropriate locations

cd /Users/Shared/passion-os-next

echo "=== FINAL ROOT CLEANUP ==="
echo ""

# Create directories if needed
mkdir -p .scripts/automation
mkdir -p management/archive
mkdir -p docs/guides

echo "Moving temporary scripts..."
git mv .phase4-completion.sh .scripts/automation/phase4-completion.sh 2>/dev/null && echo "  ✓ .phase4-completion.sh" || true
git mv .phase4-script.sh .scripts/automation/phase4-script.sh 2>/dev/null && echo "  ✓ .phase4-script.sh" || true
git mv .phase5-cleanup.sh .scripts/automation/phase5-cleanup.sh 2>/dev/null && echo "  ✓ .phase5-cleanup.sh" || true
git mv .phase5-direct-moves.sh .scripts/automation/phase5-direct-moves.sh 2>/dev/null && echo "  ✓ .phase5-direct-moves.sh" || true
git mv .phase7-verify.sh .scripts/automation/phase7-verify.sh 2>/dev/null && echo "  ✓ .phase7-verify.sh" || true

echo ""
echo "Moving session documentation..."
git mv COMPREHENSIVE_SESSION_SUMMARY.md management/archive/comprehensive-session-summary.md 2>/dev/null && echo "  ✓ COMPREHENSIVE_SESSION_SUMMARY.md" || true
git mv FINAL_SESSION_SUMMARY_JAN20_2026.md management/archive/final-session-summary-jan20-2026.md 2>/dev/null && echo "  ✓ FINAL_SESSION_SUMMARY_JAN20_2026.md" || true
git mv SESSION_SUMMARY_JAN19_2026_PART2.md management/archive/session-summary-jan19-2026-part2.md 2>/dev/null && echo "  ✓ SESSION_SUMMARY_JAN19_2026_PART2.md" || true
git mv PHASE_2_MIGRATION_COMPLETE.md management/archive/phase-2-migration-complete.md 2>/dev/null && echo "  ✓ PHASE_2_MIGRATION_COMPLETE.md" || true
git mv PHASE_3_CONSOLIDATION_COMPLETE.md management/archive/phase-3-consolidation-complete.md 2>/dev/null && echo "  ✓ PHASE_3_CONSOLIDATION_COMPLETE.md" || true

echo ""
echo "Moving completion reports..."
git mv COMPLETION_VERIFICATION.md management/completion-verification.md 2>/dev/null && echo "  ✓ COMPLETION_VERIFICATION.md" || true
git mv FINAL_COMPLETION_SUMMARY.md management/final-completion-summary.md 2>/dev/null && echo "  ✓ FINAL_COMPLETION_SUMMARY.md" || true
git mv PROJECT_COMPLETION_REPORT_JAN20_2026.md management/project-completion-report.md 2>/dev/null && echo "  ✓ PROJECT_COMPLETION_REPORT_JAN20_2026.md" || true
git mv PROJECT_FINAL_STATUS_JAN20_2026.md management/project-final-status.md 2>/dev/null && echo "  ✓ PROJECT_FINAL_STATUS_JAN20_2026.md" || true
git mv PHASE_4B_COMPLETION_HANDOFF.md management/phase-4b-handoff.md 2>/dev/null && echo "  ✓ PHASE_4B_COMPLETION_HANDOFF.md" || true

echo ""
echo "Moving reference guides..."
git mv NEXT_SESSION_KICKOFF.md management/next-session-kickoff.md 2>/dev/null && echo "  ✓ NEXT_SESSION_KICKOFF.md" || true
git mv QUICK_REFERENCE.md docs/guides/quick-reference.md 2>/dev/null && echo "  ✓ QUICK_REFERENCE.md" || true

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Root now contains only:"
echo "  - Core project files (README.md, LICENSE, package.json, VERSION.json)"
echo "  - App directories (app/, infrastructure/, management/, maintenance/, docs/)"
echo "  - Config files (.github/, .git/, .env, etc.)"
echo "  - Node/Python support (node_modules/, tests/, debug/, etc.)"
echo ""
echo "All documentation organized to:"
echo "  - management/: Project org and status reports"
echo "  - management/archive/: Historical session docs"
echo "  - .scripts/automation/: Phase automation scripts"
echo "  - docs/guides/: Reference guides"
