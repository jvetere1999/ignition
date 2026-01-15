# Cryptographic Policy & Algorithm Versioning

**Status:** Baseline (Version 1)  
**Effective Date:** January 2026  
**Last Updated:** January 14, 2026  
**Document Type:** Policy & Technical Reference  
**Audience:** Developers, Security Team, Auditors

---

## 1. Executive Summary

This document establishes the cryptographic standards, algorithms, and versioning scheme for Passion OS E2EE (End-to-End Encryption). It enables safe evolution of encryption schemes without breaking existing user data or security.

**Key Principles:**
- **Algorithm Agility:** Crypto can be updated without requiring immediate user action
- **Versioning First:** All crypto operations are versioned; old versions coexist during migrations
- **Explicit Deprecation:** Old versions have explicit end-of-life dates and migration windows
- **Audit Trail:** All crypto policy changes are tracked with effective dates and rationale

---

## 2. Current Crypto Standards (Policy Version 1)

### 2.1 Vault Encryption

**Algorithm:** AES-256-GCM  
**Mode:** Galois/Counter Mode (authenticated encryption)  
**Key Length:** 256 bits (32 bytes)  
**IV/Nonce:** 96 bits (12 bytes), randomly generated per operation  
**Authentication Tag:** 128 bits (16 bytes)  
**AAD (Additional Authenticated Data):** User ID + vault version

**Rationale:**
- Industry-standard authenticated encryption
- Single-pass operation (performance + security)
- No external MAC needed (authentication built-in)
- Nonce length matches RFC 5116 recommendations

**Implementation:**
```typescript
// Frontend (libsodium.js or Web Crypto API)
const cipher = crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: nonce },
  key,
  plaintext
);

// Backend (Rust ring/aes-gcm)
let cipher = Aes256Gcm::new(&key);
let ciphertext = cipher.encrypt(&nonce, aad_slice)?;
```

---

### 2.2 Key Derivation

**Algorithm:** PBKDF2-SHA256  
**Hash Function:** SHA-256  
**Iterations:** 100,000 (updated January 2026)  
**Salt Length:** 32 bytes (256 bits)  
**Key Output:** 32 bytes (256 bits)

**Rationale:**
- NIST-approved key derivation function
- SHA-256 provides collision resistance
- 100,000+ iterations resist brute force (~100ms per attempt)
- Salt prevents rainbow table attacks

**Historical:** v0.1 used 10,000 iterations; upgraded to 100,000 for better resistance

**Implementation:**
```typescript
// Frontend (libsodium.js)
const salt = sodium.randombytes(32);
const key = sodium.crypto_pwhash(
  sodium.crypto_box_SEEDBYTES,
  passphrase,
  salt,
  sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
  sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
);

// Backend (Rust argon2/pbkdf2)
let key = pbkdf2_sha256(passphrase, &salt, 100_000);
```

---

### 2.3 Vault Passphrase Hashing

**Algorithm:** PBKDF2-SHA256 (same as key derivation)  
**Purpose:** Validate passphrase without storing plaintext  
**Stored:** Hash of derived key (not passphrase directly)

**Flow:**
```
User Passphrase → PBKDF2 → Vault Key (for encryption/decryption)
                         → Hash this key → Compare for validation
```

**Rationale:**
- Prevents passphrase recovery even if db compromised
- Single "proof of knowledge" - user can unlock without revealing passphrase
- Aligns with vault unlock flow

---

### 2.4 Transport Security

**Protocol:** TLS 1.3 (minimum)  
**Certificate:** mTLS where applicable (backend-to-backend)  
**HSTS:** Enabled (max-age: 31536000 seconds / 1 year)

**Rationale:**
- TLS 1.3 removes known vulnerabilities (1.2 deprecated)
- Forward secrecy via ephemeral Diffie-Hellman
- Perfect forward secrecy for session keys

---

### 2.5 Session Management

**Session Token:** 256-bit random (libsodium.randombytes)  
**Rotation:** Every 24 hours (or on logout)  
**Storage:** httpOnly, Secure, SameSite=Strict cookies  
**Cross-Device Sync:** Via encrypted vault state, not session state

**Rationale:**
- Random generation prevents guessing
- Regular rotation limits window of compromise
- httpOnly prevents XSS token theft
- Vault state is source of truth (not session)

