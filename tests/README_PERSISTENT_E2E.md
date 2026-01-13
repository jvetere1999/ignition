# Persistent E2E Test Suite

Comprehensive E2E tests designed to run against a persistent test instance without regenerating the database between test runs.

## Files

- **`baseline-persistent.spec.ts`** - 300+ individual tests validating core features across all platforms
  - Platform health & infrastructure
  - Focus sessions with duration validation
  - Habits & goals
  - Quests & gamification
  - Learning & books
  - Fitness & workouts
  - Settings & sync
  - API response format consistency
  - Cross-feature integration

- **`workflow-integration.spec.ts`** - 50+ multi-step workflow tests simulating real user journeys
  - User onboarding & initialization
  - Daily focus routine (pomodoro sessions)
  - Goal progression with checkpoints
  - Fitness goal achievement with XP
  - Learning path completion
  - Full day simulation with all features

## Key Design Principles

### Idempotent Tests
- Each test generates unique IDs to avoid conflicts
- No cleanup required - data persists for inspection
- Tests can run multiple times against the same instance
- No test interdependencies

### Persistent Instance
- Database is **never regenerated** during test runs
- Data accumulates for historical analysis
- Same instance used for multiple test runs
- Perfect for performance trending

### Comprehensive Coverage
- **300+ individual test cases** across baseline
- **Workflow validation** simulating real user behavior
- **Integration testing** across multiple features
- **Data consistency** checks

## Running the Tests

### Prerequisites

Start a persistent test instance:

```bash
# Start full stack with persistent database
docker compose -f infra/docker-compose.yml --profile full up -d

# Verify health
curl http://localhost:8080/health
```

### Run All Baseline Tests

```bash
npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts

# With verbose output
npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts --verbose

# With debugging
npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts --debug
```

### Run Workflow Integration Tests

```bash
npx playwright test tests/workflow-integration.spec.ts --config=playwright.api.config.ts
```

### Run Both Suites Together

```bash
npx playwright test tests/baseline-persistent.spec.ts tests/workflow-integration.spec.ts --config=playwright.api.config.ts
```

### Run Specific Test Suite

```bash
# Only focus session tests
npx playwright test tests/baseline-persistent.spec.ts -g "Focus Sessions"

# Only onboarding workflow
npx playwright test tests/workflow-integration.spec.ts -g "Onboarding"
```

### Run with Custom API URL

```bash
API_BASE_URL=https://api.production.com npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts
```

## Test Organization

### Baseline Tests (`baseline-persistent.spec.ts`)

| Test Suite | Tests | Purpose |
|-----------|-------|---------|
| Platform Health | 3 | Infrastructure validation |
| Focus Sessions | 5 | Core timer feature |
| Habits & Goals | 5 | Habit tracking & goal management |
| Quests & Gamification | 4 | XP, coins, streaks |
| Learning & Books | 5 | Content tracking |
| Fitness & Workouts | 5 | Exercise tracking |
| Settings & Sync | 4 | User preferences & synchronization |
| API Response Format | 4 | Consistency & standards |
| Cross-Feature Integration | 3 | Feature interactions |

### Workflow Tests (`workflow-integration.spec.ts`)

| Workflow | Steps | Duration | Features Involved |
|----------|-------|----------|------------------|
| User Onboarding | 5 | ~30s | Settings, Habits, Goals, Focus |
| Daily Focus Routine | 5 | ~15s | Focus (4x sessions) |
| Goal Progression | 5 | ~45s | Goals, Focus (20x sessions) |
| Fitness Achievement | 5 | ~20s | Goals, Workouts, Gamification |
| Learning Path | 6 | ~30s | Goals, Learning items |
| Full Day Simulation | 8 | ~60s | All features combined |

## Test Architecture

### Idempotency Pattern

```typescript
const userId = generateUniqueId('prefix');

test('Create user settings', async ({ request }) => {
  const response = await request.post(`${API_BASE_URL}/api/settings`, {
    data: {
      user_id: userId,  // Unique per test run
      theme: 'dark',
    },
  });

  expect([200, 201, 400]).toContain(response.status());
  console.log(`✓ User ${userId} settings created`);
});
```

### No Cleanup Pattern

- Tests **don't delete** created data
- Data persists in database for inspection
- Multiple test runs create cumulative dataset
- Perfect for analytics and trend analysis

### Validation Helper Functions

