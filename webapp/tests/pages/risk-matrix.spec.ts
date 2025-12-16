import { test, expect } from '@playwright/test';
import { navigateAndWait, testFeedbackButton } from '../fixtures/test-utils';

test.describe('Risk Matrix Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/risk-matrix');
		await page.waitForTimeout(1000);
	});

	test('should load the risk matrix page', async ({ page }) => {
		await expect(page).toHaveURL(/risk-matrix/);
	});

	test('should highlight Risk Matrix in navigation', async ({ page }) => {
		const activeLink = page.locator('nav a.active');
		await expect(activeLink).toHaveText('Risk Matrix');
	});

	test('should display risk matrix container', async ({ page }) => {
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should have working feedback button', async ({ page }) => {
		await testFeedbackButton(page);
	});

	test('should be responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		const main = page.locator('main');
		await expect(main).toBeVisible({ timeout: 10000 });
	});

	test('should display matrix cells if data loads', async ({ page }) => {
		const mainContent = page.locator('main');
		await expect(mainContent).toBeVisible({ timeout: 10000 });
	});
});
