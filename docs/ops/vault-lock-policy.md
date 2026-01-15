# Vault Lock Policy

Purpose: Define when the E2EE vault is unlocked, when it auto-locks, and how clients enforce it.

## Scope
Applies to E2EE-protected content:
- Infobase
- Ideas
- Journal
- Reference Tracks (encrypted uploads)

## Core Rules
- Unlock is per device/session and never persisted to disk.
- Passphrase remains in memory only.
- Vault auto-locks when the session ends or when inactivity thresholds are met.

## Auto-Lock Triggers
- **Session end:** user logout or auth session invalidation.
- **Tab close/reload:** implicit lock (memory cleared).
- **Inactivity:** lock after 15 minutes of no interaction.
- **Background:** lock after 5 minutes while the tab is hidden.

## UX Requirements
- Show a vault banner when locked.
- Require passphrase re-entry to decrypt.
- Do not auto-unlock on refresh.

## Enforcement (Client)
- Use a shared `useVaultLockPolicy` hook in E2EE UI modules.
- Hook must:
  - Track activity to reset idle timer.
  - Lock after inactivity threshold.
  - Lock after hidden threshold.
  - Lock on `beforeunload` and logout signal if available.

## Future Extensions
- Device sleep detection (when available) to trigger immediate lock.
- Central vault state (context provider) for single unlock across modules.

