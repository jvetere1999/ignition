# Dynamic UI V2 Spec

## Ranking Formula

The ranking score ($S$) for a potential Quick Pick item $i$ is calculated as:

$$S_i = (W_{freq} \times F_i) + (W_{rec} \times R_i) + (W_{seq} \times T_{a \to i})$$

Where:
*   $F_i$: **Frequency Score** (How often is this item used in general?)
*   $R_i$: **Recency Score** (How recently was it used? Decays over time.)
*   $T_{a \to i}$: **Transition Probability** (Prob. of doing $i$ given previous action $a$, from Neo4j).
*   $W$: Configurable weights (e.g., $W_{freq}=0.4, W_{rec}=0.3, W_{seq}=0.3$).

## Deterministic Tie-Breaking
If $S_i == S_j$, the winner is determined by:
1.  **Count DESC**: The item with higher raw execution count wins.
2.  **ID ASC**: Stable ID sort (UUID alphanumeric).

## Sequence Transitions (Neo4j)
*   **Source**: A graph projection of `(Action)-[:NEXT]->(Action)`.
*   **Query**: "Target items that commonly follow the user's last completed action."
*   **Fallback**: If Neo4j is down/slow (>200ms), $W_{seq}$ becomes 0, and ranking is purely Frequency/Recency (Postgres).

## Explainability
If a high score is driven by $T_{a \to i}$ (Sequence), the UI MAY show:
> "Often done after [Last Action]"

Text must be neutral.
*   **Allowed**: "Popular after Focus"
*   **Disallowed**: "Keep your streak alive!", "Don't break the chain!" (unless explicitly gamification opt-in).
