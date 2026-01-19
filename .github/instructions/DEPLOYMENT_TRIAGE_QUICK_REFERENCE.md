# DEPLOYMENT TRIAGE QUICK REFERENCE
**File:** Use this when triaging GitHub issues during deployment  
**Permanent Location:** `.github/instructions/DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md`  
**Updated:** January 19, 2026

---

## 🎯 Before You Open a GitHub Issue

**STOP. Ask Yourself:**

1. **What phase is this?**
   ```
   Vault? CryptoPolicy? Encrypted search?            → phase-1
   Privacy modes? DAW Watcher? Admin dashboard?       → phase-2
   Legal review? E2EE docs? Support scripts?          → phase-3
   Staging deploy? E2E tests? Beta recruitment?       → phase-4
   Beta monitoring? Bug fixes? Feedback?              → phase-5
   Production deploy? Launch comms? Go-live support?  → phase-6
   Post-launch? Monitoring? v1.0.1 planning?          → phase-7
   ```

2. **Is it in the 10 decisions?**
   ```
   Read: MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md
   If feature is NOT in decisions 1–10 → Likely post-launch
   ```

3. **Is it in the action plan?**
   ```
   Read: MAXIMUM_CONFIDENCE_ACTION_PLAN.md
   If NOT in 14 tasks → Escalate with `scope-decision-required`
   ```

4. **Does it block the phase gate?**
   ```
   If YES → Critical priority
   If NO → Standard priority
   ```

---

## 🏷️ GitHub Issue Template (Copy & Paste)

```markdown
## Task: [BRIEF_TITLE]

**Phase:** phase-X  
**Relates to:** MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Task X.Y  
**Reference:** [Link to specific section of ACTION_PLAN.md]  

### Acceptance Criteria
(Copy from ACTION_PLAN.md, Task X.Y, "Acceptance Criteria" section)
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Implementation Steps
(From ACTION_PLAN.md, Task X.Y, "Implementation Steps")
1. Step 1
2. Step 2
3. Step 3

### Deployment Checklist
(From ACTION_PLAN.md, Task X.Y, "Deployment Checklist")
- [ ] Check 1
- [ ] Check 2
- [ ] Check 3

### Post-Implementation Validation
(From ACTION_PLAN.md, Task X.Y, "Post-Implementation Validation")
```bash
# Run this command to verify
```

---

## 🚦 Triage Decision Tree

```
Is the issue about deployment/launch?
├─ NO → Use normal bug/feature triage (no phase label needed)
└─ YES
   ├─ Does it map to a phase (1–7)?
   │  ├─ YES → Apply phase-X label, assign to phase DRI
   │  └─ NO → Apply `scope-decision-required`, escalate to CTO
   │
   ├─ Is it critical for go/no-go gate?
   │  ├─ YES → Priority: CRITICAL, add `critical` label
   │  └─ NO → Priority: Standard
   │
   └─ Is it a bug vs. feature vs. task?
      ├─ Implementation task → type-task
      ├─ Bug fix → type-bug
      ├─ Documentation → type-documentation
      ├─ Infrastructure → type-infrastructure
      └─ Test/validation → type-test
```

---

## 📋 The 10 Decisions (Reference)

When someone asks "Can we do X instead?", check these:

| # | Decision | What We're Doing | What We're NOT Doing | Impact |
|---|----------|-----------------|---------------------|--------|
| 1 | E2EE | Recovery codes + trust boundaries at launch | Full vault features (defer to v1.1) | E2EE beta positioning |
| 2 | Deploy | Staging first for 99% confidence | Direct production deploy | +3–5 days, safer |
| 3 | DAW Watcher | Standalone beta download | Bundled with web app | Separate installer |
| 4 | Privacy Modes | Full UI (Private/Standard work) | API only, UI later | 3–4 day effort |
| 5 | Vault Lock | Auto-lock after 10m idle + on background | Manual lock only | Cross-device enforcement |
| 6 | Observability | Full stack (Prometheus+Sentry+Loki+Jaeger) | Minimal (Prometheus only) | Better debugging capability |
| 7 | Crypto | CryptoPolicy versioning (AES-256 v1.0) | Lock to single algorithm | Future-proof algorithm migration |
| 8 | Offline | Full read+write (IndexedDB queue) | Read-only offline | Mutation queue + replay |
| 9 | Legal | Full external counsel review | Self-review | 1 week legal timeline |
| 10 | Launch | Closed beta (100 users, 2 weeks) | Public launch day 1 | Maximum safety + feedback |

**Rule:** If someone wants to change a decision, that's a **scope-decision-required** issue → escalate to CTO.

---

## ⏱️ Phase Timeline (Bookmark This)

```
Jan 19 ─ Jan 26    → Phase 1: E2EE Infrastructure (7 days)
Jan 22 ─ Jan 29    → Phase 2: Privacy & Features (7 days, overlaps Phase 1)
Jan 26 ─ Feb 2     → Phase 3: Legal & Compliance (7 days, overlaps Phase 2)
Jan 30 ─ Feb 4     → Phase 4: Staging & Beta Prep (5 days)
Feb 5  ─ Feb 18    → Phase 5: Closed Beta (14 days)
Feb 16 ─ Feb 23    → Phase 6: Production Launch (7 days)
Feb 23+            → Phase 7: Post-Launch (ongoing)