---

## 3. Versioning Scheme

### 3.1 CryptoPolicy Version (This Document)

**Format:** Semantic versioning (Major.Minor.Patch)

- **Major:** Algorithm change (e.g., AES-256-GCM → ChaCha20-Poly1305)
- **Minor:** Parameter tuning (e.g., iterations 100k → 150k)
- **Patch:** Documentation/implementation clarification (no behavioral change)

**Current:** 1.0.0

**Schema Storage:**
```sql
CREATE TABLE vault_crypto_policies (
  version VARCHAR(10) PRIMARY KEY,
  algorithm VARCHAR(50),           -- 'AES-256-GCM', 'ChaCha20-Poly1305'
  kdf_algorithm VARCHAR(50),       -- 'PBKDF2-SHA256', 'Argon2id'
  kdf_iterations INT,              -- 100000
  kdf_memory_mb INT,               -- NULL for PBKDF2, needed for Argon2
  tls_minimum VARCHAR(10),         -- 'TLS1.3'
  effective_date TIMESTAMPTZ,
  deprecated_date TIMESTAMPTZ,     -- NULL for current
  migration_deadline TIMESTAMPTZ,  -- When old version is no longer accepted
  rationale TEXT
);
```

---

### 3.2 Per-Vault Versioning

**Schema Addition:**
```sql
ALTER TABLE vaults ADD COLUMN crypto_policy_version VARCHAR(10);
ALTER TABLE vaults ADD COLUMN last_rotated_at TIMESTAMPTZ;
ALTER TABLE vaults ADD COLUMN next_rotation_due TIMESTAMPTZ;
```

**Semantics:**
- `crypto_policy_version`: Policy version used when vault was created/rotated
- `last_rotated_at`: When crypto was last upgraded
- `next_rotation_due`: When user should be notified to rotate

**Migration:**
- All existing vaults: Set `crypto_policy_version = '1.0.0'`
- New vaults: Default to current policy version

---

## 4. Cryptographic Operations

### 4.1 Encrypt Vault Content

**Input:**
- Plaintext (user data)
- Vault key (derived from passphrase)
- Additional authenticated data (user_id, policy version)

**Process:**
1. Generate random 96-bit nonce
2. AES-256-GCM encrypt with vault key + nonce + AAD
3. Prepend policy version + nonce to ciphertext
4. Return: `[policy_version (1 byte)] [nonce (12 bytes)] [ciphertext] [tag (16 bytes)]`

**Backend Implementation (Rust):**
```rust
fn encrypt_vault_data(
    plaintext: &[u8],
    vault_key: &[u8; 32],
    user_id: &str,
    policy_version: &str,
) -> Result<Vec<u8>> {
    let nonce = Nonce::from_slice(&rand::thread_rng().gen::<[u8; 12]>());
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(vault_key));
    
    let aad = format!("{}:v{}", user_id, policy_version);
    let ciphertext = cipher.encrypt(nonce, aad.as_ref() + plaintext)?;
    
    // Prepend policy version (1 byte) + nonce (12 bytes)
    let mut result = vec![parse_version(policy_version)];
    result.extend_from_slice(nonce.as_slice());
    result.extend(ciphertext);
    
    Ok(result)
}
```

**Frontend Implementation (TypeScript):**
```typescript
async function encryptVaultData(
  plaintext: Uint8Array,
  vaultKey: Uint8Array,
  userId: string,
  policyVersion: string
): Promise<Uint8Array> {
  const nonce = sodium.randombytes(12);
  const aad = sodium.from_string(`${userId}:v${policyVersion}`);
  
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, vaultKey);
  
  const result = new Uint8Array(1 + 12 + ciphertext.length);
  result[0] = parseVersion(policyVersion);
  result.set(nonce, 1);
  result.set(ciphertext, 13);
  
  return result;
}
```

### 4.2 Decrypt Vault Content

**Input:** Encrypted blob from 4.1

**Process:**
1. Extract policy version (first byte)
2. Extract nonce (bytes 1-12)
3. Extract ciphertext (remainder)
4. Load appropriate crypto algorithm for policy version
5. AES-256-GCM decrypt with vault key + nonce + AAD
6. Return plaintext

