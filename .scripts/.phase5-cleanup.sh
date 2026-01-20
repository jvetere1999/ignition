#!/bin/bash
# Phase 5-6: Root Level Cleanup

cd /Users/Shared/passion-os-next

echo "=== Phase 5-6: Root Level Cleanup ==="
echo ""

# Move phase guides to docs/guides/
echo "Moving phase guides to docs/guides/..."
mkdir -p docs/guides/archive 2>/dev/null
[ -f "PHASE_1_KICKOFF_GUIDE.md" ] && git mv PHASE_1_KICKOFF_GUIDE.md docs/guides/phase-1-kickoff.md 2>/dev/null && echo "✓ Moved PHASE_1_KICKOFF_GUIDE.md"
[ -f "PHASE_1_TASK_CARDS.md" ] && git mv PHASE_1_TASK_CARDS.md docs/guides/phase-1-task-cards.md 2>/dev/null && echo "✓ Moved PHASE_1_TASK_CARDS.md"

# Move schema to database config
echo ""
echo "Moving schema to app/database/config/..."
mkdir -p app/database/config 2>/dev/null
[ -f "schema.json" ] && git mv schema.json app/database/config/schema.json 2>/dev/null && echo "✓ Moved schema.json"

# Move docker-compose files to infrastructure/
echo ""
echo "Moving docker-compose to infrastructure/config/..."
mkdir -p infrastructure/config 2>/dev/null
[ -f "docker-compose.yml" ] && git mv docker-compose.yml infrastructure/config/ 2>/dev/null && echo "✓ Moved docker-compose.yml"
for file in docker-compose.*.yml; do
  [ -f "$file" ] && git mv "$file" infrastructure/config/ 2>/dev/null && echo "✓ Moved $file"
done

# Move WebAuthn docs
echo ""
echo "Moving WebAuthn documentation..."
[ -f "WEBAUTHN_IMPLEMENTATION_COMPLETE.md" ] && git mv WEBAUTHN_IMPLEMENTATION_COMPLETE.md management/status-reports/webauthn-implementation-complete.md 2>/dev/null && echo "✓ Moved WEBAUTHN_IMPLEMENTATION_COMPLETE.md"
[ -f "WEBAUTHN_IMPLEMENTATION_PLAN.md" ] && git mv WEBAUTHN_IMPLEMENTATION_PLAN.md docs/guides/webauthn-implementation-plan.md 2>/dev/null && echo "✓ Moved WEBAUTHN_IMPLEMENTATION_PLAN.md"

# Move E2EE docs
echo ""
echo "Moving E2EE documentation..."
[ -f "E2EE_VALIDATION_COMPLETE.md" ] && git mv E2EE_VALIDATION_COMPLETE.md management/status-reports/e2ee-validation-complete.md 2>/dev/null && echo "✓ Moved E2EE_VALIDATION_COMPLETE.md"

# Move reference implementation docs
echo ""
echo "Moving reference implementation documentation..."
[ -f "REFERENCE_TRACKS_E2EE_UPDATE.md" ] && git mv REFERENCE_TRACKS_E2EE_UPDATE.md management/status-reports/reference-tracks-e2ee-update.md 2>/dev/null && echo "✓ Moved REFERENCE_TRACKS_E2EE_UPDATE.md"
[ -f "REFERENCE_TRACKS_STATUS.md" ] && git mv REFERENCE_TRACKS_STATUS.md management/status-reports/reference-tracks-status.md 2>/dev/null && echo "✓ Moved REFERENCE_TRACKS_STATUS.md"

# Move versioning/changelog docs to docs/
echo ""
echo "Moving versioning documentation..."
[ -f "CHANGELOG.md" ] && git mv CHANGELOG.md docs/CHANGELOG.md 2>/dev/null && echo "✓ Moved CHANGELOG.md"
[ -f "VERSIONING_SYSTEM_READY.md" ] && git mv VERSIONING_SYSTEM_READY.md docs/guides/versioning-system-ready.md 2>/dev/null && echo "✓ Moved VERSIONING_SYSTEM_READY.md"

