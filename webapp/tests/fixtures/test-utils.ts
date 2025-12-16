import { test as base, expect, type Page } from '@playwright/test';

/**
 * Custom test fixtures and utilities for AI Oversight Tools testing
 */

// Extended test with common utilities
export const test = base.extend<{
	homePage: Page;
	waitForDataLoad: () => Promise<void>;
}>({
	homePage: async ({ page }, use) => {
		await page.goto('/');
		await use(page);
	},
	waitForDataLoad: async ({ page }, use) => {
		const waitForDataLoad = async () => {
			// Wait for any loading indicators to disappear
			await page.waitForLoadState('networkidle');
			// Additional wait for Svelte hydration
			await page.waitForTimeout(500);
		};
		await use(waitForDataLoad);
	},
});

export { expect };

/**
 * Navigate to a page and wait for it to be ready
 * Uses client-side navigation for better SPA compatibility
 */
export async function navigateAndWait(page: Page, path: string) {
	// First go to home page to ensure the SPA is loaded
	if (path !== '/') {
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('nav', { timeout: 10000 });
		await page.waitForLoadState('networkidle');

		// Find and click the navigation link for the target page
		const linkMap: Record<string, string> = {
			'/risk-matrix': 'Risk Matrix',
			'/reviewer': 'Reviewer Checklist',
			'/protocol-builder': 'Protocol Builder',
			'/admin': 'Admin',
		};

		const linkText = linkMap[path];
		if (linkText) {
			await page.click(`nav a:has-text("${linkText}")`);
			await page.waitForURL(new RegExp(path.replace('/', '')));
		} else {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
		}
	} else {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
	}

	// Wait for main content to be visible (SvelteKit routing)
	await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
	await page.waitForLoadState('networkidle');
	// Wait for Svelte hydration
	await page.waitForTimeout(500);
}

/**
 * Check if page has no console errors
 */
export async function checkNoConsoleErrors(page: Page): Promise<string[]> {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});
	return errors;
}

/**
 * Take a full page screenshot for visual regression
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
	await page.screenshot({
		path: `test-results/screenshots/${name}.png`,
		fullPage: true,
	});
}

/**
 * Test navigation header links
 */
export async function testNavigation(page: Page) {
	const navLinks = page.locator('nav .nav-links a');
	const expectedLinks = ['Risk Matrix', 'Reviewer Checklist', 'Protocol Builder', 'Admin'];

	const linkTexts = await navLinks.allTextContents();
	for (const expected of expectedLinks) {
		if (!linkTexts.includes(expected)) {
			throw new Error(`Missing navigation link: ${expected}`);
		}
	}
}

/**
 * Test feedback button presence and modal
 */
export async function testFeedbackButton(page: Page) {
	const feedbackBtn = page.locator('.feedback-button');
	await expect(feedbackBtn).toBeVisible();

	// Click and verify modal opens
	await feedbackBtn.click();
	const modal = page.locator('.modal');
	await expect(modal).toBeVisible();

	// Close modal
	await page.locator('.close-btn').click();
	await expect(modal).not.toBeVisible();
}

/**
 * Common page assertions
 */
export const pageAssertions = {
	async hasTitle(page: Page, expectedTitle: string) {
		await expect(page).toHaveTitle(expectedTitle);
	},
	async hasNoErrors(page: Page) {
		const errors = await checkNoConsoleErrors(page);
		expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
	},
	async isResponsive(page: Page) {
		// Check desktop
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.locator('body')).toBeVisible();

		// Check tablet
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('body')).toBeVisible();

		// Check mobile
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.locator('body')).toBeVisible();
	},
};
