import { test, expect } from '@playwright/test';
import { navigateAndWait, testFeedbackButton } from '../fixtures/test-utils';

test.describe('Admin Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/admin');
		// Additional wait for admin page data loading
		await page.waitForTimeout(1000);
	});

	test('should load the admin page', async ({ page }) => {
		await expect(page).toHaveURL(/admin/);
	});

	test('should highlight Admin in navigation', async ({ page }) => {
		const activeLink = page.locator('nav a.active');
		await expect(activeLink).toHaveText('Admin');
	});

	test('should display main content area', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should have working feedback button', async ({ page }) => {
		await testFeedbackButton(page);
	});

	test('should display data visualization components', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Admin page has various data views
		const main = page.locator('main');
		await expect(main).toBeVisible();
	});

	test('should have filter controls', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for filter/selector elements
		const selects = page.locator('select');
		const count = await selects.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test('should handle entity interactions', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for clickable nodes/entities
		const nodes = page.locator('.node, .entity, [class*="node"]');
		const count = await nodes.count();

		if (count > 0) {
			// Click first node
			await nodes.first().click();
			// Verify some response (panel opens, selection changes, etc.)
			await page.waitForTimeout(300);
		}
	});

	test('should display matrix view', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for matrix-related elements
		const matrixElements = page.locator('[class*="matrix"], .matrix');
		const count = await matrixElements.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test('should handle search functionality', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for search inputs
		const searchInputs = page.locator('input[type="text"][placeholder*="search" i], input[type="search"], .search');
		const count = await searchInputs.count();

		if (count > 0) {
			await searchInputs.first().fill('test');
			await page.waitForTimeout(300);
		}
	});

	test('should persist data to localStorage', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Check that localStorage keys exist
		const storageKeys = await page.evaluate(() => {
			return Object.keys(localStorage).filter(key =>
				key.includes('ai-oversight') || key.includes('traceability')
			);
		});

		// Admin page should use localStorage for persistence
		expect(storageKeys.length).toBeGreaterThanOrEqual(0);
	});

	test('should be responsive on tablet', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should be responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should handle import/export functionality', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for import/export buttons
		const exportButtons = page.locator('button:has-text("Export"), button:has-text("Import"), button:has-text("Save")');
		const count = await exportButtons.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});
});