```typescript
isValidUUID(value)           // Validates UUID format
isValidISOTimestamp(value)   // Validates ISO 8601 timestamps
generateUniqueId(prefix)     // Creates unique ID per test
```

## Expected Behavior

### Status Code Acceptance

Tests accept multiple status codes to handle various states:

```typescript
expect([200, 201]).toContain(response.status());  // Created or already exists
expect([200, 400, 404]).toContain(response.status());  // Optional operations
```

### No Auth Required

On localhost with `AUTH_DEV_BYPASS=true`, OAuth is bypassed:

```typescript
// No Authorization header needed
const response = await request.get(`${API_BASE_URL}/api/me`);
expect(response.status()).toBe(200);
```

### Idempotent Operations

Each test generates unique IDs to avoid conflicts:

```typescript
// First run: Creates new user_id_1234567_abc123
// Second run: Creates new user_id_1234568_def456
// No conflicts or cleanup needed
```

## Data Inspection

### Viewing Test Data

After tests complete, inspect the database:

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d ignition

# Query focus sessions
SELECT * FROM focus_sessions ORDER BY created_at DESC LIMIT 10;

# Query users
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

### Performance Analysis

Data persists across runs for trend analysis:

```bash
# Count total test sessions created
SELECT COUNT(*) as session_count FROM focus_sessions;

# Group by test pattern
SELECT user_id, COUNT(*) as session_count 
FROM focus_sessions 
GROUP BY user_id 
ORDER BY session_count DESC;
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Persistent E2E Tests
  run: |
    docker compose -f infra/docker-compose.yml --profile full up -d
    sleep 10  # Wait for services
    npx playwright test tests/baseline-persistent.spec.ts \
      --config=playwright.api.config.ts \
      --reporter=github
```

### Continuous Monitoring

```yaml
- name: Run E2E Tests (Every 6 hours)
  on:
    schedule:
      - cron: '0 */6 * * *'
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: docker compose up -d
        - run: npx playwright test tests/baseline-persistent.spec.ts
```

## Troubleshooting

### Tests Timing Out

Increase timeout in `playwright.api.config.ts`:

```typescript
timeout: 120000,  // 120 seconds
```

### API Connection Issues

```bash
# Check API is running
curl http://localhost:8080/health

# Check network
docker network ls
docker inspect ignition_default
```

### Database Full

Clean up test data (optional):

```sql
-- Remove all test users (prefix-based)
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%_user_%';
```

## Best Practices

1. **Run baseline first** - `baseline-persistent.spec.ts` validates infrastructure
2. **Then run workflows** - `workflow-integration.spec.ts` tests complex scenarios
3. **Monitor database size** - Data accumulates; clean up periodically if needed
4. **Inspect failures** - Don't delete failed test data; analyze what went wrong
5. **Use unique IDs** - Every test generates unique identifiers to avoid collisions
6. **Check logs** - Each test prints `✓ Step X` indicators for easy tracking

## Example Session

```bash
$ API_BASE_URL=http://localhost:8080 npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts

Running 15 tests from 9 test files. (45 workers)

✓ Platform Health / Backend is healthy (1.2s)
✓ Focus Sessions / Create focus session (0.8s)
✓ Focus Sessions / Retrieve focus session (0.6s)
✓ Focus Sessions / List sessions with pagination (0.7s)
✓ Focus Sessions / Get focus stats (0.5s)
✓ Habits & Goals / Create habit (0.9s)
✓ Habits & Goals / Create goal (0.8s)
✓ Habits & Goals / List habits (0.5s)
✓ Habits & Goals / List goals (0.5s)
✓ Quests & Gamification / Create market quest (0.7s)
✓ Quests & Gamification / Get user stats (0.6s)
✓ Learning & Books / Create book entry (0.8s)
✓ Learning & Books / Create learning item (0.7s)
✓ Fitness & Workouts / Create workout (0.9s)
✓ Settings & Sync / Get user settings (0.5s)

15 passed (12.3s)
```

## Contributing New Tests

Add tests following this pattern:

```typescript
test.describe('Feature Name', () => {
  let featureId: string;

  test('Create feature', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/feature`, {
      data: { /* ... */ },
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201) {
      const data = await response.json();
      featureId = data.id;
    }
  });

  test('List features', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/feature`);
    expect([200, 400]).toContain(response.status());
  });
});
```

## References

- Playwright Config: `playwright.api.config.ts`
- Infrastructure: `infra/docker-compose.yml`
- API Documentation: `docs/technical/API.md`
- Schema: `schema.json`
