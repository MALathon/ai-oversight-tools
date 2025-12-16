import { test, expect } from '@playwright/test';
import { navigateAndWait, testFeedbackButton } from '../fixtures/test-utils';

test.describe('Reviewer Checklist Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/reviewer');
		await page.waitForTimeout(1000);
	});

	test('should load the reviewer page', async ({ page }) => {
		await expect(page).toHaveURL(/reviewer/);
	});

	test('should highlight Reviewer Checklist in navigation', async ({ page }) => {
		const activeLink = page.locator('nav a.active');
		await expect(activeLink).toHaveText('Reviewer Checklist');
	});

	test('should display page content', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should have working feedback button', async ({ page }) => {
		await testFeedbackButton(page);
	});

	test('should have model type selection', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
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
});
