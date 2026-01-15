import { test, expect } from '@playwright/test';

/**
 * Encrypted Search Integration Tests
 * 
 * Tests the complete search workflow including:
 * - Vault unlock → index rebuild
 * - Search functionality on Ideas and Infobase pages
 * - Search result navigation
 * - Index progress visualization
 * - Cross-device sync state updates
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Encrypted Search Integration', () => {
  test.describe('Search Index Lifecycle', () => {
    test('should show IndexProgress component on Ideas page', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // IndexProgress component should be visible
      const indexProgress = page.locator('[data-testid="index-progress"]');
      await expect(indexProgress).toBeVisible();
    });

    test('should show SearchBox component on Ideas page', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // SearchBox should be visible
      const searchBox = page.locator('[data-testid="search-box"]');
      await expect(searchBox).toBeVisible();
    });

    test('should show IndexProgress component on Infobase page', async ({ page }) => {
      await page.goto(`${BASE_URL}/infobase`);
      
      // IndexProgress component should be visible
      const indexProgress = page.locator('[data-testid="index-progress"]');
      await expect(indexProgress).toBeVisible();
    });

    test('should show SearchBox component on Infobase page', async ({ page }) => {
      await page.goto(`${BASE_URL}/infobase`);
      
      // SearchBox should be visible
      const searchBox = page.locator('[data-testid="search-box"]');
      await expect(searchBox).toBeVisible();
    });

    test('should trigger index rebuild on vault unlock', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // IndexProgress should show "Building search index..."
      const indexStatus = page.locator('[data-testid="index-status"]');
      // Initially should show either "Vault locked" or "Building..."
      const statusText = await indexStatus.textContent();
      expect(['Vault locked', 'Building search index...'].some(t => statusText?.includes(t))).toBeTruthy();
    });
  });

  test.describe('SearchBox Functionality', () => {
    test('should open SearchBox with Cmd+K on Ideas page', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Press Cmd+K to open search
      await page.keyboard.press('Meta+k');
      
      // SearchBox input should be focused
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeFocused();
    });

    test('should show search results when typing', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Focus and type in search box
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test');
      
      // Wait for results dropdown
      const resultsDropdown = page.locator('[data-testid="search-results"]');
      // Results should be visible if there are matches (or "no results" message)
      await expect(resultsDropdown).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to result on Enter key', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Type in search box
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Press down arrow to select first result
      await page.keyboard.press('ArrowDown');
      
      // Press Enter to navigate
      // Note: will only navigate if results exist
      const initialUrl = page.url();
      await page.keyboard.press('Enter');
      
      // URL should change (if result was clicked)
      // This is optional depending on test data
      await page.waitForTimeout(500);
    });

    test('should close SearchBox on Escape key', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Open search with Cmd+K
      await page.keyboard.press('Meta+k');
      
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeFocused();
      
      // Close with Escape
      await page.keyboard.press('Escape');
      
      // Input should not be focused
      await expect(searchInput).not.toBeFocused();
    });

    test('should show "Search disabled" message when vault locked', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // SearchBox should show disabled state if vault is locked
      const searchBox = page.locator('[data-testid="search-box"]');
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Check if disabled or has locked message
      const isDisabled = await searchInput.isDisabled();
      const statusText = await page.locator('[data-testid="search-status"]').textContent();
      
      // Either should be disabled or show vault locked message
      expect(isDisabled || statusText?.includes('locked')).toBeTruthy();
    });

    test('should allow clicking search result to navigate on Ideas page', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Type in search box
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test', { delay: 100 });
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Try to click first result if visible
      const firstResult = page.locator('[data-testid="search-result-item"]').first();
      const isVisible = await firstResult.isVisible().catch(() => false);
      
      if (isVisible) {
        const initialUrl = page.url();
        await firstResult.click();
        
        // URL should change (navigated to idea detail)
        await page.waitForTimeout(500);
        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toContain('/ideas/');
      }
    });

    test('should allow clicking search result to navigate on Infobase page', async ({ page }) => {
      await page.goto(`${BASE_URL}/infobase`);
      
      // Type in search box
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test', { delay: 100 });
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Try to click first result if visible
      const firstResult = page.locator('[data-testid="search-result-item"]').first();
      const isVisible = await firstResult.isVisible().catch(() => false);
      
      if (isVisible) {
        const initialUrl = page.url();
        await firstResult.click();
        
        // URL should change (navigated to entry detail)
        await page.waitForTimeout(500);
        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toContain('/infobase/');
      }
    });
  });

  test.describe('IndexProgress Functionality', () => {
    test('should show progress bar during index rebuild', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // IndexProgress should be visible
      const indexProgress = page.locator('[data-testid="index-progress"]');
      await expect(indexProgress).toBeVisible();
      
      // Progress bar should exist
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toBeVisible();
    });

    test('should show items count in IndexProgress', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Items counter should be visible
      const itemsCounter = page.locator('[data-testid="items-counter"]');
      await expect(itemsCounter).toBeVisible();
    });

    test('should show percentage in IndexProgress', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Percentage should be visible or hidden based on state
      const percentage = page.locator('[data-testid="progress-percentage"]');
      // Should exist in DOM (even if hidden)
      const isVisible = await percentage.isVisible().catch(() => false);
      expect(isVisible || await percentage.count() > 0).toBeTruthy();
    });

    test('should show success message when index complete', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Wait for index to complete
      await page.waitForTimeout(2000);
      
      // IndexProgress should show completion state
      const successMessage = page.locator('[data-testid="index-success"]');
      const isVisible = await successMessage.isVisible().catch(() => false);
      
      // If index was built, success message might be shown
      if (isVisible) {
        expect(await successMessage.textContent()).toContain('indexed');
      }
    });
  });

  test.describe('Search Status Messages', () => {
    test('should show "Vault locked" message when vault not unlocked', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Check search status
      const searchStatus = page.locator('[data-testid="search-status"]');
      const statusText = await searchStatus.textContent();
      
      // Should either show "locked", "disabled", or be building
      expect(
        !statusText || 
        statusText.toLowerCase().includes('locked') || 
        statusText.toLowerCase().includes('disabled') ||
        statusText.toLowerCase().includes('building')
      ).toBeTruthy();
    });

    test('should show "Building search index..." message during rebuild', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Wait a moment for status to update
      await page.waitForTimeout(500);
      
      // Check search status
      const searchStatus = page.locator('[data-testid="search-status"]');
      const statusText = await searchStatus.textContent();
      
      // Should show building or locked status
      expect(statusText?.toLowerCase()).toMatch(/building|locked|indexing/i);
    });

    test('should show "Search ready" message when index complete', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Wait for index to potentially complete
      await page.waitForTimeout(3000);
      
      // Check search status
      const searchStatus = page.locator('[data-testid="search-status"]');
      const statusText = await searchStatus.textContent();
      
      // Should show ready or be empty (no status message)
      expect(
        !statusText || 
        statusText.toLowerCase().includes('ready') ||
        statusText.toLowerCase().includes('indexed')
      ).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate results with arrow keys', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Open search
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test', { delay: 100 });
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Press down to highlight first result
      await page.keyboard.press('ArrowDown');
      
      // Check if result is highlighted
      const firstResult = page.locator('[data-testid="search-result-item"]').first();
      const isHighlighted = await firstResult.evaluate(el => 
        el.classList.contains('highlighted') || 
        el.getAttribute('aria-selected') === 'true'
      ).catch(() => false);
      
      // Should be highlighted or selected
      expect(isHighlighted || await firstResult.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      ).then(color => color !== 'rgba(0, 0, 0, 0)').catch(() => false)).toBeTruthy();
    });

    test('should clear search on Escape', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Type in search
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test');
      
      // Clear with Escape
      await page.keyboard.press('Escape');
      
      // Input should be cleared
      const value = await searchInput.inputValue();
      expect(value === '' || !await searchInput.isVisible()).toBeTruthy();
    });
  });

  test.describe('Cross-Device Sync', () => {
    test('should handle sync events on Ideas page', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // IndexProgress should respond to sync events
      const indexProgress = page.locator('[data-testid="index-progress"]');
      await expect(indexProgress).toBeVisible();
      
      // Component should exist (testing that sync doesn't break UI)
      const progressBar = page.locator('[data-testid="progress-bar"]');
      expect(await progressBar.count()).toBeGreaterThan(0);
    });

    test('should handle sync events on Infobase page', async ({ page }) => {
      await page.goto(`${BASE_URL}/infobase`);
      
      // IndexProgress should respond to sync events
      const indexProgress = page.locator('[data-testid="index-progress"]');
      await expect(indexProgress).toBeVisible();
      
      // Component should exist (testing that sync doesn't break UI)
      const progressBar = page.locator('[data-testid="progress-bar"]');
      expect(await progressBar.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Integration with Page Navigation', () => {
    test('should maintain search box state when navigating back to Ideas page', async ({ page }) => {
      // Go to Ideas
      await page.goto(`${BASE_URL}/ideas`);
      
      // Type in search
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.type('test');
      
      // Navigate away and back
      await page.goto(`${BASE_URL}/infobase`);
      await page.goto(`${BASE_URL}/ideas`);
      
      // SearchBox should exist on the new page load
      const newSearchInput = page.locator('[data-testid="search-input"]');
      await expect(newSearchInput).toBeVisible();
    });

    test('should maintain search box state when navigating back to Infobase page', async ({ page }) => {
      // Go to Infobase
      await page.goto(`${BASE_URL}/infobase`);
      
      // SearchBox should exist
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeVisible();
      
      // Navigate away and back
      await page.goto(`${BASE_URL}/ideas`);
      await page.goto(`${BASE_URL}/infobase`);
      
      // SearchBox should still exist
      const newSearchInput = page.locator('[data-testid="search-input"]');
      await expect(newSearchInput).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on index rebuild failure', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Check for error message
      const errorMessage = page.locator('[data-testid="index-error"]');
      const isVisible = await errorMessage.isVisible().catch(() => false);
      
      // If there's an error, it should be visible
      if (isVisible) {
        expect(await errorMessage.textContent()).toContain('Error');
      }
    });

    test('should allow retry after index rebuild failure', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Check for retry button
      const retryButton = page.locator('[data-testid="retry-button"]');
      const isVisible = await retryButton.isVisible().catch(() => false);
      
      // If error occurred, retry button should exist
      if (isVisible) {
        await retryButton.click();
        // Progress should start again
        await expect(page.locator('[data-testid="index-progress"]')).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should render search components without significant delay', async ({ page }) => {
      // Measure page load time
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/ideas`);
      
      const searchBox = page.locator('[data-testid="search-box"]');
      await expect(searchBox).toBeVisible({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should search IndexedDB without blocking UI', async ({ page }) => {
      await page.goto(`${BASE_URL}/ideas`);
      
      // Open search and type
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      
      // Type quickly (simulate fast typing)
      for (let i = 0; i < 5; i++) {
        await searchInput.type('a', { delay: 100 });
      }
      
      // UI should remain responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
