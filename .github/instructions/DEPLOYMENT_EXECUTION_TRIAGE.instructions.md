# DEPLOYMENT EXECUTION & TRIAGE INSTRUCTIONS
**Version:** 1.0  
**Effective Date:** January 19, 2026  
**Status:** Active — Permanent Reference  
**Authority:** All launch decisions + task tracking reference from this file

---

## 🎯 Purpose

This instruction file provides a **single, permanent reference point** for:
1. **Issue/PR Triage** — Route work to correct phase + owner
2. **Decision Authority** — Reference the canonical plan documents
3. **Task Tracking** — Map GitHub issues to phases + acceptance criteria
4. **Status Reporting** — Use phase progress to inform stakeholders
5. **Risk Management** — Apply documented mitigations

All work MUST reference the master documents listed below.

---

## 📋 Master Authority Documents

These are the **source of truth** for all deployment decisions, timelines, and task breakdowns:

| Document | Purpose | Location | Authority For |
|----------|---------|----------|----------------|
| **MAXIMUM_CONFIDENCE_ACTION_PLAN.md** | Detailed task breakdown (14 tasks across 7 phases) | `/root` | Task effort, acceptance criteria, deployment steps, validation |
| **MASTER_FEATURE_SPEC.md** | Complete feature inventory + E2EE spec + telemetry design | `/root` | Feature scope, APIs, data models, E2EE guarantees, admin dashboard design |
| **LAUNCH_MASTER_INDEX.md** | Navigation hub + status snapshot + go/no-go gates | `/root` | Phase overview, decision summary, success metrics, current status |
| **MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md** | Leadership overview (10 decisions + timeline + risks) | `/root` | Timeline authority, decision rationale, risk assessment, go/no-go gates |
| **DELIVERABLES_SUMMARY.md** | Summary of planning deliverables + how to use docs | `/root` | Document usage guide, quality assurance notes, next steps |

**All GitHub issues MUST reference one of these documents.**

---

## 🔄 7-Phase Deployment Structure

All work is organized into 7 sequential phases. Every GitHub issue/PR must be tagged with its phase.

### Phase Timeline & Owners

| Phase | Duration | Start | End | Owner | Key Deliverables |
|-------|----------|-------|-----|-------|------------------|
| **Phase 1: E2EE Infrastructure** | 5–7 days | Jan 19 | Jan 26 | Backend Lead | Vault lock + CryptoPolicy + encrypted search |
| **Phase 2: Privacy & Features** | 5–7 days | Jan 22 | Jan 29 | Frontend + Backend | Privacy modes + DAW Watcher QA + admin telemetry |
| **Phase 3: Legal & Compliance** | 5–7 days | Jan 26 | Feb 2 | Legal + Product | Legal review + E2EE claims alignment |
| **Phase 4: Staging & Beta Prep** | 3–5 days | Jan 30 | Feb 4 | DevOps + QA | Staging live + E2E tests passing + beta users recruited |
| **Phase 5: Closed Beta** | 14 days | Feb 5 | Feb 18 | Support + Product | Real users testing + feedback synthesis |
| **Phase 6: Production Launch** | 7 days | Feb 16 | Feb 23 | DevOps + Exec | Deploy production + announce + launch support |
| **Phase 7: Post-Launch** | Ongoing | Feb 23+ | - | Product + Support | Monitor + refine + roadmap v1.0.1 |

**GitHub Labels:** `phase-1`, `phase-2`, `phase-3`, etc.  
**Milestones:** Create one per phase + one for each go/no-go gate

---

## 🎲 The 10 Resolved Decisions

All deployment decisions are final. Reference these when evaluating scope/feature requests:

