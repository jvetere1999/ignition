# OPTIMIZATION FRAMEWORK - QUICK REFERENCE CARD

**Print this and keep it handy during execution**

---

## 📍 THE 3 FILES YOU'LL USE MOST

### File 1: OPTIMIZATION_TRACKER.md
**Location**: `/debug/OPTIMIZATION_TRACKER.md`  
**Update**: Daily (5-10 min)  
**Status**: Editable, live tracking  

**What to do**:
1. Find your task in the table
2. Update status (NOT_STARTED → IN_PROGRESS → COMPLETE)
3. Add effort hours spent
4. Add PR link when ready
5. Add notes if blocked

**Example**:
```
| SEC-001 | OAuth Validation | IN_PROGRESS | 0.1h | 0.2h | Week 1 | [PR#123] | Working on validation logic |
```

---

### File 2: Analysis Document (linked in tracker)
**Location**: `/debug/analysis/backend_*.md` or `frontend_*.md`  
**Update**: Never (read-only)  
**Status**: Reference only  

**What to do**:
1. Click link from OPTIMIZATION_TRACKER.md
2. Read "Issue" section (understand problem)
3. Read "Implementation" section (step-by-step roadmap)
4. Read "Validation" section (acceptance criteria)
5. Code the fix following the roadmap

**Example**:
- SEC-001 link → backend_security_patterns.md#oauth-redirect
- Has 8 implementation steps
- Has 5 validation tests

---

### File 3: Code (actual implementation)
**Location**: `/app/backend/...` or `/app/frontend/...`  
**Update**: As you work  
**Status**: This is what you're modifying  

**What to do**:
1. Open file mentioned in analysis
2. Find the exact line number
3. Read the TODO marker (added during setup)
4. Implement fix following analysis roadmap
5. Validate using checklist
6. Mark as COMPLETE in OPTIMIZATION_TRACKER.md

**Example**:
- Open: app/backend/crates/api/src/routes/auth.rs
- Line: 100-115
- TODO: Validate redirect_uri
- Fix it, test it, commit it

---

## ⚡ DAILY 10-MINUTE WORKFLOW

**Every day, repeat this process**:

1. **Start** (1 min)
   - Open OPTIMIZATION_TRACKER.md
   - Look for NOT_STARTED task

2. **Understand** (3 min)
   - Click task link → Analysis document
   - Read issue & roadmap

3. **Implement** (5-30 min depending on task)
   - Open code file
   - Follow roadmap steps
   - Validate using checklist

4. **Track** (1 min)
   - Update OPTIMIZATION_TRACKER.md
   - Status: COMPLETE, Hours: X, PR: [link]

5. **Review** (15 min for reviewer)
   - Verify validation checklist passed
   - Check code follows roadmap
   - Approve or request changes

**Result**: One task complete, progress tracked

---

## 📊 THE 6 CRITICAL TASKS (Week 1)

```
SEC-001: OAuth Redirect Validation          0.2h
SEC-002: Coin Spending Race Condition       1.5h
SEC-003: XP Integer Overflow                1.5h
SEC-004: Configuration Validation           0.25h
SEC-005: Security Headers                   0.2h
SEC-006: Session Activity Race Condition    0.3h
─────────────────────────────────────────────────
TOTAL WEEK 1:                               4 hours
```

**Goal**: Finish all 6 by end of Friday  
**Status**: Track in OPTIMIZATION_TRACKER.md

---

## 🎯 STATUS VALUES (in Tracker)

| Status | Meaning | Next Action |
|--------|---------|-------------|
| NOT_STARTED | Work hasn't begun | Pick task, read analysis |
| IN_PROGRESS | Someone is working on it | Continue work, test, validate |
| BLOCKED | Waiting for something | Unblock or switch tasks |
| REVIEW | Ready for code review | Code review, merge |
| COMPLETE | Done, merged to main | Close task, celebrate |

---

## ✅ BEFORE YOU COMMIT

**Every time**, verify ALL of these:

