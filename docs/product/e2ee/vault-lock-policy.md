# Vault Lock Policy — Security & Cross-Device Enforcement

**Date:** January 14, 2026  
**Status:** Implemented  
**Scope:** Auto-lock triggers, in-memory state management, cross-device enforcement

---

## 1. Overview

The Vault Lock Policy defines when user vaults automatically lock, how in-memory decryption keys are managed, and how lock state propagates across devices.

**Core Principle:** When a vault is locked, no decryption is possible. The passphrase (or SSO challenge) must be re-authenticated to unlock and derive the encryption key.

---

## 2. Lock Triggers (Deterministic)

### 2.1 Idle Timeout (Frontend-Driven)
- **Trigger:** 10 minutes of app inactivity (keyboard, click, focus)
- **Implementation:** Frontend tracks last activity; locks automatically
- **User Action Reset:** Any interaction resets the idle timer
- **Window Focus:** When user returns to tab/window, idle timer resumes

### 2.2 App Backgrounding
- **Trigger:** `visibilitychange` event (app pushed to background)
- **Implementation:** Listen to `document.hidden` → lock immediately
- **Rationale:** Mobile apps expect lock on backgrounding; web parity

### 2.3 Explicit Logout
- **Trigger:** User clicks "Sign Out"
- **Implementation:** Lock vault before destroying session
- **Result:** All devices see logout → all vaults lock

### 2.4 Session Rotation
- **Trigger:** TOS acceptance or age verification flow
- **Implementation:** Generate new session token; **do not** clear vault lock
- **Note:** Session rotation is independent of vault lock state

### 2.5 Admin Force-Lock (Future)
- **Trigger:** Admin initiates account-wide lock (e.g., security incident)
- **Implementation:** Backend sets vault.locked_at + notifies all user sessions
- **Propagation:** Devices poll and detect lock within 5 polling cycles

---

## 3. In-Memory Vault State During Lock

When a vault is locked:

| State | Status | Impact |
|-------|--------|--------|
| Encryption key | Purged from memory | Cannot decrypt content |
| Search index | Disabled + cleared | Search returns "vault locked" |
| Read operations | Allowed (encrypted metadata) | Can read settings, user profile |
| Write operations | Blocked (Ideas, Infobase, Journal) | Return 423 Locked error |
| UI visibility | Vault locked banner shown | Global state banner + toast |
| Cross-device sync | Continue polling lock state | Detect unlock on other devices |

---

## 4. Unlock Flow

