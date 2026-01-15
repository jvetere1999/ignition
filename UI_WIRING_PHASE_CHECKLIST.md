# UI Wiring Phase - Implementation Checklist

**Phase:** 5 - UI Wiring  
**Estimated Duration:** 1.5 hours  
**Status:** Ready to start

---

## Step-by-Step Implementation Guide

### Task 1: Add SearchBox to Ideas Page
**File:** `app/frontend/src/app/(authenticated)/ideas/page.tsx`

```typescript
// At top of file, add imports:
import { SearchBox } from '@/components/Search/SearchBox';
import { IndexProgress } from '@/components/Search/IndexProgress';
import { useRouter } from 'next/navigation';
import { type SearchResult } from '@/lib/search/SearchIndexManager';

// Inside component:
export function IdeasPage() {
  const router = useRouter();

  const handleSearchResult = (result: SearchResult) => {
    // Navigate to the specific idea
    const ideaId = result.id.replace('idea:', '');
    router.push(`/ideas/${ideaId}`);
  };

  return (
    <div>
      {/* Add these components near the top */}
      <IndexProgress />
      <SearchBox 
        onResultClick={handleSearchResult}
        placeholder="Search your ideas..."
      />
      
      {/* Rest of existing Ideas page content */}
    </div>
  );
}
```

**What to verify:**
- [ ] SearchBox renders without errors
- [ ] Can type in input
- [ ] Results appear after 300ms
- [ ] Clicking result navigates correctly
- [ ] Progress indicator shows during vault unlock

### Task 2: Add SearchBox to Infobase Page
**File:** `app/frontend/src/app/(authenticated)/infobase/page.tsx`

```typescript
// At top of file, add imports:
import { SearchBox } from '@/components/Search/SearchBox';
import { IndexProgress } from '@/components/Search/IndexProgress';
import { useRouter } from 'next/navigation';
import { type SearchResult } from '@/lib/search/SearchIndexManager';

// Inside component:
export function InfobasePage() {
  const router = useRouter();

  const handleSearchResult = (result: SearchResult) => {
    // Navigate to the specific entry
    const entryId = result.id.replace('infobase:', '');
    router.push(`/infobase/${entryId}`);
  };

  return (
    <div>
      {/* Add these components near the top */}
      <IndexProgress />
      <SearchBox 
        onResultClick={handleSearchResult}
        placeholder="Search your knowledge base..."
      />
      
      {/* Rest of existing Infobase page content */}
    </div>
  );
}
```

**What to verify:**
- [ ] SearchBox renders without errors
- [ ] Can type in input
- [ ] Results include both ideas and infobase entries
- [ ] Clicking infobase result navigates correctly
- [ ] Progress indicator shows during vault unlock

### Task 3: Test Keyboard Navigation

**Manual Test Steps:**
1. Go to Ideas page
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
3. SearchBox should receive focus
4. Type a search query (e.g., "music")
5. Results should appear
6. Press `↓` arrow key - first result highlights
7. Press `↓` arrow key again - second result highlights
8. Press `↑` arrow key - go back to first result
9. Press `Enter` - should navigate to that idea
10. Return to Ideas page
11. Click SearchBox clear button (✕)
12. Type new query
13. Press `Escape` - dropdown should close

**Expected:**
- [x] All keyboard shortcuts work
- [x] Navigation smooth
- [x] No console errors
- [x] Focus visible

### Task 4: Test Search Results

**Manual Test Steps:**
1. Unlock vault (if locked)
2. Wait for "✓ Search index ready" message
3. In Ideas page:
   - Create or view an idea with title "Mountain Music"
   - Search for "mountain"
   - Result should appear with "Mountain Music" title
   - Tags should display
   - Relevance score should show
4. In Infobase page:
   - Create or view an entry with "chord" in content
   - Search for "chord"
   - Result should appear with preview
   - Highlight should show the match
5. Search for non-existent term
   - Should show "No results found..."

**Expected:**
- [x] Results accurate
- [x] Highlights display
- [x] Both ideas and infobase entries mixed in results
- [x] Empty state shows

### Task 5: Test Progress Indicator

**Manual Test Steps:**
1. Kill browser cache or clear IndexedDB (optional)
2. Go to Ideas page
3. Lock vault (if unlocked)
4. Unlock vault with passphrase
5. Should immediately see:
   - "Building search index..." message
   - Progress bar starting at 0%
   - "0 / X items" counter
   - Spinner in search box
6. Wait for completion:
   - Progress bar reaches 100%
   - Message changes to "✓ Search index ready"
   - SearchBox becomes enabled
   - Can now search

**Expected:**
- [x] Progress bar visible
- [x] Counter updates
- [x] ETA shown if available
- [x] Completion message shows
- [x] SearchBox enabled after

### Task 6: Test Cross-Device Sync

**Manual Test Steps:**
1. On Device A: Unlock vault → see "Search index ready"
2. On Device B: Vault is locked
3. On Device A: Lock vault manually
4. On Device B: Within 30 seconds, search should become disabled
5. On Device A: Unlock vault again
6. On Device B: Within 30 seconds, see "Building search index..."
7. Both devices should have same lock state

**Expected:**
- [x] Cross-device lock/unlock synced
- [x] Search disabled when locked
- [x] Search enabled when unlocked
- [x] Progress shows on sync

