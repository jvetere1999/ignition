# GitHub Instructions Index — Deployment & Operations
**Location:** `.github/instructions/`  
**Purpose:** Master index for all operational guidance during Passion OS deployment  
**Effective:** January 19, 2026  
**Status:** Living reference (updated as phases progress)

---

## 🎯 What Are These Files?

These GitHub instruction files provide **permanent, canonical guidance** for how to:
- Execute the 3–4 week deployment plan
- Triage issues to the right phase + owner
- Make decisions aligned with the 10 resolved decisions
- Track progress toward launch gates
- Maintain quality through all 7 phases

**All work MUST follow these instructions.**

---

## 📂 The Four Instruction Files

### 1. **MANDATORY_CONTEXT.instructions.md** ← Start Here
**What:** Architectural principles + team context + stack decisions  
**Read When:** First time contributing to the project  
**Size:** Quick read (10 min)  
**Key Sections:**
- SQLx pattern (runtime binding, not compile-time macros)
- Frontend API client pattern (credentials: 'include')
- Backend route pattern (models → repos → handlers)
- Test pattern (Playwright)
- Deployment rules (mandatory)

---

### 2. **DEPLOYMENT_EXECUTION_TRIAGE.instructions.md** ← This File (NEW)
**What:** How to triage all GitHub issues + PRs during 7-phase deployment  
**Read When:** You're opening a GitHub issue or reviewing a PR  
**Size:** Detailed reference (20 pages)  
**Key Sections:**
- 7-phase structure + timeline + owners
- 10 decisions (reference for scope decisions)
- GitHub issue triage framework (Rules 1–5)
- Task-to-GitHub mapping + template
- Go/No-Go gates (3 decision points)
- Label system (phase + status + type + decision)
- Weekly status reporting template
- Decision authority escalation path
- Code review merge rules
- Incident response procedures
- Roles & responsibilities
- Permanent update process

**This file replaces ad-hoc decision-making with systematic process.**

---

### 3. **DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md** ← Quick Lookup (NEW)
**What:** One-page cheat sheet for rapid issue triage  
**Read When:** You need to triage an issue in < 5 minutes  
**Size:** Quick reference (4 pages)  
**Key Sections:**
- Triage decision tree (flowchart)
- GitHub issue template (copy & paste)
- 10 decisions summary table
- Phase timeline visual
- Priority guide (P0–P3)
- Labels cheat sheet (common combinations)
- Who to @ mention by issue type
- Example: bad issue → good issue
- Emergency procedures
- Pre-issue checklist
- Quick reference links

**Use this when you're in a hurry.**

---

### 4. **CODE_REVIEW_AND_CLEANUP.instructions.md** (Existing)
**What:** Code quality standards + cleanup procedures  
**Read When:** You're reviewing code or preparing for a release  
**Key Sections:**
- Code quality standards (linting, testing)
- Cleanup procedures (before merge)
- Deprecation warnings (handle properly)

---

### 5. **DEBUGGING.instructions.md** (Existing)
**What:** How to debug issues systematically  
**Read When:** Something's broken and you need to fix it  
**Key Sections:**
- Debugging workflow
- Common error patterns
- Tools & techniques

---

### 6. **GIT_WORKFLOW.instructions.md** (Existing)
**What:** How to work with Git branches + commits  
**Read When:** You're making a change or merging code  
**Key Sections:**
- Branch naming conventions
- Commit message format
- Merge strategy

---

### 7. **OPTIMIZATION.instructions.md** (Existing)
**What:** Performance optimization guidelines  
**Read When:** You're optimizing code or infrastructure  
**Key Sections:**
- Frontend optimization
- Backend optimization
- Database optimization

---

## 🔄 How These Files Work Together

```
You join the project
└─> Read MANDATORY_CONTEXT.instructions.md (understand stack)
└─> Bookmark DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md (save time)
└─> Reference DEPLOYMENT_EXECUTION_TRIAGE.instructions.md (systematic process)

You want to open a GitHub issue
└─> Check DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md (2 min)
└─> Find your phase + DRI assignment
└─> Use GitHub issue template (copy from quick ref)
└─> Reference MAXIMUM_CONFIDENCE_ACTION_PLAN.md for acceptance criteria
└─> Submit issue with proper labels + @ mentions

You're reviewing a PR
└─> Check DEPLOYMENT_EXECUTION_TRIAGE.instructions.md, "Code Review Rules"
└─> Verify PR references master documents
└─> Verify acceptance criteria met (from ACTION_PLAN.md)
└─> Approve = "Ready for phase gate validation"

You need to report status (weekly)
└─> Use template from DEPLOYMENT_EXECUTION_TRIAGE.instructions.md
└─> Reference current phase + go/no-go gate status
└─> Update stakeholders

You have a question about deployment
└─> DEPLOYMENT_EXECUTION_TRIAGE.instructions.md has decision authority escalation
└─> Follow the escalation process to get binding decision
└─> Document decision in GitHub issue
```

