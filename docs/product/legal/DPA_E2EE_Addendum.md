# Data Processing Addendum (E2EE Addendum)

**Status:** Draft
**Purpose:** Align legal/process language with end-to-end encryption (E2EE) behavior.

## 1. Scope
This addendum applies to user IP content encrypted client-side, including:
- Infobase entries
- Ideas
- Journal entries
- Reference Tracks marked for encryption

## 2. Roles
- Customer/User: Data Controller for encrypted content.
- Company: Data Processor for storage, synchronization, and metadata processing.

## 3. Processing Activities
- Store encrypted content (ciphertext) at rest.
- Sync encrypted content across user devices.
- Process non-content metadata required to operate the Service.

## 4. Encryption & Access Limitations
- Encrypted content is encrypted on the client before upload.
- The Company does not store user passphrases and cannot decrypt encrypted content.
- Support/admin access is limited to metadata and ciphertext only.

## 5. Subprocessors
- Storage providers may store ciphertext and metadata.
- Subprocessors do not receive decryption keys or passphrases.

## 6. Data Subject Requests
- We can delete encrypted content on request.
- We cannot provide plaintext access to encrypted content.
- We can provide encrypted exports (ciphertext) upon request.

## 7. Incident Response
- Treat any exposure of ciphertext as a security incident.
- Investigate metadata exposure separately from encrypted content.

## 8. Retention
- Encrypted content is retained until user deletion or account deletion.
- Metadata retention follows the general retention policy.

