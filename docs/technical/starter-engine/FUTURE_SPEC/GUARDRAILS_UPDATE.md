# Guardrails Update

## Safety Protocols

### 1. Determinism Enforcement
*   **Tests**: Unit tests must verify that `f(UserState) -> DecisionPayload` is idempotent.
*   **Audit**: Any change to ranking logic must be regression tested against a stable set of user profiles.

### 2. Manipulation Prevention
*   **Review**: "Why This" copy must undergo behavioral design review to ensure neutrality.
*   **Forbidden Patterns**:
    *   False Scarcity ("Only 2 hours left!").
    *   Loss Aversion ("You'll lose your progress").
    *   Social Pressure ("Everyone else is doing X").

### 3. Reduced Mode Integrity
*   **Rule**: Reduced Mode must strictly *reduce* cognitive load.
*   **Invariant**: The number of visible top-level items in Reduced Mode must be <= 50% of Standard Mode (or fixed cap, e.g., max 3 items).
*   **Override**: User must always have a "Show All" or "View Full Plan" toggle (Autonomy).

### 4. Telemetry Privacy
*   **Outcome Tracking**: Must not track distinct action titles if they contain private user text. Use mapped generic IDs where possible.