- [ ] Code changed (not just TODO updated)
- [ ] Implementation follows analysis roadmap
- [ ] Validation checklist items all pass
- [ ] `cargo check` = 0 errors (backend) OR `npm lint` = 0 errors (frontend)
- [ ] Tests pass (if applicable)
- [ ] Code review approved
- [ ] PR linked in tracker
- [ ] Commit message includes task ID: `[SEC-001] Fix OAuth redirect validation`

**If any box is empty**: Don't commit, fix it first

---

## 🆘 IF YOU GET STUCK

### Stuck on Implementation?
→ Read analysis document again  
→ Look at code examples in analysis  
→ Check "Before/After" section  
→ Ask tech lead, pair program  

### Stuck on Testing?
→ Read "Validation" section in analysis  
→ Follow test examples shown  
→ Run tests as described  
→ If test fails, re-read implementation  

### Stuck on Validation?
→ Use checklist in analysis document  
→ Each checkbox = one thing to test  
→ Can't skip any items  
→ Code review verifies completion  

### Blocked by Someone Else?
→ Mark as BLOCKED in OPTIMIZATION_TRACKER.md  
→ Note the blocker (what are you waiting for?)  
→ Pick another NOT_STARTED task  
→ Come back when unblocked  

---

## 📈 WHAT PROGRESS LOOKS LIKE

**Daily** (update in OPTIMIZATION_TRACKER.md):
```
Monday:   SEC-001 COMPLETE ✓ (added 0.2h)
Tuesday:  SEC-002 COMPLETE ✓ (added 1.5h)
Wednesday: SEC-003 COMPLETE ✓ (added 1.5h)
Thursday: SEC-004 COMPLETE ✓ (added 0.25h)
Friday:   SEC-005 COMPLETE ✓ (added 0.2h)
          SEC-006 COMPLETE ✓ (added 0.3h)
WEEK 1 TOTAL: 6/6 CRITICAL COMPLETE ✅
```

**Weekly** (report to tech lead):
```
Week 1: 6/6 CRITICAL (100%) = 4h total
Week 2: 8/26 HIGH (31%) = 8h total
Week 3: 18/26 HIGH (69%) = 8h total
```

**Monthly** (track velocity):
```
Week 1: 6 tasks
Week 2: 8 tasks
Week 3: 10 tasks
Week 4: 5 tasks (catch-up week)
Total: 29 tasks in month 1 = 70% of remaining
```

---

## 🔗 KEY DOCUMENT LINKS

| Name | Read When | Time |
|------|-----------|------|
| OPTIMIZATION.instructions | Starting week 1 | 20 min |
| OPTIMIZATION_TRACKER.md | Daily before working | 5 min |
| OPTIMIZATION_SUMMARY.md | Questions about process | 10 min |
| MASTER_TASK_LIST.md | Need to find a task | 5 min |
| Analysis doc (linked in tracker) | Before implementing | 10 min |
| TODO_INSTRUMENTATION_GUIDE.md | During setup week | 15 min |
| DEBUGGING.md | After merge | 5 min |

---

## 📱 PHONE-FRIENDLY VERSION

**Everything you need to know on your phone**:

```
🎯 DAILY WORKFLOW (10 min)
1. Open OPTIMIZATION_TRACKER.md
2. Pick NOT_STARTED task
3. Click analysis link
4. Read implementation steps
5. Code the fix
6. Validate checklist
7. Update tracker (COMPLETE)
8. Done ✅

📊 WEEK 1 GOAL
SEC-001 ✓ SEC-002 ✓ SEC-003 ✓
SEC-004 ✓ SEC-005 ✓ SEC-006 ✓
All 6 CRITICAL = 4 hours

💾 BEFORE YOU COMMIT
☑️ Code changed
☑️ Follows roadmap
☑️ Validation passed
☑️ Tests pass
☑️ Code reviewed
☑️ Commit message: [SEC-001] description

🆘 STUCK?
→ Read analysis again
→ Look for code examples
→ Ask tech lead
→ Check validation section
→ Mark as BLOCKED, pick another task

✅ COMPLETE WHEN
- 6/6 CRITICAL done (Week 1)
- 26/26 HIGH done (Weeks 2-3)
- 8/8 MEDIUM done (Month 1)
- 3+ LOW done (Month 2+)
- Zero TODO comments left in code
- All validation checklists passed
```

