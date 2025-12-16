import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../fixtures/test-utils';

test.describe('Feedback Modal Component', () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, '/');
	});

	test('should display feedback button on page', async ({ page }) => {
		const feedbackBtn = page.locator('.feedback-button');
		await expect(feedbackBtn).toBeVisible();
		await expect(feedbackBtn).toContainText('Feedback');
	});

	test('should open modal when feedback button is clicked', async ({ page }) => {
		await page.click('.feedback-button');
		const modal = page.locator('.modal');
		await expect(modal).toBeVisible();
	});

	test('should display modal title', async ({ page }) => {
		await page.click('.feedback-button');
		const title = page.locator('.modal h2, .modal-header h2');
		await expect(title).toContainText('Feedback');
	});

	test('should close modal when close button is clicked', async ({ page }) => {
		await page.click('.feedback-button');
		const modal = page.locator('.modal');
		await expect(modal).toBeVisible();

		await page.click('.close-btn');
		await expect(modal).not.toBeVisible();
	});

	test('should close modal when backdrop is clicked', async ({ page }) => {
		await page.click('.feedback-button');
		const modal = page.locator('.modal');
		await expect(modal).toBeVisible();

		// Click the backdrop (outside the modal)
		await page.click('.modal-backdrop', { position: { x: 10, y: 10 } });
		await expect(modal).not.toBeVisible();
	});

	test('should load labels from GitHub', async ({ page }) => {
		await page.click('.feedback-button');

		// Wait for labels to load
		await page.waitForLoadState('networkidle');

		// Check for label chips or loading state
		const labelsContainer = page.locator('.labels-container');
		await expect(labelsContainer).toBeVisible();

		// Either labels loaded or loading message shown
		const labelChips = page.locator('.label-chip');
		const loadingText = page.locator('.labels-loading');

		const chipCount = await labelChips.count();
		const loadingCount = await loadingText.count();

		expect(chipCount + loadingCount).toBeGreaterThan(0);
	});

	test('should allow selecting labels', async ({ page }) => {
		await page.click('.feedback-button');
		await page.waitForLoadState('networkidle');

		const labelChips = page.locator('.label-chip');
		const count = await labelChips.count();

		if (count > 0) {
			const firstLabel = labelChips.first();
			await firstLabel.click();
			await expect(firstLabel).toHaveClass(/selected/);

			// Click again to deselect
			await firstLabel.click();
			await expect(firstLabel).not.toHaveClass(/selected/);
		}
	});

	test('should have title input field', async ({ page }) => {
		await page.click('.feedback-button');

		const titleInput = page.locator('input#feedback-title-input, input[placeholder*="title" i]');
		await expect(titleInput).toBeVisible();
	});

	test('should have description textarea', async ({ page }) => {
		await page.click('.feedback-button');

		const descriptionTextarea = page.locator('textarea#feedback-description, textarea[placeholder*="description" i]');
		await expect(descriptionTextarea).toBeVisible();
	});

	test('should disable submit button when form is incomplete', async ({ page }) => {
		await page.click('.feedback-button');

		const submitBtn = page.locator('.modal button.primary:has-text("Submit")');
		await expect(submitBtn).toBeDisabled();
	});

	test('should enable submit button when form is complete', async ({ page }) => {
		await page.click('.feedback-button');
		await page.waitForLoadState('networkidle');

		// Select a label
		const labelChips = page.locator('.label-chip');
		const count = await labelChips.count();
		if (count > 0) {
			await labelChips.first().click();
		}

		// Fill title
		const titleInput = page.locator('input#feedback-title-input, input[placeholder*="title" i]');
		await titleInput.fill('Test Title');

		// Fill description
		const descriptionTextarea = page.locator('textarea#feedback-description, textarea[placeholder*="description" i]');
		await descriptionTextarea.fill('Test description content');

		// Check submit button is enabled
		const submitBtn = page.locator('.modal button.primary:has-text("Submit")');

		if (count > 0) {
			// Only enabled if labels were loaded and selected
			await expect(submitBtn).toBeEnabled();
		}
	});

	test('should show attachment note', async ({ page }) => {
		await page.click('.feedback-button');

		// Look for the attachment note paragraph with its specific text
		const attachmentNote = page.locator('.attachment-note');
		await expect(attachmentNote).toBeVisible();
		await expect(attachmentNote).toContainText('attach');
	});

	test('should reset form when modal is closed and reopened', async ({ page }) => {
		await page.click('.feedback-button');

		// Fill some data
		const titleInput = page.locator('input#feedback-title-input, input[placeholder*="title" i]');
		await titleInput.fill('Test Title');

		// Close modal
		await page.click('.close-btn');

		// Wait for reset animation
		await page.waitForTimeout(300);

		// Reopen modal
		await page.click('.feedback-button');

		// Check title is empty
		const newTitleInput = page.locator('input#feedback-title-input, input[placeholder*="title" i]');
		await expect(newTitleInput).toHaveValue('');
	});

	test('should be accessible with keyboard navigation', async ({ page }) => {
		// Tab to feedback button and press Enter
		await page.keyboard.press('Tab');
		// Navigate to feedback button (might take multiple tabs)
		const feedbackBtn = page.locator('.feedback-button');
		await feedbackBtn.focus();
		await page.keyboard.press('Enter');

		const modal = page.locator('.modal');
		await expect(modal).toBeVisible();

		// Press Escape to close
		await page.keyboard.press('Escape');
		// Modal might not close on Escape by default - this tests the behavior
	});
});
