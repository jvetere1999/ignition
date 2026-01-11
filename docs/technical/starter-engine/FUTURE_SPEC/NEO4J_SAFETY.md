# Neo4j Projection Safety Spec

## Data Minimization
To ensure privacy and security, the Neo4j Graph Projection explicitly **excludes** sensitive data.

### Allowed Node Properties
*   `User`: `id` (UUID), `created_at` (Timestamp).
*   `Action`: `id` (UUID), `type` (Enum), `category` (Enum).

### Forbidden Properties
*   **NO** PII (Email, Name, IP).
*   **NO** User Content (Journal Entry text, Note content, Custom Habit titles if sensitive).
*   **NO** Auth Tokens or Secrets.

## Integration Pattern
The integration must follow the **CQRS** (Command Query Responsibility Segregation) pattern:
1.  **Write**: Postgres is the System of Record.
2.  **Sync**: An async worker (e.g., CDC or queue) projects structural changes to Neo4j.
3.  **Read**: The Starter Engine queries Neo4j for *scores/recommendations only*.

## Fallback & Staleness Policy
*   **Circuit Breaker**: If Neo4j query takes > 500ms or fails, return Default/Null scores.
*   **Staleness**: If `Last-Sync-Timestamp` > 6 hours old, disable Neo4j querying and revert to Postgres-only logic.
*   **Correctness**: Neo4j is never the source of truth for "State" (e.g., is a habit done?). It only provides "Advice" (ordering). The system must verify the validity of the recommendation against Postgres.
