---
name: master-spec-continue
description: Audit MASTER_FEATURE_SPEC.md for implemented vs unimplemented items, update the Complete Feature Inventory and Implementation Status Matrix, maintain the unimplemented checklist, validate consistency with repo code/schema, then proceed to implement the next unimplemented feature. Use for “master spec continue,” “audit master feature spec,” or “move shipped features into inventory” requests.
---

# Master Spec Continue

## Overview

Audit and normalize the master spec to reflect current implementation, then move on to the next unimplemented feature.

## Workflow

### 1) Parse the spec
- Open `MASTER_FEATURE_SPEC.md`.
- Focus on: Complete Feature Inventory, Implementation Status Matrix, Known Gaps, Proposed Enhancements, Forward-Looking Items, Explicit Decisions, and Implementation Updates.

### 2) Determine implementation state
- Treat “implemented” as: routes/components exist, data models present, tests or UI wired.
- Verify with repo search (`rg`) for routes, UI pages, and models.
- If a DB field or table change is required, update `schema.json` and run `python3 tools/schema-generator/generate_all.py` before documenting.

### 3) Update the spec (always)
- Move shipped features into Complete Feature Inventory.
- Keep the inventory summary table current (counts + notes).
- Update the Implementation Status Matrix rows to match inventory.
- Remove shipped items from Proposed Enhancements/Forward-Looking sections.
- Add/maintain the “Unimplemented Features Checklist” under Known Gaps.
- Record any new work under Implementation Updates with a short, factual entry.

### 4) Validate consistency
- Ensure endpoints listed in the spec exist (`/api/*`), and storage aligns with schema/models.
- Fix numbering, statuses, and section cross-references if they drift.

### 5) Continue implementation
- Pick the next unimplemented item (highest priority, lowest dependency).
- Implement in code.
- Update the spec again to reflect the change and check it off the checklist.

## Guardrails
- Do not invent features; only mark implemented if evidence exists in code.
- Keep edits ASCII and minimal.
- If implementation requires product decisions, note the assumption in the spec.
