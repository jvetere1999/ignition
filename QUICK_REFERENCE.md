# Quick Reference: Testing & Validation Commands

## Essential Commands

### Test Everything
```bash
./scripts/run-tests.sh
```
Starts Docker, runs all tests, reports results.

### Validate Project
```bash
./scripts/validate-all.sh
```
Checks backend, frontend, API compliance, builds.

### Validate API Format Only
```bash
./scripts/validate-api.sh --format
```
Quick check: Are API responses in correct format?

---

## By Use Case

### Before Pushing to Production
```bash
./scripts/validate-all.sh          # Full validation
./scripts/run-tests.sh              # Run all tests
git diff                            # Review changes
git push origin production          # Deploy
```

### During Development (Quick Checks)
```bash
./scripts/run-tests.sh --api        # Fast API tests
./scripts/validate-api.sh --format  # Format check
npm run lint                        # Frontend lint
cargo check --bin ignition-api      # Backend check
```

### Debugging Test Failures
```bash
./scripts/run-tests.sh --format --verbose  # Verbose output
docker compose -f infra/docker-compose.yml logs -f api
./scripts/validate-api.sh --lint   # Check linting
```

### Cleanup After Tests
```bash
./scripts/run-tests.sh --cleanup    # Run tests AND cleanup
# OR manually:
docker compose -f infra/docker-compose.yml down
```

---

## Test Selection

| Command | What Runs | Speed |
|---------|-----------|-------|
| `./scripts/run-tests.sh` | All tests | 2-5 min |
| `./scripts/run-tests.sh --api` | API tests only | 1-2 min |
| `./scripts/run-tests.sh --format` | Response format tests | 30-60 sec |
| `./scripts/run-tests.sh --e2e` | E2E UI tests | 1-3 min |

---

## Individual Test Runs

### Response Format Tests Only
```bash
npx playwright test tests/api-response-format.spec.ts
```

### All API Tests
```bash
npx playwright test --config=playwright.api.config.ts
```

### E2E Tests
```bash
npx playwright test tests/api-e2e.spec.ts
```

---

## Docker Commands

### Start Test Environment
```bash
docker compose -f infra/docker-compose.yml up -d
```

### View Logs
```bash
docker compose -f infra/docker-compose.yml logs -f
```

### Check Service Health
```bash
docker compose -f infra/docker-compose.yml ps
```

### Stop Services
```bash
docker compose -f infra/docker-compose.yml down
```

### Cleanup Everything
```bash
docker compose -f infra/docker-compose.yml down -v
```

---

## Verification Checklist

Before deploying, verify:
- [ ] `./scripts/validate-all.sh` passes (0 errors)
- [ ] `./scripts/run-tests.sh` passes (all green)
- [ ] `git diff` shows expected changes
- [ ] `docker logs` show no errors
- [ ] Response format tests pass (critical!)

---

## Troubleshooting Quick Fixes

### Tests Won't Start
```bash
docker compose -f infra/docker-compose.yml down -v
./scripts/run-tests.sh
```

### Linting Errors
```bash
cd app/frontend && npm run lint -- --fix
cd ../backend && cargo fmt
```

### Type Errors
```bash
cd app/frontend && npm run type-check
cd ../backend && cargo check --bin ignition-api
```

### Docker Port Conflicts
```bash
lsof -i :5432        # Check what's using port
kill -9 <PID>        # Kill the process
./scripts/run-tests.sh --cleanup  # Start fresh
```

---

## File Reference

| Command | File | Purpose |
|---------|------|---------|
| `./scripts/run-tests.sh` | Main test runner | Orchestrates full test suite |
| `./scripts/validate-all.sh` | Full validation | Backend + frontend + API checks |
| `./scripts/validate-api.sh` | API validation | Response format compliance |
| `tests/api-response-format.spec.ts` | Critical tests | API format regression tests |
| `infra/docker-compose.yml` | Dev environment | PostgreSQL + MinIO + API |
| `infra/docker-compose.e2e.yml` | Test environment | Ephemeral test setup |

---

## Documentation

| Document | Content |
|----------|---------|
| `docs/TESTING_GUIDE.md` | Complete testing guide |
| `docs/PROJECT_REORGANIZATION_PROPOSAL.md` | Structure improvement plan |
| `docs/CLEANUP_STRATEGY.md` | Detailed cleanup plan |
| `docs/IMPLEMENTATION_SUMMARY.md` | This delivery summary |

---

## Quick Decision Tree

```
Do I need to...?

Deploy to production?
  → Run: ./scripts/validate-all.sh && ./scripts/run-tests.sh
  
Check API response format?
  → Run: ./scripts/run-tests.sh --format
  
Make sure everything works?
  → Run: ./scripts/validate-all.sh
  
Debug a failing test?
  → Run: ./scripts/run-tests.sh --verbose
  
Test just APIs?
  → Run: ./scripts/run-tests.sh --api
  
Clean up after testing?
  → Run: ./scripts/run-tests.sh --cleanup
```

---

## Key Metrics

- **Test execution time**: 2-5 minutes (full suite)
- **Validation time**: 3-8 minutes (comprehensive)
- **Response format checks**: 25+ test cases
- **API endpoints tested**: 9 major endpoints
- **Project structure files**: 7 new infrastructure files

---

## Support

For help:
1. **Testing questions**: See `docs/TESTING_GUIDE.md`
2. **Script issues**: Run with `--verbose` flag
3. **Docker issues**: Check `docker logs`
4. **API failures**: Run `./scripts/validate-api.sh --format`

---

**Last Updated**: January 12, 2026  
**Status**: Ready for Production  
**Version**: 1.0
