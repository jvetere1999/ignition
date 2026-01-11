# Telemetry & Measurement Spec

## Event Definitions

### 1. Exposure Event (`decision_exposure`)
Emitted by the **Server** (or Client immediately upon receiving payload) when the Today page is constructed.

**Payload**:
```json
{
  "event": "decision_exposure",
  "exposure_id": "uuid-v4",          // Unique ID for this specific render
  "user_id": "uuid",
  "timestamp": "ISO-8601",
  "context": {
    "reduced_mode": boolean,
    "soft_landing": boolean,
    "source": "focus|quest|..."      // If soft landing
  },
  "decisions": {
    "quick_picks": ["habit:123", "quest:456"], // Ordered list of presented items
    "starter_block": "focus:resume"
  }
}
```

### 2. Outcome Event (`decision_outcome`)
Emitted by the **Client** when an action is taken.

**Payload**:
```json
{
  "event": "decision_outcome",
  "exposure_id": "uuid-v4",          // Links back to the exposure
  "user_id": "uuid",
  "timestamp": "ISO-8601",
  "action_type": "click | start | complete | dismiss",
  "target_id": "habit:123",          // What was acted upon
  "time_since_exposure_ms": 12000
}
```

## Success Metrics

### Query: Next Action Conversion (5 min)
```sql
-- Pseudocode
SELECT 
  COUNT(DISTINCT e.exposure_id) as total_exposures,
  COUNT(DISTINCT o.exposure_id) as converted_exposures
FROM usage_events e
LEFT JOIN usage_events o 
  ON e.exposure_id = o.exposure_id 
  AND o.event = 'decision_outcome'
  AND o.action_type = 'start'
  AND o.timestamp <= e.timestamp + INTERVAL '5 minutes'
WHERE e.event = 'decision_exposure'
```

### Attribution Windows
*   **Immediate Action**: 5 minutes (Primary success metric).
*   **Session Engagement**: 60 minutes (Secondary).
*   **Bounce**: No interaction within 2 minutes.
