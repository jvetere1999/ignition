---
name: debug-error-triage
description: "Structured triage for debugging sessions with multiple errors—collect, normalize, sort by impact, and deliver a prioritized fix plan. Use when the user feeds many build/test/runtime failures and needs a systematic clearing strategy."
---

# Debug Error Triage

## Intake
1. **Collect every error, log, or failing test** the user provides. If the request contains no concrete error data, ask for at least one complete error block or log snippet before proceeding.
2. **Normalize the entries**: give each failure a short identifier (e.g., `frontend-build`, `api-schema`), describe the observed symptom, reproduction steps, and explicit location (file, command, test name, log context).

## Sorting
1. **Assess impact** (blocking > urgent > cosmetic), scope (frontend/backend/infra/etc.), and likeliest root subsystem. Record the confidence level for each assessment.
2. **Order the errors** by severity and dependency; higher priority should block the pipeline or prevent reliable verification.
3. **Flag duplicates** or collateral noise (the same root cause bubbling up multiple times) and collapse them under one canonical issue.

## Systematic Resolution
1. For each error (from most critical down):
   - Summarize: single sentence restating the failure.
   - Root cause hypothesis: point to the likely code, config, or environment trigger.
   - Immediate action: list commands, edits, or checks to prove/disprove the hypothesis.
   - Fix plan: step-by-step remedy, including patches, rollbacks, or config tweaks; mention any required order if other errors depend on this.
2. When multiple errors share a subsystem, note commonalities (shared dependency, config drift, build cache) and suggest a single entry that addresses all.
3. If blocking items are unresolved, do **not** proceed to lower-priority fixes; instead, call them out as blocked and explain what must succeed first.

## Output Checklist
- Start with a short status line that states whether the pipeline can proceed.
- Provide a table or bullet list of the sorted errors with identifiers, status, and blocking status.
- For each error include the fix plan described above.
- End with a “Next diagnostics” section summarizing follow-up checks or regressions to monitor after fixes.

Always keep answers actionable, cite the relevant files/lines when you can, and avoid speculation beyond what error data supports.