---

## 🎓 Reading Guide by Role

### **For Engineering Leads**
1. Read: [MANDATORY_CONTEXT.instructions.md](MANDATORY_CONTEXT.instructions.md) (tech decisions)
2. Read: [DEPLOYMENT_EXECUTION_TRIAGE.instructions.md](DEPLOYMENT_EXECUTION_TRIAGE.instructions.md) (process + roles)
3. Bookmark: [DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md](DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md) (daily use)
4. Reference: `.github/copilot-instructions.md` (architectural patterns)

### **For Engineers (Implementation)**
1. Skim: [MANDATORY_CONTEXT.instructions.md](MANDATORY_CONTEXT.instructions.md)
2. Bookmark: [DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md](DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md)
3. When opening issue: Copy template from quick ref + check 10 decisions
4. When reviewing PR: Use merge rules from DEPLOYMENT_EXECUTION_TRIAGE.instructions.md

### **For QA & Test Engineers**
1. Read: [MANDATORY_CONTEXT.instructions.md](MANDATORY_CONTEXT.instructions.md), Test Pattern section
2. Reference: MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Phase 4 (test execution)
3. Use: DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md for issue triage

### **For DevOps & Infrastructure**
1. Read: [MANDATORY_CONTEXT.instructions.md](MANDATORY_CONTEXT.instructions.md), Deployment Rules
2. Reference: MAXIMUM_CONFIDENCE_ACTION_PLAN.md, Tasks 4.1, 6.1 (deployment procedures)
3. Use: DEPLOYMENT_EXECUTION_TRIAGE.instructions.md, Incident Response section

### **For Product & Support**
1. Skim: [MANDATORY_CONTEXT.instructions.md](MANDATORY_CONTEXT.instructions.md), API client pattern
2. Read: LAUNCH_MASTER_INDEX.md (status + timeline)
3. Reference: MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md (decisions + risks)
4. Use: DEPLOYMENT_EXECUTION_TRIAGE.instructions.md, Weekly Status Report template

---

## 🔗 Master Documents (Authority)

These are NOT instruction files, but are referenced BY the instructions:

| Document | Purpose | Authority For |
|----------|---------|----------------|
| **MAXIMUM_CONFIDENCE_ACTION_PLAN.md** | Detailed task breakdown | Acceptance criteria, effort, timeline |
| **MASTER_FEATURE_SPEC.md** | Feature inventory + E2EE spec | Feature scope, APIs, architecture |
| **LAUNCH_MASTER_INDEX.md** | Status snapshot + overview | Phase status, go/no-go gates |
| **MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md** | Leadership summary | Timeline, decisions 1–10, risks |

**Rule:** Every GitHub issue MUST reference one of these master docs.

---

## 📋 Quick Reference: The Process in 30 Seconds

```
1. You want to work on something
   └─> Check ACTION_PLAN.md: Is it one of the 14 tasks?
   
2. If YES: Open GitHub issue
   └─> Label: phase-X (pick your phase)
   └─> Title: [phase-X] [Task name from ACTION_PLAN.md]
   └─> Acceptance: Copy from ACTION_PLAN.md, Task X.Y
   └─> Assign: To phase DRI
   
3. If NO: Check the 10 decisions
   └─> Does it conflict with one of them?
   └─> If YES: Defer to post-launch roadmap (v1.0.1+)
   └─> If NO: Open issue + label `scope-decision-required`
   
4. When you're done with the task
   └─> Update GitHub issue + mark complete
   └─> Verify acceptance criteria met
   └─> Create PR + reference master docs
   └─> Phase DRI reviews + approves
   
5. Each phase complete
   └─> Phase DRI closes all issues for that phase
   └─> Run go/no-go gate verification
   └─> Proceed to next phase
```

---

## ⏱️ Timeline Reference (Copy to Your Calendar)