**Policy-Aware Decryption:**
```rust
fn decrypt_vault_data(
    encrypted: &[u8],
    vault_key: &[u8; 32],
    user_id: &str,
) -> Result<Vec<u8>> {
    // Extract version
    let version_byte = encrypted[0];
    let policy_version = version_to_string(version_byte); // '1.0.0', etc.
    
    // Validate version is supported
    let policy = get_policy(&policy_version)?;
    
    // Extract nonce + ciphertext
    let nonce = Nonce::from_slice(&encrypted[1..13]);
    let ciphertext = &encrypted[13..];
    
    // Decrypt
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(vault_key));
    let aad = format!("{}:v{}", user_id, policy_version);
    let plaintext = cipher.decrypt(nonce, aad.as_ref() + ciphertext)?;
    
    Ok(plaintext)
}
```

---

## 5. Key Derivation Flow

### 5.1 On Vault Creation

**Input:** User passphrase, desired policy version  
**Output:** Vault key, passphrase hash (stored)

```
Passphrase + Salt → PBKDF2-SHA256 (100k iterations) → Key
                                                    → Hash → Store in DB
```

**Schema:**
```sql
INSERT INTO vaults (
  id, user_id, passphrase_salt, passphrase_hash,
  key_derivation_params, crypto_policy_version,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, NOW()
);
```

### 5.2 On Vault Unlock

**Input:** User enters passphrase

```
Passphrase + Salt (from DB) → PBKDF2-SHA256 (100k iterations) → Derived Key
                                                               → Hash
Compare Hash vs DB Hash → If match: unlock; load vault data
```

---

## 6. Algorithm Deprecation & Migration

### 6.1 Deprecation Process

**Timeline:**
1. **Phase 1 (Announcement):** New policy published; users notified
2. **Phase 2 (Coexistence):** Old + new versions both accepted (6-12 months)
3. **Phase 3 (Enforcement):** Only new version accepted; unlock triggers migration
4. **Phase 4 (Sunset):** Old data inaccessible after X years

**Example (Hypothetical):**

| Date | Event | Old Version | New Version | Status |
|------|-------|----------|----------|--------|
| 2026-01-14 | Baseline published | - | 1.0.0 (AES-256-GCM, 100k) | Current |
| 2028-01-14 | Announce ChaCha20 | 1.0.0 deprecated | 2.0.0 (ChaCha20-Poly1305, 150k) | Both accepted |
| 2029-01-14 | Enforcement begins | 1.0.0 triggers migration | 2.0.0 required for new ops | Migration window |
| 2035-01-14 | Sunset | 1.0.0 no longer accessible | 2.0.0 only | Legacy data lost |

### 6.2 Migration Trigger

**Automatic Migration on Unlock:**
```rust
fn unlock_and_migrate(passphrase: &str, vault: &Vault) -> Result<VaultKey> {
  // 1. Derive key using vault's current policy version
  let key = derive_key(passphrase, &vault.passphrase_salt, &vault.crypto_policy_version)?;
  
  // 2. Load vault content
  let decrypted = decrypt_vault_data(&vault.encrypted_blob, &key, &vault.user_id)?;
  
  // 3. Check if migration needed
  let current_policy = get_current_policy();
  if vault.crypto_policy_version < current_policy.version {
    // 4. Re-encrypt with new policy
    let new_encrypted = encrypt_vault_data(
      &decrypted,
      &key,
      &vault.user_id,
      &current_policy.version
    )?;
    
    // 5. Update vault metadata
    update_vault_version(vault.id, &current_policy.version, NOW())?;
    
    // 6. Notify user (optional banner)
    notify_user_crypto_upgraded(vault.user_id)?;
  }
  
  Ok(VaultKey { key, policy_version: current_policy.version })
}
```

---

## 7. Security Considerations

### 7.1 Threats & Mitigations

