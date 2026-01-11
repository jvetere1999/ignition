# Initiative Requirements (Future Spec)

This document outlines the **MUST**, **SHOULD**, and **MAY** requirements for the upcoming Starter Engine upgrades.

## 1. Dynamic UI Scope
*   **MUST**: Apply personalization ONLY to "Quick Picks" on the Today page.
*   **MUST NOT**: Alter global navigation or static shortcuts based on personalization.
*   **MUST**: Expand selection logic to use **Frequency** + **Deterministic Sequence Transitions** (Neo4j).
*   **MUST**: Maintain a **Postgres-only fallback** that is functional and deterministic if Neo4j is unavailable.

## 2. Decision Tracking
*   **MUST**: Record a "Decision Exposure" event every time the Today page renders a decision payload.
*   **MUST**: Track Outcomes:
    *   **Prioritized**: `next_action_started` (within 5 mins).
    *   **Secondary**: `completed_action` (within 60 mins).
    *   **Negative**: `bounced` (no action < 2 mins), `dismissed_banner`.
*   **MUST**: Use outcomes to tune opportunity metrics (Ability/Opportunity), not just maximize engagement.

## 3. Personalization Signals
*   **MUST**: Use Frequency/Recency (Primary).
*   **MAY**: Use Sequence Transitions (Deterministic key-based).
*   **MAY**: Use Time-of-day optimization.
*   **MAY**: Use Goal/Habit context.
*   **MUST NOT**: Use random seeds or "bandit" algorithms without stable tie-breaking.

## 4. Determinism Policy
*   **MUST**: Be 100% deterministic. Currently identical state must yield identical UI.
*   **MUST**: Resolve all scoring ties using stable rules (e.g., Count DESC, then Alphabetical/ID ASC).
*   **MUST NOT**: Use randomness (System.Random) for ordering or selection.

## 5. Explainability Policy
*   **MAY**: Include a "Why this?" microline (e.g., "Usually done after Focus").
*   **MUST**: Keep explanations neutral and factual.
*   **MUST NOT**: Use guilt ("You haven't done this in a while"), shame, loss aversion, or manipulative gamification.

## 6. Guardrails & Modes
*   **MUST**: Maintain "Reduced Mode" and "Soft Landing" as autonomy-respecting states.
*   **SHOULD**: Collapse sections rather than hiding them completely (unless code changes explicitly requested).
*   **MUST**: Keep "Momentum Feedback" minimal and non-patronizing.

## 7. Neo4j Role & Safety
*   **MUST**: Use Neo4j as a **Read-Only Projection** for checking sequence probabilities.
*   **MUST NOT**: Store PII, Journals, or Auth Tokens in Neo4j.
*   **MUST**: Store only `user_id` and anonymized structural graph data.
*   **MUST**: Fallback gracefully to Postgres (baseline logic) if Neo4j is stale or unreachable.
