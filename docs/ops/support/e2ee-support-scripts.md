# E2EE Support Scripts

Purpose: Provide consistent, accurate responses for encryption-related requests.

## 1) Passphrase Lost
"I can confirm your content was encrypted on your device. We do not store your passphrase, so we cannot recover encrypted data. If you want, we can delete the encrypted content or help you regain access on a device where you are still signed in and unlocked."

Notes:
- Do not ask for the passphrase.
- Offer recovery only if a device is already unlocked.
- Vault reset flow is not yet available; do not promise it.

## 2) Request to View Encrypted Content
"Encrypted content is stored as ciphertext and is not accessible to support or admins. We can help you unlock it locally in your account, but we cannot view or extract the plaintext on our end."

## 3) Legal/Compliance Request for Content
"We can provide account metadata and encrypted records, but we cannot decrypt E2EE content. If you need plaintext, it must be accessed by the user with their passphrase."

## 4) Account Deletion Request
"We can delete all account data, including encrypted content. After deletion, encrypted data cannot be recovered."

## 5) Security Incident (Possible Compromise)
"We will investigate metadata access and storage logs. Encrypted content remains unreadable without the passphrase, but we will still treat ciphertext exposure as a security incident."

## 6) Sharing or Collaboration Request
"Shared encrypted workspaces are not supported in v1/v2. We can share general product updates, but there is no secure sharing of encrypted content at this time."