---

## Lint & Type Check

Before committing:

```bash
cd app/frontend

# Check types
npm run typecheck

# Check linting
npm run lint

# Build (optional)
npm run build
```

**Expected:**
- [x] No new TypeScript errors
- [x] No new ESLint warnings
- [x] Build completes successfully

---

## Commit & Push

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(search): Integrate SearchBox and IndexProgress into Ideas and Infobase pages

- Add SearchBox component to Ideas page
- Add SearchBox component to Infobase page
- Add IndexProgress to both pages
- Keyboard shortcuts working (Cmd+K, arrows, Enter, Esc)
- Progress indicator shows during rebuild
- Search results navigating correctly
- Cross-device sync working"

# Push to feature branch
git push origin feat/encrypted-search-integration
```

---

## E2E Testing (Optional - Playwright)

**File:** `tests/search-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Search index rebuilds on vault unlock', async ({ page }) => {
  // Go to Ideas page
  await page.goto('/ideas');
  
  // See "Unlock vault" message
  const unlockMsg = page.locator('text=Unlock vault to search');
  await expect(unlockMsg).toBeVisible();
  
  // Unlock vault (pseudo - actual implementation depends on UI)
  // ... unlock logic ...
  
  // See building message
  const buildingMsg = page.locator('text=Building search index');
  await expect(buildingMsg).toBeVisible();
  
  // Wait for completion (max 30 seconds)
  const readyMsg = page.locator('text=Search index ready');
  await expect(readyMsg).toBeVisible({ timeout: 30000 });
  
  // Search box should be enabled
  const searchInput = page.locator('input[aria-label="Search"]');
  await expect(searchInput).toBeEnabled();
});

test('Search returns matching ideas', async ({ page }) => {
  // Assuming vault already unlocked
  await page.goto('/ideas');
  
  // Focus search box
  const searchInput = page.locator('input[aria-label="Search"]');
  await searchInput.focus();
  
  // Type search query
  await searchInput.type('music');
  
  // Wait for results (debounce 300ms + search time)
  const firstResult = page.locator('[role="button"]:has-text("Music")').first();
  await expect(firstResult).toBeVisible({ timeout: 5000 });
  
  // Click result
  await firstResult.click();
  
  // Should navigate to idea
  await expect(page).toHaveURL(/\/ideas\//);
});

test('Keyboard navigation works', async ({ page }) => {
  await page.goto('/ideas');
  
  // Focus with Cmd+K
  await page.keyboard.press('Meta+K');
  
  // Type query
  await page.keyboard.type('test');
  
  // Wait for results
  await page.waitForSelector('[role="button"]');
  
  // Navigate with arrows
  await page.keyboard.press('ArrowDown');
  const selected = page.locator('[role="button"].selected').first();
  await expect(selected).toBeVisible();
  
  // Select with Enter
  await page.keyboard.press('Enter');
  
  // Should navigate
  await expect(page).toHaveURL(/\/.+\//);
});
```

---

## Pre-Deployment Checklist

- [ ] SearchBox renders on Ideas page
- [ ] SearchBox renders on Infobase page
- [ ] IndexProgress renders on both pages
- [ ] Keyboard shortcuts work (Cmd+K, arrows, Enter, Esc)
- [ ] Search results accurate
- [ ] Navigation working
- [ ] Progress indicator shows correctly
- [ ] Cross-device sync tested
- [ ] TypeScript: 0 new errors
- [ ] ESLint: 0 new warnings
- [ ] Build: Successful
- [ ] Tested on multiple devices/browsers
- [ ] No console errors

---

## Rollback Plan

If issues occur:

```bash
# Revert last commit
git revert HEAD

# Or hard reset
git reset --hard HEAD~1

# Push to remote
git push origin +feat/encrypted-search-integration
```

---

## Testing Environments

### Local Development
```
Port: 3000
URL: http://localhost:3000
Testing: npm run dev
```

### Staging (After Merge)
```
URL: https://staging.ecent.online
Testing: Full E2E test suite
```

### Production (Final)
```
URL: https://ecent.online
Testing: Limited canary, monitor errors
```

---

## Support & Questions

If you encounter issues:

1. **SearchBox not showing:** Check that component is imported and styles load
2. **No search results:** Verify index is ready (check IndexProgress)
3. **Keyboard shortcuts not working:** Check for focus issues
4. **Results navigation failing:** Verify content IDs in search results
5. **TypeScript errors:** Review error messages, check type definitions

**See:** [PROJECT_STATUS_ENCRYPTED_SEARCH.md](PROJECT_STATUS_ENCRYPTED_SEARCH.md)

---

## Summary

This checklist guides implementation of the UI wiring phase:

1. ✅ Add SearchBox to Ideas page
2. ✅ Add SearchBox to Infobase page
3. ✅ Add IndexProgress to both pages
4. ✅ Manual testing
5. ✅ Type checking & linting
6. ✅ Commit & push
7. ✅ E2E tests (optional)
8. ✅ Pre-deployment checklist

**Estimated time:** 1.5 hours  
**Complexity:** Medium (straightforward component integration)  
**Risk level:** Low (no database changes, no breaking changes)

---

**Ready to begin UI wiring phase?** 🚀