---

## 📋 ROLE-SPECIFIC QUICK GUIDES

### If You're an Engineer

**Daily**:
1. Open OPTIMIZATION_TRACKER.md
2. Pick next NOT_STARTED task
3. Follow the 10-minute workflow above
4. Update tracker when done

**Weekly**:
1. How many tasks completed? (calculate hours)
2. Any blockers? (mark them)
3. Ready for next week? (let lead know)

**Monthly**:
1. How many tasks total? (add up hours)
2. Faster or slower than estimated?
3. What did we learn?

---

### If You're a Code Reviewer

**Per PR**:
1. Does it match the analysis roadmap?
2. Did they pass the validation checklist?
3. Any TODO comments left? (remove them)
4. Code quality acceptable? (approve or request changes)
5. Merge if approved

**After Merge**:
1. Update OPTIMIZATION_TRACKER.md (mark COMPLETE)
2. Update DEBUGGING.md (link PR)

---

### If You're a Tech Lead

**Daily**:
1. Check OPTIMIZATION_TRACKER.md summary
2. Any blockers? → Unblock them
3. Any slow tasks? → Pair program if needed

**Weekly**:
1. Total completed vs. planned
2. Velocity (tasks/person/week)
3. Any risks? → Plan mitigation
4. Plan next week's tasks

**Monthly**:
1. Accuracy of estimates
2. Team velocity trend
3. Adjust timeline if needed

---

### If You're a Project Manager

**Weekly**:
1. How many tasks complete? (X/145)
2. How many hours spent? (X/32)
3. % progress? (X%)
4. Report to stakeholders

**Monthly**:
1. Detailed analytics
2. Compare estimate vs. actual
3. Forecast completion date
4. Budget remaining

---

## 🚀 EXECUTION CHECKLIST

**Before Week 1 starts**:

- [ ] Team read OPTIMIZATION.instructions
- [ ] Team read START_HERE.md
- [ ] Tech lead ran TODO instrumentation
- [ ] OPTIMIZATION_TRACKER.md structure understood
- [ ] First task (SEC-001) identified
- [ ] Code location ready (auth.rs:100-115)
- [ ] Calendar blocked (4 hours Week 1)

**Week 1 goal**: All 6 CRITICAL tasks done ✅

**Week 2-3 goal**: 20+ of 26 HIGH tasks done ✅

**Month 1 goal**: All 145 tasks 80% complete ✅

---

## 💡 REMEMBER

- **Every task is tracked** → No hidden work
- **Every task is documented** → No ambiguity
- **Every task is verifiable** → Can't fake completion
- **Every task has a roadmap** → Know what to do
- **Every task has validation** → Know when you're done

**Progress is visible daily.**  
**Status is always clear.**  
**Next actions are always obvious.**

---

## 🎓 SUMMARY

| What | Where | When | Who |
|------|-------|------|-----|
| **Pick task** | OPTIMIZATION_TRACKER.md | Daily morning | Engineer |
| **Understand task** | Analysis document | Daily morning | Engineer |
| **Implement** | Code file | Daily (1-6h) | Engineer |
| **Validate** | Checklist in analysis | End of day | Engineer |
| **Update tracking** | OPTIMIZATION_TRACKER.md | End of day | Engineer |
| **Code review** | GitHub PR | Per PR | Reviewer |
| **Merge** | GitHub main | Per PR | Reviewer |
| **Update phase** | DEBUGGING.md | Per merge | Reviewer |
| **Check blockers** | OPTIMIZATION_TRACKER.md | Daily | Tech Lead |
| **Plan week** | OPTIMIZATION_TRACKER.md | Monday | Tech Lead |
| **Report progress** | OPTIMIZATION_TRACKER.md | Friday | PM |

---

**Print this card and keep it on your desk during Week 1 ✅**

*Quick Reference Card - Optimization Framework*  
*Keep handy during execution phase*  
*Updated: January 15, 2026*
