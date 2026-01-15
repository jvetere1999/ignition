# E2EE Claims Checklist

Purpose: Ensure all product, support, and legal statements about encryption are accurate and consistent.

## Claims We Can Make
- Client-side encryption is used for user IP (Infobase, Ideas, Journal, Reference Tracks).
- Encryption uses AES-256-GCM with PBKDF2-derived keys (current policy).
- The server stores ciphertext and cannot decrypt user content without the passphrase.
- Support/admin tools display encrypted records as opaque.

## Claims We Must Avoid
- "We can recover your encrypted data if you lose your passphrase."
- "We can view or restore encrypted content on request."
- "Encryption protects all metadata" (titles/tags are plaintext unless explicitly marked private).

## Support Guidelines
- Never request passphrases or plaintext from users.
- Provide a vault reset path that destroys encrypted content (if/when implemented).
- Confirm whether content is encrypted before troubleshooting.

## Legal/Policy Alignment Required
- Privacy policy: explicitly state encrypted content is not accessible to admins.
- DPA/Security docs: define encryption scope and limitations.
- Support scripts: include clear disclaimers about recovery limitations.

## Operational Requirements
- Admin UI: show an "Encrypted content: opaque" banner for E2EE records.
- Logs/telemetry: do not capture ciphertext or private content.
- Incident response: treat passphrase loss as unrecoverable for encrypted data.

