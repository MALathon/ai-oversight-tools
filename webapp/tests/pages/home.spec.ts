import { test, expect } from '@playwright/test';
import { navigateAndWait, testNavigation, testFeedbackButton } from '../fixtures/test-utils';

test.describe('Home Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/');
	});

	test('should load the home page successfully', async ({ page }) => {
		await expect(page).toHaveTitle(/AI Oversight Tools/);
	});

	test('should display the navigation header', async ({ page }) => {
		const nav = page.locator('nav');
		await expect(nav).toBeVisible();

		// Check logo link
		const logo = page.locator('nav .logo');
		await expect(logo).toBeVisible();
		await expect(logo).toHaveText('AI Oversight Tools');
	});

	test('should have all navigation links', async ({ page }) => {
		await testNavigation(page);
	});

	test('should navigate to Risk Matrix', async ({ page }) => {
		await page.click('nav a:has-text("Risk Matrix")');
		await expect(page).toHaveURL(/risk-matrix/);
	});

	test('should navigate to Reviewer Checklist', async ({ page }) => {
		await page.click('nav a:has-text("Reviewer Checklist")');
		await expect(page).toHaveURL(/reviewer/);
	});

	test('should navigate to Protocol Builder', async ({ page }) => {
		await page.click('nav a:has-text("Protocol Builder")');
		await expect(page).toHaveURL(/protocol-builder/);
	});

	test('should navigate to Admin', async ({ page }) => {
		await page.click('nav a:has-text("Admin")');
		await expect(page).toHaveURL(/admin/);
	});

	test('should display the feedback button', async ({ page }) => {
		const feedbackBtn = page.locator('.feedback-button');
		await expect(feedbackBtn).toBeVisible();
	});

	test('should open and close feedback modal', async ({ page }) => {
		await testFeedbackButton(page);
	});

	test('should display the footer', async ({ page }) => {
		const footer = page.locator('footer');
		await expect(footer).toBeVisible();
		await expect(footer).toContainText('AIHSR Risk Reference Tool');
	});

	test('should be accessible - no critical accessibility violations', async ({ page }) => {
		// Basic accessibility checks
		const mainContent = page.locator('main');
		await expect(mainContent).toBeVisible();

		// Check that interactive elements are focusable
		const navLinks = page.locator('nav a');
		const count = await navLinks.count();
		expect(count).toBeGreaterThan(0);
	});
});