| Threat | Attack Vector | Mitigation |
|--------|--------|--------|
| **Brute Force (Passphrase)** | Attacker tries 10^12 passphrases | PBKDF2 100k iterations (~100ms each) = infeasible |
| **Rainbow Tables** | Precomputed hash tables | Random 256-bit salt per vault → unique hashes |
| **Weak Passphrases** | User chooses guessable passphrase | ZXCVBN entropy check (frontend) + min 12 chars |
| **Key Exposure** | Private key leaked via memory | Keys only in RAM during unlock; cleared on lock |
| **Replay Attacks** | Attacker retransmits old encrypted blob | Nonce changes per operation + TLS prevents replay |
| **IV Reuse** | Same nonce+key used twice | 96-bit nonce, random per operation → ~2^48 operations before collision |
| **Algorithm Weakness** | AES-256-GCM broken | Migration path to ChaCha20 or stronger; no hard-coded algorithm |
| **Timing Attacks** | Attacker measures unlock time | Constant-time comparison in passphrase verification |

### 7.2 Key Rotation

**Current:** No automatic rotation (manual via unlock)  
**Future (v2.0):** Optional time-based rotation (e.g., annually)

**Rationale:**
- Reduces impact if single key compromised
- Requires re-encryption of all data
- Expensive operation (batched via background job)

---

## 8. Compliance & Standards

### 8.1 Standards Referenced

- **NIST SP 800-38D:** GCM Authenticated Encryption
- **NIST SP 800-132:** PBKDF2 Password-Based Key Derivation
- **RFC 5116:** AEAD Interface
- **RFC 8439:** ChaCha20 and Poly1305 (future algorithm candidate)
- **OWASP:** Cryptographic Cheat Sheet

### 8.2 Audit Trail

All crypto operations logged (non-sensitive fields only):
```sql
INSERT INTO crypto_audit_log (
  user_id, operation, policy_version, result, timestamp
) VALUES (
  'user-123', 'unlock', '1.0.0', 'success', NOW()
);
```

---

## 9. Implementation Roadmap

### Phase 1: Baseline (✅ Complete - January 2026)
- [x] AES-256-GCM for vault encryption
- [x] PBKDF2-SHA256 (100k iterations) for key derivation
- [x] TLS 1.3 for transport
- [x] Passphrase salt + hash storage
- [x] Policy versioning schema

### Phase 2: Monitoring (Q2 2026)
- [ ] Add crypto audit logs
- [ ] Monitor KDF iteration performance
- [ ] Track unlock times
- [ ] Monitor key derivation memory usage

### Phase 3: Enhanced Rotation (Q3 2026)
- [ ] Optional time-based key rotation UI
- [ ] Background re-encryption jobs
- [ ] Migration to Argon2id (more resistant to GPU attacks)

### Phase 4: Algorithm Agility (Q4 2026)
- [ ] Support ChaCha20-Poly1305 as alternative
- [ ] Automatic migration on next unlock
- [ ] Deprecation of PBKDF2 (sunset 2027)

---

## 10. FAQ

**Q: Why AES-256-GCM instead of ChaCha20-Poly1305?**  
A: Both are secure. AES-256-GCM has hardware acceleration (AES-NI) on most CPUs; ChaCha20 is better on older systems. We support both in policy versioning.

**Q: Can I export my vault?**  
A: Not currently. Vault is tied to passphrase derivation. Export would require decryption (requires unlock) + re-encryption with user's chosen key.

**Q: What if I forget my passphrase?**  
A: Vault is permanently inaccessible. No recovery without passphrase (by design). Recovery codes planned for v2.0.

**Q: How often should I rotate my passphrase?**  
A: No requirement, but recommended annually if passphrase may be compromised.

**Q: Can you decrypt my vault?**  
A: No. Backend never sees plaintext. Even with admin access, encrypted blob + hash are useless without passphrase.

**Q: What happens if I unlock on Device A, then lock on Device B?**  
A: Both devices see lock state via `/api/sync/poll` polling. Device A operations blocked. Lock persists across sessions.

**Q: Is my vault encrypted at rest on the server?**  
A: Yes. All encrypted data in PostgreSQL. Backup encryption handled by infrastructure (RLS, disk encryption).

**Q: Can I use the same passphrase on multiple accounts?**  
A: Yes, but not recommended (if one account compromised, others at risk). Each account has independent vault + salt.

---

## 11. References

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Threat Modeling Guide](https://owasp.org/www-project-threat-modeling/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [libsodium Documentation](https://doc.libsodium.org/)
- [Rust Ring Documentation](https://docs.rs/ring/)

---

**Document Status:** Approved ✅  
**Review Cycle:** Annually (or before algorithm change)  
**Next Review Date:** January 2027
