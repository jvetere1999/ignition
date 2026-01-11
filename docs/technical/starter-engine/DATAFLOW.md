# Starter Engine Dataflow

This document illustrates how the Today page is populated, from user request to final render.

## End-to-End Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Frontend (TodayClient)
    participant API as Backend (/api/today)
    participant DB as Postgres
    participant Local as SessionStorage

    User->>Client: Visits /today
    
    rect rgb(240, 240, 240)
        note right of Client: 1. Local State Check
        Client->>Local: Check "Soft Landing" state
        Local-->>Client: Returns active/inactive
    end

    Client->>API: GET /api/today
    
    rect rgb(230, 245, 255)
        note right of API: 2. Server Aggregation
        API->>DB: Fetch User State (Gap? New?)
        API->>DB: Fetch Daily Plan Summary
        API->>DB: Fetch Pending Habits (Count)
        API->>DB: Fetch Active Quests (Count)
        API->>DB: Fetch Unread Inbox (Count)
        API->>DB: Fetch Last Focus Session (Recency)
    end

    rect rgb(230, 255, 230)
        note right of API: 3. Decision Logic
        API->>API: Compute UserState (returning_after_gap)
        API->>API: Compute Quick Picks (Postgres-based)
        API->>API: Construct TodayResponse
    end

    API-->>Client: Return JSON Payload (TodayResponse)

    rect rgb(255, 245, 230)
        note right of Client: 4. Rendering
        Client->>Client: Compute Visibility (ReducedMode if returning_after_gap || SoftLanding)
        Client->>Client: Render StarterBlock (Next Action)
        Client->>Client: Render QuickPicks (Dynamic Order)
        Client->>Client: Collapse/Expand Sections
    end
    
    Client-->>User: Display Dashboard
```

## Computation Logic

### 1. User State & Reduced Mode
The backend calculates `returning_after_gap` based on `last_activity_at > 3 days`.
- If `true`: Frontend defaults to **Reduced Mode** (Sections collapsed, focus on single action).
- If `false`: Standard view.

### 2. Dynamic UI (Quick Picks)
Currently implemented as a **Waterfall Priority** (Postgres-only):
1.  **Habits**: Added if pending > 0.
2.  **Quests**: Added if active > 0.
3.  **Inbox**: Added if unread > 0.
4.  **Resume Focus**: Added if last session exists (fetched via `LIMIT 1 ORDER BY ended_at DESC`).
Order is implicitly hardcoded in the list construction order.

### 3. Soft Landing (Client-Side)
When a user completes an action (Focus, Quest, etc.):
1.  Client stores `soft_landing=active` in `sessionStorage`.
2.  Redirects to `/today`.
3.  `TodayGridClient` reads storage and forces **Reduced Mode** regardless of Server State.
4.  User sees a "Soft Landing" or "Momentum" banner.
5.  Interaction with sections clears the state.
