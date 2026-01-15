# CryptoPolicy

**Policy Version:** 1
**Status:** Active

## Purpose
Define the cryptographic posture used for E2EE content and the conditions under which upgrades occur.

## Policy v1 (Current)
- **Cipher:** AES-256-GCM
- **KDF:** PBKDF2-HMAC-SHA256
- **Iterations:** 100,000
- **Salt length:** 16 bytes
- **IV length:** 12 bytes
- **Auth tag:** 16 bytes (GCM)

## Storage Metadata
- `crypto_policy_version` is stored in `vault_metadata` per user.
- Content encrypted under this policy should carry `encryption_version` in payload metadata when available.

## Migration Triggers
- Cipher or KDF changes (e.g., PBKDF2 → Argon2id).
- Format or metadata changes that affect decryption.
- Key length or IV/tag length changes.

## Migration Strategy
- Introduce new policy version with explicit decoder support.
- Migrate on user unlock (client-side re-encrypt).
- Maintain backward decryption until migration completes.

## Non-Goals
- Server-side decryption or key custody.
- Silent or background migration without user unlock.

