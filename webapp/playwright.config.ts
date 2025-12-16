import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AI Oversight Tools
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['html', { open: 'never' }],
		['list'],
		['json', { outputFile: 'test-results/results.json' }]
	],
	use: {
		// In CI with CI_TEST=true, serve runs at root; locally, vite preview uses /ai-oversight-tools base
		baseURL: process.env.BASE_URL || 'http://localhost:4173/ai-oversight-tools',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 12'] },
		},
	],
	// Only start webserver locally, in CI we use external server
	...(process.env.CI ? {} : {
		webServer: {
			command: 'npm run preview',
			url: 'http://localhost:4173/ai-oversight-tools',
			reuseExistingServer: true,
			timeout: 60000,
		},
	}),
});