```
Jan 19 ─ Jan 26 → Phase 1: E2EE Infrastructure
                  Gate 1: All E2E tests passing, 0 errors

Jan 26 ─ Feb 2  → Phase 2–3: Privacy + Legal
                  Gate 2: Legal sign-off, staging ready

Feb 4 ─ Feb 5   → Phase 4: Staging + beta recruitment complete
                  Gate 3: E2E tests 90%+ passing, 100 beta users confirmed

Feb 5 ─ Feb 18  → Phase 5: Closed beta (real users)

Feb 16 ─ Feb 23 → Phase 6: Production launch + comms

Feb 23+         → Phase 7: Post-launch monitoring + v1.0.1 roadmap

🔴 CRITICAL DATES:
  Jan 26 → Phase 1 gate decision (go to Phase 5 or extend?)
  Feb 4  → Phase 5 gate decision (ready to launch or extend beta?)
  Feb 16 → Phase 6 gate decision (deploy production or hold?)
```

---

## 🚦 Decision Authority (When You Need Input)

**Binding decisions made by:**

| Decision Type | Authority |
|---------------|-----------|
| **Scope decision** (is X in scope?) | CTO + Product Manager |
| **Timeline decision** (can we do X by Y?) | Product Manager + Exec Sponsor |
| **Quality decision** (is code ready?) | Phase DRI + Engineering Lead |
| **Risk decision** (is risk acceptable?) | CTO + Exec Sponsor |
| **Legal decision** (does this align?) | Legal Lead + Exec Sponsor |
| **Operations decision** (can we deploy?) | DevOps Lead + CTO |

**Process:** Create GitHub issue + @ mention authority → decision in comments → binding

---

## 📊 Weekly Check-In

Every Monday 0900 UTC:

1. **Review phase progress** (against ACTION_PLAN.md)
2. **Check for blockers** (GitHub issues with `status-blocked`)
3. **Assess gate readiness** (will we hit go/no-go date?)
4. **Update stakeholders** (weekly status report)
5. **Adjust priorities** (if needed)

**Template:** See DEPLOYMENT_EXECUTION_TRIAGE.instructions.md, "Weekly Status Report"

---

## ✅ How to Know If You're Doing It Right

**✅ Good Practices:**
- [ ] Every GitHub issue has a phase label (phase-1 through phase-7)
- [ ] Every GitHub issue references an ACTION_PLAN.md task
- [ ] Every PR references a GitHub issue + master documents
- [ ] Acceptance criteria come from ACTION_PLAN.md
- [ ] Phase DRI is assigned to every open issue in their phase
- [ ] Go/No-Go gates evaluated on schedule
- [ ] Weekly status reports delivered on time

**❌ Red Flags:**
- [ ] Issue created without phase label → Immediate action
- [ ] Issue acceptance criteria unclear → Reference ACTION_PLAN.md
- [ ] Task is not in the 14 tasks → Escalate with `scope-decision-required`
- [ ] Blocker not being tracked → Create GitHub issue immediately
- [ ] Phase gate missed → Post-incident review required

---

## 📞 Getting Help

**Question About...**

- **Deployment process** → See DEPLOYMENT_EXECUTION_TRIAGE.instructions.md
- **Quick triage** → See DEPLOYMENT_TRIAGE_QUICK_REFERENCE.md
- **Tech decisions** → See MANDATORY_CONTEXT.instructions.md
- **Feature scope** → See MASTER_FEATURE_SPEC.md, Section 2
- **Task details** → See MAXIMUM_CONFIDENCE_ACTION_PLAN.md
- **Phase status** → See LAUNCH_MASTER_INDEX.md
- **Project timeline** → See MAXIMUM_CONFIDENCE_EXECUTIVE_SUMMARY.md

**Still confused?** Create GitHub issue with `documentation` label.

---

## 📝 Maintenance of This File

**This file is permanent and living.**

- Update when: Instructions change, new files added, process refined
- Ownership: CTO (final approval)
- Version: Bump when process changes significantly
- Review: Every 2 weeks during deployment phases

---

## 🎯 One-Sentence Summary

**All Passion OS deployment work follows a master plan documented in 4+ files, triaged systematically via GitHub, with explicit decision authority and phase-based progress tracking.**

---

**Created:** January 19, 2026  
**Last Updated:** January 19, 2026  
**Next Review:** January 26, 2026  
**Permanent:** Yes