| # | Decision | Choice | Impact | Reference Doc |
|---|----------|--------|--------|----------------|
| 1 | E2EE Go-to-Market | 1A: Beta infrastructure | E2EE recovery codes + trust boundaries at launch | EXEC_SUMMARY, Section: "Decision 1" |
| 2 | Deployment Confidence | 2B: Staging first | +3–5 days, deploy to staging before production | ACTION_PLAN, Task 4.1 |
| 3 | DAW Watcher Path | 3A: Standalone beta | Separate download, not bundled | ACTION_PLAN, Task 2.2 |
| 4 | Privacy Modes | 4A: Full UI implementation | Private vs Standard work toggle in Ideas/Infobase/Journal | ACTION_PLAN, Task 2.1 |
| 5 | Vault Lock Policy | 5A: Auto-lock on inactivity | Auto-lock after 10m idle + on app backgrounding | ACTION_PLAN, Task 1.1 + MASTER_SPEC, Section 9.6 |
| 6 | Observability | 6A: Full stack | Prometheus + Sentry + Loki + Jaeger | ACTION_PLAN, Task 3.2 |
| 7 | Crypto Versioning | 7A: CryptoPolicy versioning | AES-256-GCM v1.0 with upgrade path | ACTION_PLAN, Task 1.2 + MASTER_SPEC, Section 9.5 |
| 8 | Offline Support | 8A: Full (read+write) | Service worker + IndexedDB mutation queue | ACTION_PLAN + MASTER_SPEC, Section 7.2.7 |
| 9 | Legal & Compliance | 9A: Full legal review | Engage external counsel for E2EE claims alignment | ACTION_PLAN, Task 3.1 |
| 10 | Beta vs Public | 10B: Closed beta | 100 users for 2 weeks before public launch | ACTION_PLAN, Tasks 4.3 + 5.1 |

**Decision Rule:** If a feature request conflicts with one of these decisions, **defer to post-launch roadmap** (v1.0.1 or later).

---

## 📌 GitHub Issue Triage Framework

### Rule 1: Assign to Phase

Every new issue MUST be assigned to exactly ONE phase (1–7):

```
Phase 1: Vault lock? CryptoPolicy? Encrypted search?        → phase-1
Phase 2: Privacy modes? DAW Watcher? Admin telemetry?       → phase-2
Phase 3: Legal docs? E2EE claims? Support scripts?          → phase-3
Phase 4: Staging? E2E tests? Beta recruitment?              → phase-4
Phase 5: Beta monitoring? Bug fixes? Feedback synthesis?    → phase-5
Phase 6: Production deploy? Launch comms? Go-live support?  → phase-6
Phase 7: Post-launch? Monitoring? v1.0.1 planning?          → phase-7
```

**Action:** Add label `phase-X` to every issue.

### Rule 2: Link to Master Document

Every issue MUST reference the specific task it relates to:

```
Title: Implement vault auto-lock enforcement

Description:
Relates to: MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Task 1.1 (Vault Lock Policy)
Acceptance Criteria: See ACTION_PLAN.md lines 150–200
Reference Doc: MASTER_FEATURE_SPEC.md, Section 9.6

---
[Your detailed issue description]
```

**Action:** Include a comment at the top with this structure.

### Rule 3: Acceptance Criteria from Master Plan

Every issue's acceptance criteria MUST come directly from the action plan:

```
Do NOT accept "it works for me"
DO accept "verification per ACTION_PLAN.md checklist"
```

**Example:**
```
Acceptance Criteria:
- [ ] Backend: `cargo check --bin ignition-api` → 0 errors
- [ ] Frontend: `npm run build` → 0 TypeScript errors
- [ ] E2E: `npx playwright test tests/vault-lock.spec.ts` → 10/10 pass
- [ ] Cross-device: Device A locks → Device B detects within 5 poll cycles

(Reference: ACTION_PLAN.md, Task 1.1, "Acceptance Criteria" section)
```

### Rule 4: Feature Requests → Roadmap

Any feature request that doesn't appear in the 7-phase plan:

1. Check if it maps to a decision (1–10)
2. If yes & decision says "defer" → Add to v1.0.1 roadmap
3. If no & not critical → Add to v1.1+ roadmap
4. If critical for launch → Escalate to phase owner + confirm with decision authority

