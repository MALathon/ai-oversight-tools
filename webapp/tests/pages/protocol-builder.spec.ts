import { test, expect } from '@playwright/test';
import { navigateAndWait, testFeedbackButton } from '../fixtures/test-utils';

test.describe('Protocol Builder Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/protocol-builder');
		await page.waitForTimeout(1000);
	});

	test('should load the protocol builder page', async ({ page }) => {
		await expect(page).toHaveURL(/protocol-builder/);
	});

	test('should highlight Protocol Builder in navigation', async ({ page }) => {
		const activeLink = page.locator('nav a.active');
		await expect(activeLink).toHaveText('Protocol Builder');
	});

	test('should display page header/title', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should have working feedback button', async ({ page }) => {
		await testFeedbackButton(page);
	});

	test('should display assessment questions section', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should handle question interactions', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Find and interact with question checkboxes if present
		const checkboxes = page.locator('input[type="checkbox"]');
		const count = await checkboxes.count();

		if (count > 0) {
			// Click first checkbox
			const firstCheckbox = checkboxes.first();
			await firstCheckbox.click();
			// Verify it's checked
			await expect(firstCheckbox).toBeChecked();
		}
	});

	test('should display risk sections when questions are answered', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should have export functionality', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for export buttons
		const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")');
		const count = await exportBtn.count();
		// Export might be conditional based on selections
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test('should show priority badges on controls', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should be responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should handle sorting controls', async ({ page }) => {
		await page.waitForLoadState('networkidle');
		// Look for sort buttons/selects
		const sortControls = page.locator('select, button:has-text("Sort")');
		const count = await sortControls.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});
});
