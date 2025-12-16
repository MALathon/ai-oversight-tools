import { test, expect } from '@playwright/test';

const WORKER_URL = 'https://ai-oversight-feedback.malathon.workers.dev';
const GITHUB_REPO = 'MALathon/ai-oversight-tools';

test.describe('Feedback API (Worker)', () => {
	test.describe('CORS', () => {
		test('should handle OPTIONS preflight request', async ({ request }) => {
			const response = await request.fetch(WORKER_URL, {
				method: 'OPTIONS',
				headers: {
					'Origin': 'https://malathon.github.io',
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Content-Type',
				},
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['access-control-allow-origin']).toBeTruthy();
			expect(response.headers()['access-control-allow-methods']).toContain('POST');
		});

		test('should allow requests from production origin', async ({ request }) => {
			const response = await request.fetch(WORKER_URL, {
				method: 'OPTIONS',
				headers: {
					'Origin': 'https://malathon.github.io',
				},
			});

			const allowedOrigin = response.headers()['access-control-allow-origin'];
			expect(allowedOrigin).toBe('https://malathon.github.io');
		});

		test('should allow requests from localhost development', async ({ request }) => {
			const response = await request.fetch(WORKER_URL, {
				method: 'OPTIONS',
				headers: {
					'Origin': 'http://localhost:5173',
				},
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe('Input Validation', () => {
		test('should reject GET requests', async ({ request }) => {
			const response = await request.get(WORKER_URL);
			expect(response.status()).toBe(405);

			const body = await response.json();
			expect(body.error).toContain('Method not allowed');
		});

		test('should reject requests without labels', async ({ request }) => {
			const response = await request.post(WORKER_URL, {
				data: {
					title: 'Test Title',
					description: 'Test description',
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://malathon.github.io',
				},
			});

			expect(response.status()).toBe(400);
			const body = await response.json();
			expect(body.error).toContain('labels');
		});

		test('should reject requests without title', async ({ request }) => {
			const response = await request.post(WORKER_URL, {
				data: {
					labels: ['bug'],
					description: 'Test description',
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://malathon.github.io',
				},
			});

			expect(response.status()).toBe(400);
			const body = await response.json();
			expect(body.error).toContain('title');
		});

		test('should reject requests without description', async ({ request }) => {
			const response = await request.post(WORKER_URL, {
				data: {
					labels: ['bug'],
					title: 'Test Title',
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://malathon.github.io',
				},
			});

			expect(response.status()).toBe(400);
			const body = await response.json();
			expect(body.error).toContain('description');
		});

		test('should reject empty labels array', async ({ request }) => {
			const response = await request.post(WORKER_URL, {
				data: {
					labels: [],
					title: 'Test Title',
					description: 'Test description',
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://malathon.github.io',
				},
			});

			expect(response.status()).toBe(400);
		});
	});

	test.describe('GitHub Labels API', () => {
		test('should fetch labels from GitHub', async ({ request }) => {
			const response = await request.get(`https://api.github.com/repos/${GITHUB_REPO}/labels`);
			expect(response.status()).toBe(200);

			const labels = await response.json();
			expect(Array.isArray(labels)).toBe(true);
			expect(labels.length).toBeGreaterThan(0);

			// Check label structure
			const firstLabel = labels[0];
			expect(firstLabel).toHaveProperty('name');
			expect(firstLabel).toHaveProperty('color');
		});

		test('should have user-feedback label', async ({ request }) => {
			const response = await request.get(`https://api.github.com/repos/${GITHUB_REPO}/labels`);
			const labels = await response.json();

			const userFeedbackLabel = labels.find((l: any) => l.name === 'user-feedback');
			expect(userFeedbackLabel).toBeTruthy();
		});
	});

	// Note: This test creates a real issue - use sparingly or skip in CI
	test.describe('Issue Creation', () => {
		test.skip('should create issue with valid data (creates real issue)', async ({ request }) => {
			const response = await request.post(WORKER_URL, {
				data: {
					labels: ['bug'],
					title: '[TEST] Automated test issue - please delete',
					description: 'This is an automated test issue created by the test suite. Please delete this issue.',
					page: '/test',
					userAgent: 'Playwright Test',
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://malathon.github.io',
				},
			});

			expect(response.status()).toBe(201);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.issueNumber).toBeTruthy();
			expect(body.issueUrl).toContain('github.com');
		});
	});
});

test.describe('GitHub API Rate Limiting', () => {
	test('should check rate limit status', async ({ request }) => {
		const response = await request.get('https://api.github.com/rate_limit');
		expect(response.status()).toBe(200);

		const rateLimit = await response.json();
		expect(rateLimit.resources.core.remaining).toBeGreaterThan(0);
	});
});
