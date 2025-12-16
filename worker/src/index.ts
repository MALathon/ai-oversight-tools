/**
 * Cloudflare Worker to create GitHub issues for feedback
 *
 * Environment variables (secrets):
 * - GITHUB_TOKEN: Personal access token with 'repo' scope
 */

interface Env {
	GITHUB_TOKEN: string;
}

interface FeedbackRequest {
	labels: string[];
	title: string;
	description: string;
	page?: string;
	userAgent?: string;
}

const GITHUB_REPO = 'MALathon/ai-oversight-tools';
const ALLOWED_ORIGINS = [
	'https://malathon.github.io',
	'http://localhost:5173',
	'http://localhost:4173'
];

function getCorsHeaders(origin: string | null): HeadersInit {
	const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))
		? origin
		: ALLOWED_ORIGINS[0];

	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400',
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin');
		const corsHeaders = getCorsHeaders(origin);

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Only allow POST
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method not allowed' }), {
				status: 405,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		try {
			const body: FeedbackRequest = await request.json();

			// Validate required fields
			if (!body.labels || !Array.isArray(body.labels) || body.labels.length === 0 || !body.title || !body.description) {
				return new Response(JSON.stringify({ error: 'Missing required fields: labels, title, description' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			// Always include user-feedback label
			const allLabels = [...new Set([...body.labels, 'user-feedback'])];

			// Build issue body with metadata
			const issueBody = `## Description
${body.description}

---
**Labels:** ${body.labels.join(', ')}
**Page:** ${body.page || 'Not specified'}
**User Agent:** ${body.userAgent || 'Not specified'}
**Submitted:** ${new Date().toISOString()}`;

			// Create GitHub issue
			const githubResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
					'Accept': 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'User-Agent': 'AI-Oversight-Feedback-Worker',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: body.title,
					body: issueBody,
					labels: allLabels
				})
			});

			if (!githubResponse.ok) {
				const errorText = await githubResponse.text();
				console.error('GitHub API error:', errorText);
				return new Response(JSON.stringify({ error: 'Failed to create issue', details: errorText }), {
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			const issue = await githubResponse.json() as { number: number; html_url: string };

			return new Response(JSON.stringify({
				success: true,
				issueNumber: issue.number,
				issueUrl: issue.html_url
			}), {
				status: 201,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	}
};