```
Label: `scope-decision-required` (will escalate to leadership)
Phase: (determined after decision)
```

### Rule 5: Bug Severity vs Phase

| Bug Type | Phase | Action |
|----------|-------|--------|
| Critical (blocks go-live) | Any | Fix immediately, hotfix to current phase |
| Medium (affects UX but not core flow) | 1–4 | Fix during phase; block phase gate if not resolved |
| Low (cosmetic, minor edge case) | 1–5 | Fix or defer to v1.0.1 based on phase owner priority |
| During Beta/Launch | 5–6 | Fix within 24h (on-call team) |
| Post-Launch | 7 | Fix or defer based on user impact |

---

## 🗺️ Task-to-GitHub-Issue Mapping

Each task in the action plan gets a GitHub issue. Use this template:

### Issue Template: Deployment Task

```markdown
## Task: [TASK_NAME]

**Phase:** phase-X  
**Owner:** [Role]  
**Effort:** [Hours] hours  
**Deadline:** [Date from ACTION_PLAN.md]  

**Related Document:**
- ACTION_PLAN.md, Task X.Y (link to section)
- MASTER_SPEC.md, Section [number] (if applicable)

**Deliverables:**
- [ ] Deliverable 1 (reference ACTION_PLAN.md)
- [ ] Deliverable 2
- [ ] Deliverable 3

**Acceptance Criteria:**
- [ ] Criterion 1 (from ACTION_PLAN.md)
- [ ] Criterion 2
- [ ] Criterion 3

**Implementation Checklist:**
- [ ] Step 1 (from ACTION_PLAN.md, "Implementation Steps")
- [ ] Step 2
- [ ] Step 3

**Deployment Checklist:**
- [ ] Check 1 (from ACTION_PLAN.md, "Deployment Checklist")
- [ ] Check 2
- [ ] Check 3

**Post-Implementation Validation:**
```bash
# Command from ACTION_PLAN.md, "Post-Implementation Validation"
```

**Go/No-Go Criteria:**
- [ ] Phase gate criteria met (see ACTION_PLAN.md, "Phase X Gate")
```

---

## 🚦 Go/No-Go Gates (Decision Points)

Three critical decision gates where leadership evaluates phase completion:

### Gate 1: Phase 4 Complete (January 26)
**Triggers:** Phase 1–3 finished  
**Go/No-Go Criteria:**
- [ ] All Phase 1 tasks complete + 0 compilation errors (verify: `cargo check` + `npm run build`)
- [ ] All Phase 2 tasks complete + DAW builds signed
- [ ] Phase 3 tasks complete + legal docs ready for counsel review
- [ ] Staging deployment successful (health checks green)
- [ ] E2E tests: 90%+ passing (GitHub Actions report)
- [ ] 100+ beta users recruited + agreements signed

**GitHub Milestone:** `Gate 1: Staging & Beta Prep Complete`  
**Issues to Close:** All phase-1, phase-2, phase-3 issues MUST be closed  
**Approval:** CTO + Product Manager sign-off on GitHub issue #[gate-decision]

**If NO-GO:**
- Identify blockers in GitHub issue comments
- Create new tasks to resolve blockers
- Re-evaluate gate criteria within 48 hours

### Gate 2: Phase 5 Complete (February 4)
**Triggers:** 2 weeks of beta monitoring complete  
**Go/No-Go Criteria:**
- [ ] No critical regressions during beta
- [ ] 80%+ user sentiment positive (from Discord + feedback form)
- [ ] Feedback synthesized + prioritized (GitHub discussion created)
- [ ] All critical issues hotfixed + re-deployed
- [ ] Legal counsel sign-off received (final email)
- [ ] Infrastructure load tested (1,000+ concurrent users simulated)

