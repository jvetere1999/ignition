#!/bin/bash
# Phase 4 Completion Script - Move agent/ files to management/

cd /Users/Shared/passion-os-next

# Create directories if they don't exist
mkdir -p management/status-reports
mkdir -p management/prompt-packages

# Status report files to move
STATUS_FILES=(
  "ACTUAL_STATUS.md:actual-status.md"
  "AUDIT_DOCUMENTATION_VS_IMPLEMENTATION.md:audit-documentation-vs-implementation.md"
  "AUTH_ONBOARDING_CONVERSION_STATUS.md:auth-onboarding-conversion-status.md"
  "E2EE_VALIDATION_COMPLETE.md:e2ee-validation-complete.md"
  "IMPLEMENTATION_COMPLETE.md:implementation-complete.md"
  "PHASE_1_1_IMPLEMENTATION_COMPLETE.md:phase-1-1-implementation-complete.md"
  "PHASE_1_QUICK_REFERENCE.md:phase-1-quick-reference.md"
  "REFERENCE_TRACKS_E2EE_UPDATE.md:reference-tracks-e2ee-update.md"
  "REFERENCE_TRACKS_STATUS.md:reference-tracks-status.md"
  "WEBAUTHN_VALIDATION_REPORT.md:webauthn-validation-report.md"
  "WEBAUTHN_VALIDATION_STATUS.md:webauthn-validation-status.md"
  "WORKER_SECURITY_SCAN.md:worker-security-scan.md"
)

echo "Moving status reports to management/status-reports/..."
for file_mapping in "${STATUS_FILES[@]}"; do
  IFS=':' read -r src dst <<< "$file_mapping"
  if [ -f "agent/$src" ]; then
    git mv "agent/$src" "management/status-reports/$dst" 2>/dev/null
    echo "✓ Moved agent/$src → management/status-reports/$dst"
  fi
done

# Move core files to management root
echo ""
echo "Moving core management files to management/ root..."
[ -f "agent/CURRENT_STATE.md" ] && git mv agent/CURRENT_STATE.md management/current-state.md && echo "✓ Moved CURRENT_STATE.md"
[ -f "agent/IMPLEMENTATION_MASTER_PLAN.md" ] && git mv agent/IMPLEMENTATION_MASTER_PLAN.md management/implementation-plan.md && echo "✓ Moved IMPLEMENTATION_MASTER_PLAN.md"

# Move subdirectories
echo ""
echo "Moving subdirectories to management/..."
[ -d "agent/archive" ] && git mv agent/archive management/archive 2>/dev/null && echo "✓ Moved archive/ to management/"
[ -d "agent/prompt_packages" ] && git mv agent/prompt_packages management/prompt-packages 2>/dev/null && echo "✓ Moved prompt_packages/ to management/"

# Clean up empty agent directory
echo ""
if [ -d "agent" ] && [ -z "$(ls -A agent)" ]; then
  rmdir agent
  echo "✓ Removed empty agent/ directory"
fi

echo ""
echo "Phase 4 organization complete!"
echo ""
echo "New structure:"
echo "  management/current-state.md"
echo "  management/implementation-plan.md"  
echo "  management/status-reports/ (12 status files)"
echo "  management/prompt-packages/"
echo "  management/archive/"
