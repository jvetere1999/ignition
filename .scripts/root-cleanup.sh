#!/bin/bash
# Root Directory Organization Script
# Moves documentation and scripts from root to appropriate subdirectories

set -e  # Exit on error

cd /Users/Shared/passion-os-next

echo "Starting root directory cleanup..."
echo ""

# Create destination directories
mkdir -p management/archive
mkdir -p .scripts/automation
mkdir -p docs/guides

# Move documentation files to management/
echo "Moving documentation to management/..."
[ -f "COMPLETION_VERIFICATION.md" ] && git mv COMPLETION_VERIFICATION.md management/ && echo "✓ COMPLETION_VERIFICATION.md"
[ -f "FINAL_COMPLETION_SUMMARY.md" ] && git mv FINAL_COMPLETION_SUMMARY.md management/ && echo "✓ FINAL_COMPLETION_SUMMARY.md"
[ -f "PROJECT_COMPLETION_REPORT_JAN20_2026.md" ] && git mv PROJECT_COMPLETION_REPORT_JAN20_2026.md management/ && echo "✓ PROJECT_COMPLETION_REPORT_JAN20_2026.md"
[ -f "PROJECT_FINAL_STATUS_JAN20_2026.md" ] && git mv PROJECT_FINAL_STATUS_JAN20_2026.md management/ && echo "✓ PROJECT_FINAL_STATUS_JAN20_2026.md"
[ -f "PHASE_4B_COMPLETION_HANDOFF.md" ] && git mv PHASE_4B_COMPLETION_HANDOFF.md management/ && echo "✓ PHASE_4B_COMPLETION_HANDOFF.md"
[ -f "NEXT_SESSION_KICKOFF.md" ] && git mv NEXT_SESSION_KICKOFF.md management/ && echo "✓ NEXT_SESSION_KICKOFF.md"
[ -f "CLEANUP_NEEDED.md" ] && git mv CLEANUP_NEEDED.md management/ && echo "✓ CLEANUP_NEEDED.md"
[ -f "ORGANIZATION_STATUS.md" ] && git mv ORGANIZATION_STATUS.md management/ && echo "✓ ORGANIZATION_STATUS.md"

echo ""
echo "Moving session archives to management/archive/..."
[ -f "COMPREHENSIVE_SESSION_SUMMARY.md" ] && git mv COMPREHENSIVE_SESSION_SUMMARY.md management/archive/ && echo "✓ COMPREHENSIVE_SESSION_SUMMARY.md"
[ -f "FINAL_SESSION_SUMMARY_JAN20_2026.md" ] && git mv FINAL_SESSION_SUMMARY_JAN20_2026.md management/archive/ && echo "✓ FINAL_SESSION_SUMMARY_JAN20_2026.md"
[ -f "SESSION_SUMMARY_JAN19_2026_PART2.md" ] && git mv SESSION_SUMMARY_JAN19_2026_PART2.md management/archive/ && echo "✓ SESSION_SUMMARY_JAN19_2026_PART2.md"
[ -f "PHASE_2_MIGRATION_COMPLETE.md" ] && git mv PHASE_2_MIGRATION_COMPLETE.md management/archive/ && echo "✓ PHASE_2_MIGRATION_COMPLETE.md"
[ -f "PHASE_3_CONSOLIDATION_COMPLETE.md" ] && git mv PHASE_3_CONSOLIDATION_COMPLETE.md management/archive/ && echo "✓ PHASE_3_CONSOLIDATION_COMPLETE.md"

echo ""
echo "Moving guides to docs/guides/..."
[ -f "QUICK_REFERENCE.md" ] && git mv QUICK_REFERENCE.md docs/guides/ && echo "✓ QUICK_REFERENCE.md"

echo ""
echo "Moving automation scripts to .scripts/automation/..."
[ -f ".phase4-completion.sh" ] && git mv .phase4-completion.sh .scripts/automation/ && echo "✓ .phase4-completion.sh"
[ -f ".phase4-script.sh" ] && git mv .phase4-script.sh .scripts/automation/ && echo "✓ .phase4-script.sh"
[ -f ".phase5-cleanup.sh" ] && git mv .phase5-cleanup.sh .scripts/automation/ && echo "✓ .phase5-cleanup.sh"
[ -f ".phase5-direct-moves.sh" ] && git mv .phase5-direct-moves.sh .scripts/automation/ && echo "✓ .phase5-direct-moves.sh"
[ -f ".phase7-verify.sh" ] && git mv .phase7-verify.sh .scripts/automation/ && echo "✓ .phase7-verify.sh"
[ -f ".final-cleanup.sh" ] && git mv .final-cleanup.sh .scripts/automation/ && echo "✓ .final-cleanup.sh"

echo ""
echo "Cleaning up temporary files..."
[ -f ".verify-status.txt" ] && rm .verify-status.txt && echo "✓ .verify-status.txt"
[ -f ".commit-msg.txt" ] && rm .commit-msg.txt && echo "✓ .commit-msg.txt"

echo ""
echo "✅ Root cleanup complete!"
echo ""
echo "Files successfully organized:"
echo "  - 8 documentation files → management/"
echo "  - 5 session archives → management/archive/"
echo "  - 1 guide → docs/guides/"
echo "  - 6 automation scripts → .scripts/automation/"
echo ""
echo "Root directory is now clean!"