**GitHub Milestone:** `Gate 2: Beta Feedback Synthesis Complete`  
**Issues to Close:** All phase-5 issues MUST be closed  
**Approval:** Product Manager + Support Lead sign-off

**If NO-GO:**
- Extend beta for 1 additional week
- Create new hotfix tasks
- Re-evaluate gate criteria

### Gate 3: Phase 6 Go-Live (February 16)
**Triggers:** All production systems tested + comms ready  
**Go/No-Go Criteria:**
- [ ] Production backend deployment successful (Fly.io logs clean)
- [ ] Production frontend deployment successful (GitHub Actions report)
- [ ] All health endpoints responding 200 OK
- [ ] Database migrations complete (zero errors)
- [ ] R2 production bucket configured + access tested
- [ ] Prometheus metrics flowing + dashboards populated
- [ ] Blog post published + social media scheduled
- [ ] Support team trained + on-call + Discord ready
- [ ] Rollback plan tested (dry run completed)

**GitHub Milestone:** `Gate 3: Production Launch Ready`  
**Issues to Close:** All phase-6 deployment issues MUST be closed  
**Approval:** CTO + Executive Sponsor final sign-off

**If NO-GO:**
- Identify blocker (exact error in GitHub issue)
- Create hotfix task + assign to DRI
- Delay launch by 24h (re-test next day)
- Post status update in #announcements

---

## 🏷️ GitHub Labels (Required)

Create these labels in the repository and apply to every issue:

### Phase Labels
```
phase-1: E2EE Infrastructure (blue background)
phase-2: Privacy & Features (blue background)
phase-3: Legal & Compliance (purple background)
phase-4: Staging & Beta Prep (yellow background)
phase-5: Closed Beta (orange background)
phase-6: Production Launch (red background)
phase-7: Post-Launch (gray background)
```

### Status Labels
```
status-blocked: Waiting for something else (red)
status-in-progress: Currently being worked on (yellow)
status-review: Waiting for code review (orange)
status-ready-for-gate: Waiting for go/no-go decision (purple)
```

### Type Labels
```
type-task: Implementation task (blue)
type-bug: Bug fix (red)
type-documentation: Documentation update (cyan)
type-infrastructure: DevOps/deployment (dark blue)
type-test: Test/validation (green)
```

### Decision Labels
```
scope-decision-required: Needs leadership approval (pink)
scope-deferred-v1.0.1: Post-launch v1.0.1 (gray)
scope-deferred-v1.1: Later version (gray)
scope-approved-in-plan: Already in action plan (green)
```

### Action Labels
```
help-wanted: Need additional resources (green)
critical: Blocks go-live (red)
on-call: Active incident (red)
```

---

## 📊 Tracking & Reporting

### Weekly Status Report (Every Monday)

Use this template to report progress to stakeholders:

```markdown
## Weekly Status Report — Week of [DATE]

### Phase Progress
- **Phase 1 (E2EE):** X/3 tasks complete | [Progress bar]
- **Phase 2 (Privacy):** X/3 tasks complete | [Progress bar]
- **Phase 3 (Legal):** X/2 tasks complete | [Progress bar]
- **Phase 4 (Staging):** X/3 tasks complete | [Progress bar]

### Blockers
- [ ] [Blocker 1] — Impact: [Phase X] — Mitigation: [Action] — Owner: [Person]
- [ ] [Blocker 2]

### Metrics
- GitHub Issues Closed This Week: X/Y planned
- E2E Tests Passing: X% (target: 90%)
- Production Health: [Grafana link]

### Go/No-Go Gates
- Gate 1 (Phase 4 Complete): ETA Jan 26 | Status: [On track / At risk]
- Gate 2 (Phase 5 Complete): ETA Feb 4 | Status: [On track / At risk]
- Gate 3 (Launch Ready): ETA Feb 16 | Status: [On track / At risk]

### Next Week Preview
- Focus: [Describe Phase X work]
- Expected Deliverables: [List tasks due]
- High-Risk Items: [What could block us]

**Report Source:** github.com/[repo]/milestones (filter by current phase)
```