🔴 GATES:
  Jan 26 → Phase 4 ready (Phase 1–3 complete)
  Feb 4  → Phase 5 ready (Beta feedback synthesized)
  Feb 16 → Launch ready (Production infrastructure tested)
```

---

## 🎯 Quick Phase Descriptions

### Phase 1: E2EE Infrastructure (Jan 19–26)
**What:** Vault locking, recovery codes, crypto versioning, encrypted search  
**Who:** Backend + Frontend  
**Gate:** All E2E tests passing + 0 compilation errors  

### Phase 2: Privacy & Features (Jan 22–29)
**What:** Privacy modes UI, DAW Watcher QA, admin telemetry dashboard  
**Who:** Frontend + Backend + DevOps  
**Gate:** DAW Watcher builds signed + admin dashboard live on staging  

### Phase 3: Legal & Compliance (Jan 26–Feb 2)
**What:** Full legal review, E2EE claims alignment, support scripts  
**Who:** Legal + Product  
**Gate:** Legal counsel sign-off + all E2EE docs reviewed  

### Phase 4: Staging & Beta Prep (Jan 30–Feb 4)
**What:** Staging deployment, E2E test execution, beta user recruitment  
**Who:** DevOps + QA + Support  
**Gate:** Staging green + 94 tests 90%+ passing + 100 beta users confirmed  

### Phase 5: Closed Beta (Feb 5–18)
**What:** Real users testing, daily monitoring, feedback synthesis, hotfixes  
**Who:** Support + Product + Engineering (on-call)  
**Gate:** No critical regressions + 80%+ positive feedback + legal final sign-off  

### Phase 6: Production Launch (Feb 16–23)
**What:** Deploy production, public announcement, launch support 24/7  
**Who:** DevOps + Executive + Support + Community  
**Gate:** All health checks green + comms sent + support ready  

### Phase 7: Post-Launch (Feb 23+)
**What:** Monitor metrics, support users, synthesize feedback, plan v1.0.1  
**Who:** Product + Support + Engineering  
**Gate:** Ongoing (no gate to pass)  

---

## 📊 Issue Priority Guide

| Priority | Definition | Examples | Deadline |
|----------|-----------|----------|----------|
| **🔴 P0: Critical** | Blocks phase gate or launch | Compilation error in phase-1 code, authentication broken on staging | Within 4h (Phase 1–5), 30min (Phase 6) |
| **🟠 P1: High** | Affects core feature; breaks E2EE/offline/sync | Vault unlock fails, encryption not working | Within 24h |
| **🟡 P2: Medium** | Affects UX but not core flow | Search results slow, UI button misaligned | Within 48h |
| **🟢 P3: Low** | Cosmetic/minor edge case | Typo in UI, rare error message | Next phase or v1.0.1 |

**Rule:** If it's not in the action plan and blocks a gate → P0 (escalate immediately)

---

## 🚦 Labels Cheat Sheet

**Copy one of these label combinations into your issue:**

### For a Feature Implementation Task
```
Labels: phase-1, type-task, status-in-progress
```

### For a Bug That Blocks a Gate
```
Labels: phase-4, type-bug, critical, status-review
```

### For a Post-Launch Feature Request
```
Labels: type-feature, scope-deferred-v1.0.1, help-wanted
```

### For a Decision Needed
```
Labels: scope-decision-required, needs-input
```

---

## 👤 Who to @ Mention

**By Issue Type:**

| Issue Type | @ Mention | Reason |
|-----------|-----------|--------|
| Phase 1 (E2EE) blocker | @[Backend Lead] @[CTO] | Phase owner + escalation |
| Phase 2 (Privacy) blocker | @[Frontend Lead] @[Backend Lead] | Phase owner + deps |
| Phase 3 (Legal) blocker | @[Legal Lead] @[Exec Sponsor] | External + decision |
| Phase 4+ blocker | @[Phase DRI] @[CTO] | Phase owner + escalation |
| Decision required | @[CTO] @[Product] @[Exec Sponsor] | Authority trio |
| Post-launch bug | @[Support Lead] | Triage for v1.0.1 |

---

## 🎓 Example: Real Issue Triaging

### Bad Issue:
```
Title: Fix the vault thing
Description: It doesn't work
```
❌ Not acceptable. No phase, no reference, no criteria.

### Good Issue:
```
Title: [phase-1] Implement vault auto-lock after 10m inactivity

