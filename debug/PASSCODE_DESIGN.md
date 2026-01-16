# Passcode System Design

## Overview
A 4-6 digit numeric PIN integrated into the onboarding flow that serves as a second factor for sensitive operations (vault access, data exports, account recovery).

## User Journey

### New User Path
```
1. Complete OAuth login
2. See TOSModal (TOS + age verification checkboxes)
3. Accept TOS
4. Redirect to /auth/onboarding
5. OnboardingFlow renders:
   a. Welcome screen (brief intro)
   b. PasscodeSetup component:
      - Create 4-6 digit PIN
      - Confirm PIN entry
      - Security notes
   c. Completion confirmation
6. Passcode stored (encrypted)
7. Redirect to /today
```

### Existing User Path
- No changes initially
- Future: Optional setup in Settings > Security

## Database Schema Changes

### Add to users table (schema.json)
```json
{
  "passcode_hash": {
    "type": "TEXT",
    "nullable": true,
    "description": "Argon2 hash of user's 4-6 digit passcode"
  },
  "passcode_set_at": {
    "type": "TIMESTAMPTZ",
    "nullable": true,
    "description": "When passcode was created/last modified"
  },
  "passcode_attempts": {
    "type": "INTEGER",
    "nullable": false,
    "default": 0,
    "description": "Failed verification attempts (resets on success)"
  },
  "passcode_locked_until": {
    "type": "TIMESTAMPTZ",
    "nullable": true,
    "description": "Lockout until this time if > 5 failed attempts"
  }
}
```

## Backend Endpoints

### 1. POST /auth/onboarding/passcode
**Purpose**: Store new passcode during onboarding

**Request**:
```json
{
  "passcode": "123456",
  "confirmation": "123456"
}
```

**Validation**:
- Both match exactly
- 4-6 digits, numeric only
- Not sequential (123456 rejected)
- Not repeated (111111 rejected)
- Not previously used (past 5 passcodes)

**Response**:
```json
{
  "success": true,
  "message": "Passcode set successfully"
}
```

**Errors**:
- 400: Invalid format
- 409: Passcode already set
- 429: Rate limited

### 2. POST /auth/verify-passcode
**Purpose**: Verify passcode for sensitive operations

**Request**:
```json
{
  "passcode": "123456"
}
```

**Validation**:
- Compare against hash using Argon2
- Check if user locked (too many failures)
- Increment attempt counter on failure
- Lock after 5 failures (15 min cooldown)

**Response**:
```json
{
  "valid": true,
  "token": "short-lived-verification-token"
}
```

**Errors**:
- 401: Invalid passcode
- 429: User locked (too many attempts)
- 403: Passcode not set

### 3. GET /auth/onboarding
**Purpose**: Check if user needs to complete onboarding

**Response**:
```json
{
  "needs_onboarding": true,
  "reason": "passcode_required",
  "tos_accepted": true,
  "passcode_set": false
}
```

## Frontend Components

### app/frontend/src/app/auth/onboarding/page.tsx
```typescript
export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!user?.tosAccepted) {
    return <TOSModal onAccept={() => /* refresh */} />;
  }

  if (user.passcode_set) {
    router.replace('/today');
    return null;
  }

  return <OnboardingFlow />;
}
```

### app/frontend/src/components/auth/PasscodeSetup.tsx
```typescript
interface PasscodeSetupProps {
  onComplete: () => void;
}

export function PasscodeSetup({ onComplete }: PasscodeSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [passcode, setPasscode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!isValidPasscode(passcode)) {
      setError('Must be 4-6 digits');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (passcode !== confirmation) {
      setError('Passcodes do not match');
      return;
    }

    const response = await safeFetch(
      `${API_BASE_URL}/auth/onboarding/passcode`,
      {
        method: 'POST',
        body: JSON.stringify({ passcode, confirmation })
      }
    );

    if (response.ok) {
      onComplete();
    } else {
      setError('Failed to save passcode');
    }
  };

  // ... UI with numeric keypad
}
```

## Security Measures

### 1. Hashing
- Algorithm: Argon2id (OWASP recommended)
- Cost: t=2, m=19 (moderate security/speed tradeoff)
- Salt: Cryptographically random per user

### 2. Rate Limiting
- Max 5 attempts per 15 minutes
- Auto-unlock after 15 min delay
- Log each failed attempt for audit trail

### 3. Transmission
- HTTPS only (enforced by middleware)
- POST body (not query param)
- Never logged in plain text
- No passcode in auth tokens

### 4. Storage
- Hashed only (never plaintext)
- Separate from session token
- Different crypto than password hash
- Rotation possible (old hashes retained for 90 days)

### 5. Verification Context
- Passcode only valid for 1-5 minutes after verification
- User activity logging (which sensitive operations)
- Audit trail of all verification attempts

## Integration Points

### Vault Access
```typescript
// Before unlocking vault
const verified = await verifyPasscode(userPasscode);
if (verified) {
  unlockVault();
}
```

### Account Recovery
```typescript
// If 2FA fails and user has passcode
const canRecoverWithPasscode = user.passcode_set && !user.two_factor_enabled;
if (canRecoverWithPasscode) {
  showPasscodeRecoveryFlow();
}
```

### Data Export
```typescript
// Before exporting sensitive data
const token = await getPasscodeVerificationToken();
exportData(token);
```

## Future Enhancements

1. **Recovery Codes**: Backup codes in case user forgets passcode
2. **Rotation**: Option to change passcode periodically
3. **Backup Passcodes**: Multiple passcodes for different devices
4. **Biometric Alternative**: Face/fingerprint instead of typing
5. **WebAuthn**: Hardware key support

## Testing

### Unit Tests
- Valid/invalid passcode formats
- Hash verification
- Rate limiting logic
- Lockout expiration

### Integration Tests
- Onboarding flow completion
- Vault unlock with correct/incorrect passcode
- Rate limit enforcement
- Session state after verification

### Security Tests
- Timing attack resistance (consistent hash time)
- Brute force protection (rate limiting)
- Session hijacking prevention
- Passcode not exposed in logs
