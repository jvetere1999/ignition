# Implementation Plan: Sync & Caching Improvements

## Phase 1: Differential Sync Payload (Backend)

### Files to Modify
- `app/backend/crates/api/src/routes/sync.rs` - Main polling endpoint
- `app/backend/crates/api/src/db/repos.rs` - Data fetching
- Schema: Add `last_poll_state` tracking (if needed)

### Changes
1. Create `DifferentialPayload` struct
2. Implement change detection logic
3. Store previous poll snapshot (memory-based)
4. Send only changed fields

### Estimated Impact
- **Performance**: -15-20ms per poll (change detection overhead)
- **Network**: -40-60% payload size reduction
- **Re-renders**: -70% unnecessary component updates

---

## Phase 2: Frontend Sync Merge (Next.js)

### Files to Modify
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - Update merge logic
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - Add granular hooks
- `app/frontend/src/lib/api/sync.ts` - Update response types

### Changes
1. Replace full state update with differential merge
2. Implement debounce (100ms) for batch updates
3. Create granular hooks:
   - `useProgress()` - Only progress state
   - `useBadges()` - Only badge counts
   - `useFocus()` - Only focus session
   - `usePlan()` - Only plan status
   - `useUser()` - Only user profile

### Estimated Impact
- **Re-render Reduction**: 70-80% fewer unnecessary updates
- **Memory**: No change (same data structures)
- **Developer Experience**: Cleaner component subscriptions

---

## Phase 3: Passcode Integration (Onboarding)

### New Routes
- `GET /auth/onboarding` - Show onboarding page
- `POST /auth/onboarding/passcode` - Store encrypted passcode
- `POST /auth/verify-passcode` - Validate for vault access

### New Pages
- `app/frontend/src/app/auth/onboarding/page.tsx` - Main flow
- `app/frontend/src/app/auth/onboarding/PasscodeSetup.tsx` - Passcode UI
- `app/frontend/src/app/auth/onboarding/layout.tsx` - Modal/wrapper

### Database Changes
- Add `passcode_hash` to users table (schema.json)
- Add `passcode_set_at` timestamp
- Add `passcode_attempts` counter (for rate limiting)

### User Flow
```
OAuth Callback
    ↓
Check tos_accepted
    ├─ FALSE → TOSModal
    └─ TRUE → Check passcode_hash
        ├─ NULL → Redirect to /auth/onboarding
        └─ SET → Proceed to app
```

### Security Considerations
- Hash passcode with Argon2 (bcrypt alternative)
- Rate limit verification attempts (5 tries, 15min lockout)
- Never transmit passcode in plain text
- Salt per user
- 4-6 digits enforced (numeric only)

---

## Phase 4: Testing & Validation

### Metrics to Track
- UI re-render counts (React DevTools Profiler)
- Network payload size (before/after)
- Sync latency (poll → state update time)
- User experience (subjective: no more random refreshes)

### Test Scenarios
1. Rapid XP gains (focus session completion)
2. Multiple tab polling simultaneously
3. Tab visibility toggle (hidden → visible)
4. Network slow down (3G simulation)
5. Large payload (100+ pending items)

---

## Rollout Strategy

### Week 1: Backend Only
- Deploy differential payload support
- Keep frontend on old full-update mode
- No user-facing changes

### Week 2: Frontend Gradual
- Deploy new merge logic (feature flag)
- 10% of users → 50% → 100%
- Monitor error rates and performance

### Week 3: Granular Hooks
- Optional: Replace all useSyncState() calls gradually
- Components can migrate at own pace
- No breaking changes

### Week 4: Passcode Rollout
- Enable for new users only
- Existing users: Optional prompt in settings
- Phase in: mobile → web → all devices

---

## Risk Assessment

### Low Risk
- Differential payload (backward compatible)
- Granular hooks (additive, not breaking)
- Merge logic (entirely internal)

### Medium Risk
- Passcode integration (affects auth flow)
  - Mitigation: Feature flag for rollback
  - Fallback: Bypass option for locked users

### High Risk
- None identified

---

## Success Criteria

1. ✅ UI stops randomly refreshing during normal use
2. ✅ Unchanged data doesn't cause component re-renders
3. ✅ Passcode creation flows smoothly in onboarding
4. ✅ Memory usage stays flat (no new leaks)
5. ✅ Network payload reduced by 40%+
6. ✅ Zero 403 errors on passcode verification
7. ✅ Sync latency < 100ms (unchanged from current)
