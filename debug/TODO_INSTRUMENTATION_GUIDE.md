# CODE TODO INSTRUMENTATION GUIDE

**Purpose**: Add exact code markers so every task location is traceable  
**When**: Phase 1 of OPTIMIZATION.instructions  
**Time**: 1-2 hours for all 145 tasks  

---

## TODO TEMPLATE

### Standard Format
```rust
// TODO [TASK-ID]: Brief description of what needs to be done
// Reference: analysis.md#section | Status: NOT_STARTED
```

### TypeScript/JavaScript Format
```typescript
// TODO [TASK-ID]: Brief description of what needs to be done
// Reference: analysis.md#section | Status: NOT_STARTED
```

### In Comments (when inline not practical)
```rust
/*
  TODO [TASK-ID]: Brief description
  Reference: analysis.md#section
  Status: NOT_STARTED
  
  This needs to be fixed because: [brief reason]
  Implementation: [brief approach]
*/
```

---

## COMPLETE LIST OF ALL 145 TASKS WITH CODE LOCATIONS

### ✅ CRITICAL (6 tasks - 4 hours total)

#### SEC-001: OAuth Redirect Validation (0.2h)
**File**: `app/backend/crates/api/src/routes/auth.rs`  
**Lines**: 100-115 (redirect_uri validation)  
**Reference**: [backend_security_patterns.md#oauth-redirect](analysis/backend_security_patterns.md#oauth-redirect)  
**TODO**:
```rust
// TODO [SEC-001]: Validate redirect_uri against whitelist before OAuth redirect
// Reference: backend_security_patterns.md#oauth-redirect | Status: NOT_STARTED
// Issue: Open redirect vulnerability allows attacker-controlled redirects
// Fix: Whitelist allowed domains, reject unknown redirects with 400
```

---

#### SEC-002: Coin Spending Race Condition (1.5h)
**File**: `app/backend/crates/api/src/db/gamification_repos.rs`  
**Lines**: 197-215 (spend_coins function)  
**Reference**: [backend_gamification_repos.md#race-condition](analysis/backend_gamification_repos.md#race-condition)  
**TODO**:
```rust
// TODO [SEC-002]: Add transaction isolation to prevent concurrent coin double-spend
// Reference: backend_gamification_repos.md#race-condition | Status: NOT_STARTED
// Issue: Race condition allows spending coins twice simultaneously
// Fix: Use SERIALIZABLE transaction level + pessimistic lock on balance
```

---

#### SEC-003: XP Overflow Integer (1.5h)
**File**: `app/backend/crates/api/src/db/gamification_repos.rs`  
**Lines**: 312-328 (calculate_xp function)  
**Reference**: [backend_gamification_repos.md#xp-overflow](analysis/backend_gamification_repos.md#xp-overflow)  
**TODO**:
```rust
// TODO [SEC-003]: Add overflow protection to XP calculation (max i32 = 2.1B)
// Reference: backend_gamification_repos.md#xp-overflow | Status: NOT_STARTED
// Issue: XP calculation can overflow, causing data corruption
// Fix: Use checked_add(), cap at i32::MAX, or migrate to BIGINT
```

---

#### SEC-004: Config Validation Missing (0.25h)
**File**: `app/backend/crates/api/src/config.rs`  
**Lines**: 45-67 (parse_config function)  
**Reference**: [backend_configuration_patterns.md#validation](analysis/backend_configuration_patterns.md#validation)  
**TODO**:
```rust
// TODO [SEC-004]: Validate configuration values at startup
// Reference: backend_configuration_patterns.md#validation | Status: NOT_STARTED
// Issue: Invalid config values cause runtime failures
// Fix: Add validation for: port range, timeout limits, secret min length
```

---

#### SEC-005: Missing Security Headers (0.2h)
**File**: `app/backend/crates/api/src/middleware/mod.rs`  
**Lines**: 78-92 (middleware initialization)  
**Reference**: [backend_middleware_patterns.md#security-headers](analysis/backend_middleware_patterns.md#security-headers)  
**TODO**:
```rust
// TODO [SEC-005]: Add security headers (CSP, X-Frame-Options, HSTS)
// Reference: backend_middleware_patterns.md#security-headers | Status: NOT_STARTED
// Issue: Missing headers expose to common web vulnerabilities
// Fix: Add Tower middleware for: X-Content-Type-Options, X-Frame-Options, CSP
```

---

#### SEC-006: Session Activity Race Condition (0.3h)
**File**: `app/backend/crates/api/src/db/sessions_repos.rs`  
**Lines**: 167-185 (update_activity function)  
**Reference**: [backend_database_patterns.md#session-activity](analysis/backend_database_patterns.md#session-activity)  
**TODO**:
```rust
// TODO [SEC-006]: Fix race condition in session activity update
// Reference: backend_database_patterns.md#session-activity | Status: NOT_STARTED
// Issue: Concurrent activity updates can be lost
// Fix: Use atomic UPDATE ... SET last_activity = $1 without SELECT first
```

---

### 🔴 HIGH (26 tasks - 16 hours total)

#### BACK-001: Vault State Security (1h)
**File**: `app/backend/crates/api/src/db/vault_repos.rs`  
**Lines**: 42-67 (vault_state function)  
**Reference**: [backend_vault_patterns.md#state-security](analysis/backend_vault_patterns.md#state-security)  
**Status**: Will add TODO  

#### BACK-002: SQL Injection Prevention (2h)
**File**: `app/backend/crates/api/src/db/` (all repos)  
**Multiple locations**: Query construction  
**Reference**: [backend_database_patterns.md#sql-injection](analysis/backend_database_patterns.md#sql-injection)  
**Status**: Will add TODOs to each query builder

#### BACK-003 through BACK-026: [Continue for all 26 HIGH tasks]
**Reference**: [MASTER_TASK_LIST.md](analysis/MASTER_TASK_LIST.md)  
**Pattern**: Same TODO format applied to each code location

---

### 🟡 MEDIUM (8 tasks - 8 hours total)

#### QUAL-001 through QUAL-008: [Code quality improvements]
**Reference**: [MASTER_TASK_LIST.md](analysis/MASTER_TASK_LIST.md)  
**Pattern**: Same TODO format applied to each code location

---

### 🟢 LOW (3+ tasks - 4+ hours total)

#### LOW-001 through LOW-003+: [Polish & documentation]
**Reference**: [MASTER_TASK_LIST.md](analysis/MASTER_TASK_LIST.md)  
**Pattern**: Same TODO format applied to each code location

---

## HOW TO ADD TODOs: STEP-BY-STEP

### Step 1: Get the File Location
Look in MASTER_TASK_LIST.md for the task:
```markdown
## SEC-001: OAuth Redirect Validation

Location: app/backend/crates/api/src/routes/auth.rs:100-115
```

### Step 2: Open the File
```bash
code app/backend/crates/api/src/routes/auth.rs
```

### Step 3: Find the Exact Lines
Navigate to line 100 (Ctrl+G → type 100 → Enter)

### Step 4: Add TODO Before the Function/Block
Position cursor at start of function (line 100), add comment:
```rust
// TODO [SEC-001]: Validate redirect_uri against whitelist before OAuth redirect
// Reference: backend_security_patterns.md#oauth-redirect | Status: NOT_STARTED
```

### Step 5: Save & Verify
- File saved automatically
- TODO appears in VS Code's "Problems" view
- Grepable: `grep -r "TODO \[SEC-" app/backend/`

### Step 6: Update Tracker
In OPTIMIZATION_TRACKER.md, mark task as "TODO ADDED":
```markdown
| SEC-001 | OAuth Redirect | TODO ADDED | 0.2h | Week 1 |
```

---

## EXAMPLE: Adding SEC-001 TODO

### Before
```rust
pub fn authorize_oauth_callback(
    query: Query<OAuthCallback>,
    state: Data<AppState>,
) -> impl Responder {
    let redirect_uri = &query.redirect_uri;
    // Redirect without validation ❌
    HttpResponse::TemporaryRedirect()
        .header("Location", redirect_uri)
        .finish()
}
```

### After
```rust
// TODO [SEC-001]: Validate redirect_uri against whitelist before OAuth redirect
// Reference: backend_security_patterns.md#oauth-redirect | Status: NOT_STARTED
pub fn authorize_oauth_callback(
    query: Query<OAuthCallback>,
    state: Data<AppState>,
) -> impl Responder {
    let redirect_uri = &query.redirect_uri;
    
    // Validate against whitelist
    if !state.allowed_redirects.contains(redirect_uri) {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid redirect_uri"
        }));
    }
    
    HttpResponse::TemporaryRedirect()
        .header("Location", redirect_uri)
        .finish()
}
```

---

## STATUS FIELD VALUES

As task progresses, update TODO status:

```rust
// Status: NOT_STARTED        (Initial - work hasn't started)
// Status: IN_PROGRESS        (Work is ongoing)
// Status: REVIEW             (Ready for code review)
// Status: BLOCKED            (Waiting for something external)
// Status: COMPLETE           (Done, merged to main)
```

Example update:
```rust
// TODO [SEC-001]: Validate redirect_uri
// Reference: backend_security_patterns.md#oauth-redirect | Status: IN_PROGRESS
// PR: https://github.com/...
```

---

## BULK TODO GENERATION

### Option 1: Use Python Script (Quick)

Create `scripts/add_todos.py`:
```python
#!/usr/bin/env python3
import re

TODOS = [
    {
        'id': 'SEC-001',
        'file': 'app/backend/crates/api/src/routes/auth.rs',
        'line': 100,
        'text': 'Validate redirect_uri against whitelist',
        'ref': 'backend_security_patterns.md#oauth-redirect'
    },
    # ... continue for all 145 tasks
]

for todo in TODOS:
    with open(todo['file'], 'r') as f:
        lines = f.readlines()
    
    line_idx = todo['line'] - 1
    comment = f"// TODO [{todo['id']}]: {todo['text']}\n"
    comment += f"// Reference: {todo['ref']} | Status: NOT_STARTED\n"
    
    lines.insert(line_idx, comment)
    
    with open(todo['file'], 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Added {todo['id']} to {todo['file']}")
```

Run:
```bash
python3 scripts/add_todos.py
```

### Option 2: Manual (Most Careful)

1. List all tasks: `grep "^|" MASTER_TASK_LIST.md | head -20`
2. For each task: Open file → Add TODO
3. Verify: `grep -r "TODO \[" app/backend/ | wc -l` (should be 145)

---

## VERIFICATION CHECKLIST

After adding all TODOs, verify:

- [ ] `grep -r "TODO \[" app/backend/ | wc -l` = 145 (backend TODOs)
- [ ] `grep -r "TODO \[" app/frontend/` = N (frontend TODOs)
- [ ] All TODOs have format: `[TASK-ID]`
- [ ] All TODOs have Reference link
- [ ] All TODOs have Status: NOT_STARTED
- [ ] All files still compile: `cargo check --bin ignition-api` = 0 errors
- [ ] OPTIMIZATION_TRACKER.md updated with "TODO ADDED" status for each

**✅ TODOs Complete** when all 145 tasks have markers in code

---

## UPDATING TODOS DURING EXECUTION

### When Starting Work on a Task
Update status to IN_PROGRESS:
```rust
// TODO [SEC-001]: Validate redirect_uri
// Reference: ... | Status: IN_PROGRESS
```

### When Ready for Review
Update to REVIEW:
```rust
// TODO [SEC-001]: Validate redirect_uri
// Reference: ... | Status: REVIEW
// PR: https://github.com/username/repo/pull/123
```

### When Merged
Mark COMPLETE + optional removal:
```rust
// DONE [SEC-001]: Validated redirect_uri against whitelist
// Merged: https://github.com/.../commit/abc123
// Can be removed after verification
```

Or just remove the TODO if task is fully complete (no residual work)

---

## DASHBOARD VIEW

After all TODOs are added, you can see them in VS Code:

**View > Problems**:
```
TODO [SEC-001]: Validate redirect_uri | auth.rs:100
TODO [SEC-002]: Fix coin race condition | gamification_repos.rs:197
TODO [SEC-003]: Add overflow protection | gamification_repos.rs:312
...
(145 total TODOs)
```

Filter by priority or search by task ID in Problems view.

---

## INTEGRATION WITH OTHER SYSTEMS

### Links Back to Tracker
```rust
// TODO [SEC-001]: Validate redirect_uri
// Reference: backend_security_patterns.md#oauth-redirect | Status: NOT_STARTED
```
→ Click link in PR → See task in OPTIMIZATION_TRACKER.md

### Links to Analysis
```
TODO [SEC-001]
→ backend_security_patterns.md#oauth-redirect
→ Read full issue description, roadmap, validation
```

### Links to Feature Spec
```
TODO [SEC-001]
→ MASTER_FEATURE_SPEC.md#auth-section
→ Verify implementation matches intended design
```

---

## SUCCESS CRITERIA

When Phase 1 (Code Instrumentation) is complete:

✅ All 145 tasks have TODO markers in code  
✅ All TODOs have: [TASK-ID], description, reference link, status  
✅ All files still compile without errors  
✅ OPTIMIZATION_TRACKER.md shows "TODO ADDED" for each task  
✅ Team can see all work locations in VS Code Problems view  
✅ Each TODO links to analysis document with implementation roadmap  

**Next Phase**: Phase 2 - Execute tasks following implementation roadmaps

---

*Template Created: January 15, 2026*  
*Part of: OPTIMIZATION.instructions Phase 1*  
*Next: Execute Phase 2 (systematic task execution)*
