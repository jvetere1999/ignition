# Encrypted Search Index - Remaining Work

**Status:** Implementation complete, integration pending  
**Estimated Time to Full Deployment:** 4 hours

---

## Integration Phase (2-3 hours)

### [ ] 1. Wire VaultLockContext to SearchIndexManager

**Location:** `app/frontend/src/lib/auth/VaultLockContext.tsx`

**What to do:**
```typescript
import { getSearchManager } from '@/lib/search/SearchIndexManager';

// In useEffect for vault unlock:
if (vaultUnlocked) {
  const searchManager = await getSearchManager();
  const contentList = await fetchEncryptedContent(); // get ideas + infobase
  await searchManager.rebuildIndex(contentList);
  setSearchReady(true);
}

// In useEffect for vault lock:
if (!vaultUnlocked) {
  const searchManager = await getSearchManager();
  await searchManager.clearIndex();
  setSearchReady(false);
}
```

### [ ] 2. Create Search UI Component

**Location:** `app/frontend/src/components/Search/SearchBox.tsx`

**Features:**
- Text input with debounce (300ms)
- Show/hide results dropdown
- Highlight matching query terms
- Loading state during rebuild
- "Unlock vault to search" message when locked
- Keyboard shortcuts (Cmd+K / Ctrl+K)

### [ ] 3. Integrate with Ideas Component

**Location:** `app/frontend/src/app/(authenticated)/ideas/page.tsx`

**What to do:**
- Add SearchBox to Ideas page header
- Display results in modal or sidebar
- Link from result to original idea
- Show match count

### [ ] 4. Integrate with Infobase Component

**Location:** `app/frontend/src/app/(authenticated)/infobase/page.tsx`

**What to do:**
- Add SearchBox to Infobase page header
- Display results organized by category
- Link from result to original entry
- Show match count

### [ ] 5. Add Progress Indicator

**Location:** `app/frontend/src/components/Search/IndexProgress.tsx`

**What to show:**
- During vault unlock: "Indexing 1,234 / 5,000 items... 45%"
- On completion: "Index ready - search now"
- Estimated time remaining

---

## Testing Phase (2-3 hours)

### [ ] 1. Unit Tests

**Location:** `app/frontend/src/lib/search/__tests__/`

**Tests needed:**
- `SearchIndexManager.test.ts`:
  - Initialize IndexedDB
  - Rebuild index with test data
  - Search queries (exact, prefix, phrase)
  - Incremental add/remove
  - Event listeners

- `Tokenizer.test.ts`:
  - Stop word removal
  - Chord detection (Em7sus4, etc.)
  - Phrase extraction
  - Position tracking

- `Trie.test.ts`:
  - Insert words
  - Get by prefix
  - Remove content
  - Node type detection

### [ ] 2. Integration Tests

**Location:** `tests/search.spec.ts` (Playwright)

**Tests needed:**
```typescript
test('Vault unlock triggers index rebuild', async ({ page }) => {
  // Go to Ideas page
  // Click unlock vault
  // Wait for "Index ready" message
  // Verify search box is enabled
});

test('Search returns matching ideas', async ({ page }) => {
  // Unlock vault
  // Wait for index ready
  // Search for "chord"
  // Verify results shown
  // Verify highlights applied
});

test('Search disabled when vault locked', async ({ page }) => {
  // Lock vault
  // Try to search
  // Verify disabled message
});

test('Offline search works after unlock', async ({ page }) => {
  // Go offline (DevTools)
  // Unlock vault (completed earlier)
  // Search works from IndexedDB
  // Go online
  // Verify still works
});
```

### [ ] 3. Performance Tests

**Location:** `tests/search-performance.spec.ts`

**Benchmarks:**
- 1,000 ideas: Index rebuild <1s
- Exact word search: <10ms
- Prefix search (3 chars): <100ms
- Pagination (50 items): <5ms

---

## Deployment Phase (1 hour)

### [ ] 1. Code Review Checklist
- [ ] No console.error/debug left
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] No unused imports
- [ ] Comments updated

### [ ] 2. Git Workflow
```bash
# Create branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/encrypted-search-integration

# Make changes
# Commit frequently with clear messages
# Push to GitHub

# Create Pull Request
# Wait for CI/CD (lint, type-check, tests)

# Merge to dev → test → production → main
```

### [ ] 3. Deployment Verification
- [ ] API endpoints accessible: GET /api/search
- [ ] IndexedDB quota sufficient (50-100MB available)
- [ ] Ideas/Infobase content loads before search
- [ ] Vault lock/unlock works smoothly
- [ ] No errors in browser console

### [ ] 4. Monitor Post-Deployment
- [ ] Track IndexedDB usage per user
- [ ] Monitor search latency (should be <50ms)
- [ ] Check for errors in error tracking
- [ ] Verify offline mode works

---

## Known Limitations (By Design)

1. **Server doesn't decrypt:** Search only returns encrypted results server-side
   - Client-side search is authoritative
   - Server endpoint is fallback only

2. **Device-specific index:** Each device has its own IndexedDB
   - Not synced across devices (intentional for privacy)
   - Each device must unlock separately

3. **IndexedDB limits:** ~12MB per 10,000 items
   - Large users (50,000+ items) need pruning
   - Solution: Index only recent 10,000 with warning

4. **Async indexing:** Rebuild takes 5s for 10,000 items
   - Non-blocking (async)
   - Progress indicator shows progress
   - Search unavailable during rebuild

---

## Future Enhancements (Post-MVP)

1. **Fuzzy Search** - Levenshtein distance tolerance
2. **Search History** - Recent searches + suggestions
3. **Advanced Filters** - By date range, tag, content type
4. **Search Analytics** - Most-searched terms (anonymized)
5. **Voice Search** - Search by voice memo
6. **Cross-Device Search** - Cloud-synced search index (breaks E2EE, opt-in)

---

## Reference Files

**Completed:**
- ✅ `docs/product/e2ee/encrypted-search-index.md` - Full spec
- ✅ `ENCRYPTED_SEARCH_INDEX_IMPLEMENTATION.md` - Technical summary
- ✅ `app/backend/crates/api/src/db/search_models.rs` - Data structures
- ✅ `app/backend/crates/api/src/db/search_repos.rs` - DB queries
- ✅ `app/backend/crates/api/src/routes/search.rs` - API endpoints
- ✅ `app/frontend/src/lib/search/SearchIndexManager.ts` - Client implementation

**To Create:**
- [ ] `app/frontend/src/components/Search/SearchBox.tsx`
- [ ] `app/frontend/src/components/Search/SearchBox.module.css`
- [ ] `app/frontend/src/components/Search/IndexProgress.tsx`
- [ ] `app/frontend/src/lib/search/__tests__/SearchIndexManager.test.ts`
- [ ] `tests/search.spec.ts`

---

## Success Criteria

**Phase 3 Complete When:**
- [ ] VaultLockContext wired to SearchIndexManager
- [ ] SearchBox component displays results
- [ ] Ideas + Infobase integrated
- [ ] Progress indicator works
- [ ] npm run build: 0 errors
- [ ] ESLint: 0 errors

**Phase 4 Complete When:**
- [ ] All integration tests pass
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] Merged to dev → test → production

**MVP Deployment Complete When:**
- [ ] All above criteria met
- [ ] Staging verification passed
- [ ] Production deployment successful
- [ ] Monitoring confirmed working

---

**Assignee:** Frontend team (integration) + Backend team (review)  
**Timeline:** 4 hours  
**Priority:** High (Tier 1 feature)  
**Start After:** Backend review complete
