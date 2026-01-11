# Current Telemetry

## Status: Gap / Minimal

Currently, the Starter Engine does **not** adhere to a strict structured logging schema for "Decision Exposure" or "Outcomes".

*   **Existing Tracking**: Standard page views (client-side) via global analytics (if configured).
*   **Verification**: A search of `app/frontend/src/app/(app)/today` revealed **zero** explicit calls to `track()` or analytics providers for specific component visibility.
*   **Gap**: No server-side recording of the `Decision Payload` generation.
*   **Gap**: No explicit correlation between "What was shown" (Exposure) and "What was clicked" (Outcome).

## Planned Implementation

See [Future Spec: Telemetry & Measurement](FUTURE_SPEC/TELEMETRY_SPEC.md) for requirements to close this gap.