---

## 🎯 Decision Authority Escalation

If a GitHub issue requires a decision NOT in the 10 resolved decisions:

1. **Create issue with label:** `scope-decision-required`
2. **@ mention:** CTO + Product Manager + Executive Sponsor
3. **Provide context:**
   - What's being asked?
   - How does it impact timeline?
   - Which decision (1–10) does it relate to?
   - What's the recommendation?
4. **Link to:** Relevant section in MASTER_FEATURE_SPEC.md + ACTION_PLAN.md
5. **Resolution:** Decision made in GitHub comment + recorded in issue

**Example:**
```markdown
### Decision Required: Feature X Scope

**Question:** Should we include Feature X in launch or defer to v1.0.1?

**Impact:** 
- Launch scope: +3 days (delays to Feb 19)
- Post-launch: v1.0.1 (launches Feb 16 as planned)

**Relates to:** Decision #4 (Privacy Modes) — see EXECUTIVE_SUMMARY.md

**Recommendation:** Defer to v1.0.1 to stay on timeline

**Authority Decision:** [CTO response + reasoning] ← Binding decision
```

---

## 🔗 Code Review & Merge Rules

### Rule: Every PR Must Reference Master Plan

```
Title: [phase-X] Implement vault auto-lock enforcement

Description:
Related: ACTION_PLAN.md, Task 1.1, Acceptance Criteria line [number]

Closes #[github-issue]

---
[Your PR description]
```

### Rule: Acceptance Criteria Verification

Before approving PR, verify against ACTION_PLAN.md checklist:

```markdown
## Reviewer Checklist (from ACTION_PLAN.md)

Task: [Task Name]  
Reference: [Document], [Section], lines [X–Y]  

**Acceptance Criteria:**
- [x] Criterion 1 (verified via: [test/manual check])
- [x] Criterion 2
- [ ] Criterion 3 ← MUST PASS BEFORE MERGE

**Sign-off:** [Reviewer name] confirms all criteria met on [date]
```

### Rule: Phase Gate Blocking

If a PR is part of Phase X and Phase gate is pending:

- ✅ **ALLOWED:** Merge if all acceptance criteria met
- ❌ **BLOCKED:** Don't merge if acceptance criteria not met (will block phase gate)

```
Label: status-ready-for-gate ← Applied when PR ready for gate validation
```

---

## 📞 Roles & Responsibilities

Each phase has a DRI (Directly Responsible Individual) who owns all decisions for that phase:

| Phase | DRI | Backup | Responsibilities |
|-------|-----|--------|------------------|
| 1: E2EE | Backend Lead | CTO | All phase-1 tasks, Task acceptance, Escalations |
| 2: Privacy | Frontend Lead | Backend Lead | All phase-2 tasks, Task acceptance, Escalations |
| 3: Legal | Legal / Product | Exec Sponsor | All phase-3 tasks, Legal sign-off, Task acceptance |
| 4: Staging | DevOps Lead | CTO | Staging deployment, E2E coordination, Beta recruitment |
| 5: Beta | Support Lead | Product Manager | Beta monitoring, Feedback synthesis, Bug triage |
| 6: Launch | CTO + Exec | - | Production deploy, Go-live, Communications |
| 7: Post-Launch | Product Manager | Support Lead | Monitoring, Feedback, v1.0.1 roadmap |

**Weekly Syncs:** 0900 UTC Monday + Thursday (all DRIs attend)  
**On-Call:** During Phase 6 (launch week) 24/7 coverage

---

## 🚨 Incident Response

### During Phases 1–5 (Pre-Launch)

**Critical Issue Found:**
1. Create GitHub issue with label: `critical` + `on-call`
2. @ mention phase DRI + CTO
3. Assign to available engineer (within 1h)
4. Fix + test + merge (within 4h if during business hours)
5. Update GitHub issue + close

