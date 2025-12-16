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
</style>
