<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const tools = [
		{ href: '/risk-matrix', label: 'Risk Matrix' },
		{ href: '/reviewer', label: 'Reviewer Checklist' },
		{ href: '/protocol-builder', label: 'Protocol Builder' },
		{ href: '/admin', label: 'Admin' }
	];

	// Feedback modal state
	let showFeedback = $state(false);
	let feedbackTitle = $state('');
	let feedbackDescription = $state('');
	let feedbackSubmitting = $state(false);
	let feedbackSuccess = $state(false);
	let feedbackError = $state('');
	let feedbackIssueUrl = $state('');

	// Labels from GitHub
	interface GitHubLabel {
		name: string;
		color: string;
		description: string | null;
	}
	let availableLabels = $state<GitHubLabel[]>([]);
	let selectedLabels = $state<string[]>([]);
	let labelsLoading = $state(false);

	const WORKER_URL = 'https://ai-oversight-feedback.malathon.workers.dev';
	const GITHUB_REPO = 'MALathon/ai-oversight-tools';

	// Labels to exclude from user selection
	const EXCLUDED_LABELS = ['user-feedback', 'invalid', 'wontfix', 'duplicate', 'good first issue', 'help wanted'];

	async function fetchLabels() {
		if (availableLabels.length > 0) return; // Already fetched
		labelsLoading = true;
		try {
			const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/labels`);
			if (response.ok) {
				const labels: GitHubLabel[] = await response.json();
				availableLabels = labels.filter(l => !EXCLUDED_LABELS.includes(l.name.toLowerCase()));
			}
		} catch (err) {
			console.error('Failed to fetch labels:', err);
		} finally {
			labelsLoading = false;
		}
	}

	function toggleLabel(labelName: string) {
		if (selectedLabels.includes(labelName)) {
			selectedLabels = selectedLabels.filter(l => l !== labelName);
		} else {
			selectedLabels = [...selectedLabels, labelName];
		}
	}

	async function submitFeedback() {
		if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
			feedbackError = 'Please fill in both title and description';
			return;
		}
		if (selectedLabels.length === 0) {
			feedbackError = 'Please select at least one label';
			return;
		}

		feedbackSubmitting = true;
		feedbackError = '';

		try {
			const response = await fetch(WORKER_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					labels: selectedLabels,
					title: feedbackTitle.trim(),
					description: feedbackDescription.trim(),
					page: typeof window !== 'undefined' ? window.location.pathname : '',
					userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
				})
			});

			const data = await response.json();

			if (response.ok && data.success) {
				feedbackSuccess = true;
				feedbackIssueUrl = data.issueUrl;
			} else {
				feedbackError = data.error || 'Failed to submit feedback';
			}
		} catch (err) {
			feedbackError = 'Network error. Please try again.';
		} finally {
			feedbackSubmitting = false;
		}
	}

	function closeFeedback() {
		showFeedback = false;
		// Reset after animation
		setTimeout(() => {
			selectedLabels = [];
			feedbackTitle = '';
			feedbackDescription = '';
			feedbackSuccess = false;
			feedbackError = '';
			feedbackIssueUrl = '';
		}, 200);
	}

	function openFeedback() {
		showFeedback = true;
		feedbackSuccess = false;
		feedbackError = '';
		fetchLabels();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AI Oversight Tools</title>
</svelte:head>

<div class="app">
	<header>
		<nav>
			<a href="{base}/" class="logo">AI Oversight Tools</a>
			<div class="nav-links">
				{#each tools as tool}
					<a
						href="{base}{tool.href}"
						class:active={$page.url.pathname === `${base}${tool.href}` || $page.url.pathname === `${base}${tool.href}/`}
					>
						{tool.label}
					</a>
				{/each}
			</div>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			Based on <a href="https://purl.stanford.edu/zj025zw1714" target="_blank" rel="noopener">AIHSR Risk Reference Tool</a>
			by Tamiko Eto ·
			<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>
		</p>
	</footer>
</div>

<!-- Feedback Button -->
<button class="feedback-button" onclick={openFeedback} aria-label="Submit feedback">
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
	</svg>
	<span>Feedback</span>
</button>

<!-- Feedback Modal -->
{#if showFeedback}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="modal-backdrop" onclick={closeFeedback}>
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="feedback-title" aria-modal="true">
			<div class="modal-header">
				<h2 id="feedback-title">Submit Feedback</h2>
				<button class="close-btn" onclick={closeFeedback} aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>

			{#if feedbackSuccess}
				<div class="modal-body success">
					<div class="success-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
							<polyline points="22 4 12 14.01 9 11.01"></polyline>
						</svg>
					</div>
					<h3>Thank you!</h3>
					<p>Your feedback has been submitted successfully.</p>
					{#if feedbackIssueUrl}
						<a href={feedbackIssueUrl} target="_blank" rel="noopener" class="issue-link">
							View issue on GitHub
						</a>
					{/if}
					<button class="btn primary" onclick={closeFeedback}>Close</button>
				</div>
			{:else}
				<div class="modal-body">
					<div class="form-group">
						<label id="labels-label">Labels</label>
						<div class="labels-container" role="group" aria-labelledby="labels-label">
							{#if labelsLoading}
								<span class="labels-loading">Loading labels...</span>
							{:else if availableLabels.length === 0}
								<span class="labels-loading">No labels available</span>
							{:else}
								{#each availableLabels as label}
									<button
										type="button"
										class="label-chip"
										class:selected={selectedLabels.includes(label.name)}
										style="--label-color: #{label.color}"
										onclick={() => toggleLabel(label.name)}
										title={label.description || label.name}
									>
										{label.name}
									</button>
								{/each}
							{/if}
						</div>
					</div>

					<div class="form-group">
						<label for="feedback-title-input">Title</label>
						<input
							id="feedback-title-input"
							type="text"
							bind:value={feedbackTitle}
							placeholder="Brief summary of your feedback"
						/>
					</div>

					<div class="form-group">
						<label for="feedback-description">Description</label>
						<textarea
							id="feedback-description"
							bind:value={feedbackDescription}
							placeholder="Please describe the issue or suggestion in detail..."
							rows="5"
						></textarea>
					</div>

					<p class="attachment-note">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
						</svg>
						To attach screenshots, add them to the GitHub issue after submission
					</p>

					{#if feedbackError}
						<div class="error-message">{feedbackError}</div>
					{/if}
				</div>

				<div class="modal-footer">
					<button class="btn" onclick={closeFeedback}>Cancel</button>
					<button
						class="btn primary"
						onclick={submitFeedback}
						disabled={feedbackSubmitting || !feedbackTitle.trim() || !feedbackDescription.trim() || selectedLabels.length === 0}
					>
						{feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		background: #0f172a;
		color: #e2e8f0;
		min-height: 100vh;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: #1e293b;
		border-bottom: 1px solid #334155;
		padding: 0.75rem 1.5rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	nav {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: #60a5fa;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 0.5rem;
	}

	.nav-links a {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		color: #94a3b8;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.nav-links a:hover {
		color: #e2e8f0;
		background: #334155;
	}

	.nav-links a.active {
		color: #60a5fa;
		background: rgba(30, 64, 175, 0.2);
	}

	main {
		flex: 1;
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		width: 100%;
	}

	footer {
		background: #1e293b;
		border-top: 1px solid #334155;
		padding: 1rem 1.5rem;
		text-align: center;
	}

	footer p {
		font-size: 0.75rem;
		color: #64748b;
	}

	footer a {
		color: #60a5fa;
		text-decoration: none;
	}

	footer a:hover {
		text-decoration: underline;
	}

	/* Feedback Button */
	.feedback-button {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
		transition: all 0.2s ease;
		z-index: 90;
	}

	.feedback-button:hover {
		background: #2563eb;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
	}

	.feedback-button:active {
		transform: translateY(0);
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}

	.modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #334155;
	}

	.modal-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.close-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #e2e8f0;
	}

	.modal-body {
		padding: 1.25rem;
	}

	.modal-body.success {
		text-align: center;
		padding: 2rem 1.25rem;
	}

	.success-icon {
		color: #4ade80;
		margin-bottom: 1rem;
	}

	.modal-body.success h3 {
		font-size: 1.25rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.modal-body.success p {
		color: #94a3b8;
		margin-bottom: 1rem;
	}

	.issue-link {
		display: inline-block;
		color: #60a5fa;
		text-decoration: none;
		margin-bottom: 1.5rem;
	}

	.issue-link:hover {
		text-decoration: underline;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid #334155;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.labels-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.labels-loading {
		color: #64748b;
		font-size: 0.8125rem;
		font-style: italic;
	}

	.label-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		background: color-mix(in srgb, var(--label-color) 15%, #0f172a);
		border: 1px solid color-mix(in srgb, var(--label-color) 50%, #334155);
		border-radius: 1rem;
		color: color-mix(in srgb, var(--label-color) 80%, white);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.label-chip:hover {
		background: color-mix(in srgb, var(--label-color) 25%, #0f172a);
		border-color: var(--label-color);
	}

	.label-chip.selected {
		background: color-mix(in srgb, var(--label-color) 40%, #0f172a);
		border-color: var(--label-color);
		color: white;
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--label-color) 30%, transparent);
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 100px;
	}

	.attachment-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.5rem;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		color: #f87171;
		padding: 0.625rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		margin-top: 1rem;
	}

	.btn {
		padding: 0.625rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid #334155;
		background: #0f172a;
		color: #e2e8f0;
	}

	.btn:hover {
		background: #1e293b;
	}

	.btn.primary {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	.btn.primary:hover {
		background: #2563eb;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
