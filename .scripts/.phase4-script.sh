#!/bin/bash
cd /Users/Shared/passion-os-next

# Phase 4: Project Management Reorganization
echo "Phase 4: Project Management Reorganization"

# Create directories
mkdir -p management/status-reports
mkdir -p management/prompt-packages

# Move status report files
mv agent/PHASE_1_1_IMPLEMENTATION_COMPLETE.md management/status-reports/ 2>/dev/null
mv agent/PHASE_1_COMPLETE.md management/status-reports/ 2>/dev/null
mv agent/PHASE_1_QUICK_REFERENCE.md management/status-reports/ 2>/dev/null
mv agent/PHASE_1_STATUS.md management/status-reports/ 2>/dev/null
mv agent/WEBAUTHN_VALIDATION_REPORT.md management/status-reports/ 2>/dev/null
mv agent/WEBAUTHN_VALIDATION_STATUS.md management/status-reports/ 2>/dev/null
mv agent/IMPLEMENTATION_COMPLETE.md management/status-reports/ 2>/dev/null
mv agent/E2EE_VALIDATION_COMPLETE.md management/status-reports/ 2>/dev/null
mv agent/REFERENCE_TRACKS_E2EE_UPDATE.md management/status-reports/ 2>/dev/null
mv agent/REFERENCE_TRACKS_STATUS.md management/status-reports/ 2>/dev/null
mv agent/ACTUAL_STATUS.md management/status-reports/ 2>/dev/null
mv agent/WORKER_SECURITY_SCAN.md management/status-reports/ 2>/dev/null
mv agent/AUDIT_DOCUMENTATION_VS_IMPLEMENTATION.md management/status-reports/ 2>/dev/null
mv agent/AUTH_ONBOARDING_CONVERSION_STATUS.md management/status-reports/ 2>/dev/null

# Move project reference files to management root
mv agent/CURRENT_STATE.md management/current-state.md 2>/dev/null || cp agent/CURRENT_STATE.md management/current-state.md
mv agent/IMPLEMENTATION_MASTER_PLAN.md management/implementation-plan.md 2>/dev/null || cp agent/IMPLEMENTATION_MASTER_PLAN.md management/implementation-plan.md

# Move prompt packages
mv agent/prompt_packages management/ 2>/dev/null || cp -r agent/prompt_packages management/

# Move archive
mv agent/archive management/archive 2>/dev/null || cp -r agent/archive management/

# Remove empty agent directory
rmdir agent 2>/dev/null || true

echo "✓ Phase 4: Project Management Reorganization Complete"