**No phase gate delay unless issue affects go/no-go criteria.**

### During Phase 6–7 (Launch & Post-Launch)

**Critical Issue Found:**
1. Page on-call engineer immediately (Slack + phone)
2. Create GitHub issue with label: `critical` + `on-call` + `phase-6` or `phase-7`
3. Fix priority: 
   - **P0 (users can't login):** Fix within 30 min
   - **P1 (feature broken):** Fix within 2h
   - **P2 (degraded):** Fix within 4h
4. Post incident summary in #status + @executive-channel
5. Postmortem within 24h (GitHub issue)

---

## 🔄 Permanent Update Process

This file is **permanent and living**. Update it when:

1. **Phase transitions:** Update "Current Phase" section
2. **Decision made:** Add to "10 Resolved Decisions" table if new
3. **New go/no-go gate:** Add to "Go/No-Go Gates" section
4. **Process feedback:** Update Rules section (with discussion in GitHub issue #[xxx])

**Update Criteria:**
- Minor updates (dates, DRI changes): Update directly
- Major updates (new phases, new rules): Create GitHub discussion + stakeholder review first

**Version Bump:**
- v1.0 → v1.1: Minor process refinements
- v1.x → v2.0: Major structural changes (post-launch)

---

## ✅ Checklist: Using This File

**When you create a GitHub issue:**
- [ ] Assign to exactly ONE phase (1–7)
- [ ] Apply phase label (`phase-X`)
- [ ] Link to specific ACTION_PLAN.md task (or gate)
- [ ] Copy acceptance criteria from ACTION_PLAN.md
- [ ] Add DRI as assignee
- [ ] Add type label (task/bug/test/etc)

**When you review a PR:**
- [ ] Verify it references master docs
- [ ] Check acceptance criteria against ACTION_PLAN.md
- [ ] Verify no go/no-go criteria blocked
- [ ] Approve = "Ready for phase gate validation"

**When you report status (weekly):**
- [ ] Use template provided above
- [ ] Reference GitHub milestones for accuracy
- [ ] Link to production health dashboards
- [ ] Assess gate risk (on track / at risk)

**When you need a decision:**
- [ ] Check if it's one of the 10 resolved decisions first
- [ ] If new decision needed, create issue with `scope-decision-required`
- [ ] @ mention authority (CTO / Product / Exec Sponsor)
- [ ] Wait for binding decision in GitHub comment
- [ ] Document decision in this file (version bump)

---

## 🎓 Quick Reference Links

**Read These First:**
1. [LAUNCH_MASTER_INDEX.md](../../LAUNCH_MASTER_INDEX.md) — Status snapshot + overview
2. [MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md](../../MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md) — Leadership summary

**For Engineering:**
1. [MAXIMUM_CONFIDENCE_ACTION_PLAN.md](../../MAXIMUM_CONFIDENCE_ACTION_PLAN.md) — Task breakdown
2. [MASTER_FEATURE_SPEC.md](../../MASTER_FEATURE_SPEC.md) — E2EE spec + admin design

**For Questions:**
- "What's the timeline?" → LAUNCH_MASTER_INDEX.md, Critical Path Timeline
- "What decided X?" → EXECUTIVE_SUMMARY.md, The 10 Decisions table
- "How do I implement task Y?" → ACTION_PLAN.md, Phase Z, Task X
- "Is feature X in scope?" → MASTER_SPEC.md, Section 2 (Feature Inventory)

---

## 📞 Contact

- **Questions about this file?** Create GitHub issue with label `documentation`
- **Want to update this file?** Create GitHub discussion with label `process-feedback`
- **Questions about deployment?** @ mention phase DRI in GitHub issues
- **Escalations?** Comment in GitHub issue + @ mention CTO + Product Manager

---

**This file is the permanent reference for all Passion OS deployment work.**

Last Updated: January 19, 2026  
Effective Date: January 19, 2026  
Next Review: January 26, 2026 (after Phase 1)