Relates to: MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Task 1.1
Reference: Section "Vault Lock Policy", lines 150–200

Acceptance Criteria:
- [ ] Backend: `cargo check --bin ignition-api` → 0 errors
- [ ] Frontend: `npm run build` → 0 TypeScript errors
- [ ] E2E: `npx playwright test tests/vault-lock.spec.ts` → 10/10 pass
- [ ] Cross-device: Device A locks → Device B detects within 5 poll cycles

Implementation Steps:
(From ACTION_PLAN.md, Task 1.1)

Deployment Checklist:
- [ ] Merge `vault-lock-policy` branch to `develop`
- [ ] Run full test suite: `npm run test:e2e`
- [ ] Code review by security team
- [ ] Create release notes

Post-Implementation Validation:
```bash
curl -X POST https://staging.ecent.online/api/vault/lock \
  -H "Authorization: Bearer $AUTH_TOKEN"
```
```

✅ Acceptable. Clear phase, references, criteria, steps.

---

## ⚡ Emergency Procedures

### Issue: "We found a critical bug in Phase 6!"

1. **Immediately:**
   ```
   Title: [phase-6] CRITICAL BUG: [What's broken]
   Labels: critical, phase-6, on-call, type-bug
   @ mention: @[CTO] @[Phase 6 DRI] (page them)
   Priority: P0 (fix within 30 min)
   ```

2. **What to include:**
   - [ ] Exact error message
   - [ ] Steps to reproduce
   - [ ] Impact (% of users affected)
   - [ ] Proposed fix (1-line summary)

3. **Updates:**
   - Comment every 5 min with status
   - When fixed: Post PR + close issue

---

## ✅ Pre-Issue Checklist

**Before clicking "New Issue", verify:**

- [ ] I've checked the 10 decisions (does it conflict?)
- [ ] I've checked the action plan (is it already a task?)
- [ ] I can identify which phase (1–7) this belongs to
- [ ] I can reference the specific ACTION_PLAN.md task
- [ ] I can list acceptance criteria (from ACTION_PLAN.md)
- [ ] I know who the phase DRI is (will assign to them)
- [ ] I know the deadline (from ACTION_PLAN.md timeline)

**If you can't check all these, your issue isn't ready.**

---

## 🔗 Where to Find Information

| Question | Answer Location |
|----------|-----------------|
| "What's the timeline?" | LAUNCH_MASTER_INDEX.md, Critical Path Timeline |
| "What phase is this in?" | LAUNCH_MASTER_INDEX.md, Phase Overview |
| "How do I implement X?" | MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Task Y.Z |
| "Is feature X in scope?" | MASTER_FEATURE_SPEC.md, Section 2 (Feature Inventory) |
| "What's the go/no-go gate?" | MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Phase Gate section |
| "What's the decision on X?" | MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md, Decisions 1–10 |
| "How should I triage this?" | DEPLOYMENT_EXECUTION_TRIAGE.instructions.md (this file) |

---

## 📞 When to Escalate

**Escalate immediately if:**
- Issue blocks phase gate (critical path)
- Decision conflicts with one of the 10 resolutions
- Timeline needs to shift
- Resource conflict (person assigned to multiple P0s)
- Legal/compliance concern
- Infrastructure unavailable

**Escalation path:**
1. Create GitHub issue + label: `scope-decision-required`
2. @ mention: Phase DRI + CTO (+ Exec if budget/timeline impact)
3. Wait for decision in comments (binding)
4. Apply decision + proceed

---

## 🎊 That's It!

Every GitHub issue during Passion OS deployment should now:
1. ✅ Reference the master documents
2. ✅ Have acceptance criteria from ACTION_PLAN.md
3. ✅ Be assigned to the correct phase + DRI
4. ✅ Be labeled appropriately
5. ✅ Block or not block a gate (explicit)

**Questions?** Comment in this repository's issues with `documentation` label.

---

**Last Updated:** January 19, 2026  
**Effective:** Immediately  
**Permanent:** Yes (live reference file)