# Move phase completion reports to management/
echo ""
echo "Moving phase completion reports..."
[ -f "PHASE_1_COMPLETE.md" ] && git mv PHASE_1_COMPLETE.md management/status-reports/ 2>/dev/null && echo "✓ Moved PHASE_1_COMPLETE.md"
[ -f "PHASE_2_EXECUTION_REPORT.md" ] && git mv PHASE_2_EXECUTION_REPORT.md management/status-reports/phase-2-execution-report.md 2>/dev/null && echo "✓ Moved PHASE_2_EXECUTION_REPORT.md"
[ -f "PHASE_2_SUMMARY.md" ] && git mv PHASE_2_SUMMARY.md management/status-reports/phase-2-summary.md 2>/dev/null && echo "✓ Moved PHASE_2_SUMMARY.md"
[ -f "PHASE_3_CONSOLIDATION_COMPLETE.md" ] && git mv PHASE_3_CONSOLIDATION_COMPLETE.md management/status-reports/phase-3-consolidation-complete.md 2>/dev/null && echo "✓ Moved PHASE_3_CONSOLIDATION_COMPLETE.md"

# Move action/directory plan docs to management/
echo ""
echo "Moving action plan documentation..."
[ -f "ACTION_PLAN_DIRECTORY_REORGANIZATION.md" ] && git mv ACTION_PLAN_DIRECTORY_REORGANIZATION.md management/action-plan-directory-reorganization.md 2>/dev/null && echo "✓ Moved ACTION_PLAN_DIRECTORY_REORGANIZATION.md"
[ -f "DIRECTORY_STRUCTURE_PLAN.md" ] && git mv DIRECTORY_STRUCTURE_PLAN.md management/directory-structure-plan.md 2>/dev/null && echo "✓ Moved DIRECTORY_STRUCTURE_PLAN.md"
[ -f "DIRECTORY_STRUCTURE_VISUAL.md" ] && git mv DIRECTORY_STRUCTURE_VISUAL.md management/directory-structure-visual.md 2>/dev/null && echo "✓ Moved DIRECTORY_STRUCTURE_VISUAL.md"
[ -f "DIRECTORY_QUICK_REFERENCE.md" ] && git mv DIRECTORY_QUICK_REFERENCE.md management/directory-quick-reference.md 2>/dev/null && echo "✓ Moved DIRECTORY_QUICK_REFERENCE.md"

# Move session summaries to management/
echo ""
echo "Moving session documentation..."
[ -f "SESSION_SUMMARY_JAN19_2026.md" ] && git mv SESSION_SUMMARY_JAN19_2026.md management/status-reports/session-summary-jan19-2026.md 2>/dev/null && echo "✓ Moved SESSION_SUMMARY_JAN19_2026.md"
[ -f "SESSION_SUMMARY_JAN19_2026_PART2.md" ] && git mv SESSION_SUMMARY_JAN19_2026_PART2.md management/status-reports/session-summary-jan19-2026-part2.md 2>/dev/null && echo "✓ Moved SESSION_SUMMARY_JAN19_2026_PART2.md"

# Move kickoff guide to management/
echo ""
echo "Moving project kickoff guides..."
[ -f "NEXT_SESSION_KICKOFF.md" ] && git mv NEXT_SESSION_KICKOFF.md management/next-session-kickoff.md 2>/dev/null && echo "✓ Moved NEXT_SESSION_KICKOFF.md"

# Move comprehensive summaries to management/
echo ""
echo "Moving comprehensive documentation..."
[ -f "COMPREHENSIVE_SESSION_SUMMARY.md" ] && git mv COMPREHENSIVE_SESSION_SUMMARY.md management/status-reports/comprehensive-session-summary.md 2>/dev/null && echo "✓ Moved COMPREHENSIVE_SESSION_SUMMARY.md"
[ -f "QUICK_REFERENCE.md" ] && git mv QUICK_REFERENCE.md management/quick-reference.md 2>/dev/null && echo "✓ Moved QUICK_REFERENCE.md"

# Move validation reports
echo ""
echo "Moving validation documentation..."
[ -f "COMPREHENSIVE_CODEBASE_VALIDATION_JAN20_2026.md" ] && git mv COMPREHENSIVE_CODEBASE_VALIDATION_JAN20_2026.md management/status-reports/ 2>/dev/null && echo "✓ Moved COMPREHENSIVE_CODEBASE_VALIDATION_JAN20_2026.md"
[ -f "VALIDATION_AUTH_FLOW_JAN20_2026.md" ] && git mv VALIDATION_AUTH_FLOW_JAN20_2026.md management/status-reports/ 2>/dev/null && echo "✓ Moved VALIDATION_AUTH_FLOW_JAN20_2026.md"

echo ""
echo "=== Phase 5-6 Cleanup Complete ==="
echo ""
echo "Root directory is now cleaner with organization files moved to:"
echo "  - docs/ (guides and API documentation)"
echo "  - management/ (project organization and status reports)"
echo "  - infrastructure/ (deployment and utility configs)"
echo "  - app/database/config/ (database schema)"