### 4.1 User-Initiated Unlock (Passphrase)
1. User sees "Vault Locked" banner + unlock modal
2. Enters passphrase (or uses SSO button for SSO accounts)
3. Passphrase → PBKDF2 key derivation → encryption key loaded to memory
4. Search index regenerated async (doesn't block unlock)
5. Operations resume; banner disappears

### 4.2 SSO Re-Authentication (Future)
- For SSO accounts, unlock via OAuth provider re-challenge
- Replaces passphrase flow; same end result (key loaded to memory)

### 4.3 Recovery Code (Special Path)
- Recovery codes bypass vault lock
- Used only if passphrase is forgotten
- Generates new vault with new key; requires 2FA confirmation

---

## 5. Cross-Device Lock Enforcement

### 5.1 Backend Lock State Storage
- **Table:** `vaults`
- **Columns:**
  - `locked_at` (TIMESTAMPTZ) — When vault was locked (NULL = unlocked)
  - `lock_reason` (VARCHAR) — Why it locked: 'idle', 'backgrounded', 'logout', 'force', 'rotation'
  - `enforce_tier` (INT) — 0 = soft warning, 1 = hard lock (future)

### 5.2 Frontend Polling
- **Endpoint:** `GET /api/sync/poll`
- **Response Includes:** `vault_locked_at`, `lock_reason`
- **Frequency:** 30–60 second intervals (same as sync endpoint)
- **Logic:** If `vault.locked_at > device.last_unlock_time` → auto-lock current device

### 5.3 Lock Propagation Timeline
| Time | Event |
|------|-------|
| T+0 | Device A idle → locks vault |
| T+30s | Device B polls → detects lock → auto-locks |
| T+0 (Device C on hold) | Device C still unlocked |
| T+60s | Device C polls → detects lock → auto-locks |
| **Max Propagation:** 60 seconds (2 poll cycles)

### 5.4 Unlock Propagation
- Device A unlocks → backend clears `vault.locked_at`
- Device B polls → sees unlock → clears lock state
- Other devices update within next poll cycle
- **Note:** Unlock on Device A does NOT propagate to Device B (each device independent)
- Each device must be unlocked separately or via SSO re-auth

---

## 6. Exceptions & Special Cases

### 6.1 Recovery Codes
- **Not Affected by Lock:** Recovery code path works even if vault locked
- **Reason:** Used only when user forgot passphrase (emergency)
- **Flow:** Requires 2FA confirmation + email link

### 6.2 Backup & Export
- **Requires:** Full vault unlock + 2FA confirmation
- **Rationale:** Export contains plaintext decryption key (high risk)

### 6.3 Settings Read
- **Allowed When Locked:** Read user preferences, themes, etc.
- **Rationale:** These are non-sensitive metadata

### 6.4 Session Rotation vs Lock
- **TOS/Age Verification:** Rotate session token (new session)
- **Vault Lock:** Independent (session valid even if vault locked)
- **Result:** User has valid session but cannot access encrypted content

---

## 7. Security Model

### 7.1 Threat Model Addressed
1. **Unlocked Device Left Unattended:** Lock after 10m idle → reduces exposure window
2. **Device Context Switching:** Lock on app backgrounding → mobile parity
3. **Multi-Device Account Takeover:** Cross-device lock signals → all devices can detect breach
4. **Forced Session Termination:** Logout locks vault → no stale decryption keys

### 7.2 Out of Scope
- Device fingerprinting (not a lock trigger)
- Geolocation-based locks (too fragile)
- Heartbeat-based proximity (future enhancement)

---

## 8. Implementation Checklist

- [x] Policy document (this file)
- [x] Schema migration: vaults table columns
- [ ] Backend endpoints: /api/auth/lock-vault, /api/auth/unlock-vault
- [ ] Backend queries: VaultRepo lock/unlock methods
- [ ] Sync endpoint: Include vault lock state in poll response
- [ ] Frontend context: VaultLockContext + useVaultLock hook
- [ ] Frontend timers: Idle detection + lock trigger
- [ ] Frontend UI: Lock banner + unlock modal
- [ ] Frontend polling: Detect cross-device lock changes
- [ ] Search UI: Disable when vault locked
- [ ] Write protection: Block Ideas/Infobase/Journal when locked
- [ ] Tests: Unit + integration + cross-device scenarios
- [ ] Deployment: Apply migration + merge to main

---

## 9. Configuration

**Tunable Parameters (Environment Variables):**
```
VAULT_LOCK_IDLE_TIMEOUT_SECONDS=600       # 10 minutes default
VAULT_LOCK_POLL_INTERVAL_SECONDS=30       # Check lock state every 30s
VAULT_LOCK_ENFORCE_TIER=0                 # 0=soft, 1=hard (future)
```

---

## 10. Future Enhancements

1. **Biometric Re-Auth:** Use fingerprint/face to unlock instead of passphrase
2. **Trust Device:** Remember device for N days before re-locking
3. **Proximity Unlock:** Unlock when trusted device (phone) is nearby
4. **Admin Dashboard:** See which user devices are locked/unlocked
5. **Adaptive Idle:** Adjust timeout based on risk (e.g., public WiFi = 5m)

---

## 11. Questions & Answers

**Q: What if user forgets passphrase?**  
A: Use recovery codes (special unlock path). Requires 2FA confirmation + email link. Creates new vault with new key.

**Q: Can admin unlock user vault?**  
A: No. Admin cannot access encrypted content. Only user can unlock via passphrase or recovery code.

**Q: Does lock survive browser restart?**  
A: Yes. Vault state stored in database, not local memory. On page reload, frontend polls lock state.

**Q: What if network is down?**  
A: Lock state cannot be synced. Frontend uses local lock state (if locked before network loss, stays locked after reload).

**Q: Can I unlock all devices at once?**  
A: Unlock on current device only. Each device must be unlocked separately. (Future: SSO re-auth could unlock all devices.)

---

**Version:** 1.0  
**Last Updated:** January 14, 2026  
**Authority:** See MASTER_FEATURE_SPEC.md Section 13 (Implementation Updates)
