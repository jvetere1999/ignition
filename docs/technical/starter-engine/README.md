# Starter Engine Overview

The **Starter Engine** is the decisioning system that populates the **Today** page. It transforms raw user state (habits, plans, focus history) into a prioritized, actionable dashboard.

## Core Philosophy

1.  **Server-Driven Autonomy**: The server decides *what* to show (content, priority, defaults), but the user decides *what to do*. The frontend is a dumb renderer of server decisions.
2.  **Determinism**: Given the same user state, the Engine must produce the exact same layout and recommendations. No randomness is permitted.
3.  **Privacy-First**: Personalization is computed from local data or anonymized aggregates. No PII is sent to external decisioning services (Neo4j usage is projection-only).
4.  **Reduced by Default**: To prevent decision paralysis, the interface defaults to showing *less* (Reduced Mode) rather than more, expanding only when the user has momentum.

## Feature Status

All Starter Engine features are currently **enabled by default** in the core platform. Legacy feature flags exist for compatibility but return `true`.

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Decision Suppression** | Active | Collapses sections based on user state (e.g., "Reduced Mode"). |
| **Next Action Reolver** | Active | Determines the single most important "Starter Block" action. |
| **Dynamic UI** | Active | Reorders "Quick Picks" based on available tasks (Postgres-based). |
| **Soft Landing** | Active | Enters Reduced Mode after completing a session to prevent fatigue. |
| **Momentum Feedback** | Active | Minimal feedback banners. |

## Architecture High-Level

The system operates as a **single-pass request**:

1.  **Frontend** requests `/api/today`.
2.  **Backend** (`today.rs`) aggregates data from `daily_plans`, `focus_sessions`, `habits`, `quests`.
3.  **Backend** computes `UserState` (Reduced Mode triggers, First Day flags).
4.  **Backend** computes `DynamicUIData` (Quick Picks based on counts/recency).
5.  **Frontend** renders the `Decision Payload` strictly.
6.  **Frontend** manages session-scoped `Soft Landing` state via `sessionStorage`.

## Documentation Map

*   [**Current Dataflow**](DATAFLOW.md) - End-to-end request/render lifecycle.
*   [**Architecture & Code**](ARCHITECTURE.md) - Code locations and component tree.
*   [**Decision Payload**](DECISION_PAYLOAD.md) - The JSON contract between Backend and Frontend.
*   [**Telemetry**](TELEMETRY.md) - Event tracking (Current state).
*   [**Future Spec**](FUTURE_SPEC/) - Planned upgrades (Neo4j, V2 Dynamic UI).

