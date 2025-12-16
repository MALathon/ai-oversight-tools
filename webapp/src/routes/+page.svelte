<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>AI Oversight Tools - Home</title>
</svelte:head>

<div class="hero">
	<h1>AI Oversight Tools</h1>
	<p class="subtitle">Decision support for AI research ethics review</p>
	<p class="description">
		Based on the 3-Phase IRB Review Framework and the AIHSR Risk Reference Tool by Tamiko Eto
	</p>
</div>

<div class="tools-grid">
	<a href="{base}/risk-matrix" class="tool-card">
		<div class="tool-icon" style="background: #22c55e20; color: #22c55e;">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="18" height="18" rx="2"/>
				<line x1="3" y1="9" x2="21" y2="9"/>
				<line x1="3" y1="15" x2="21" y2="15"/>
				<line x1="9" y1="3" x2="9" y2="21"/>
				<line x1="15" y1="3" x2="15" y2="21"/>
			</svg>
		</div>
		<h2>Risk Matrix</h2>
		<p>Visual 3×3 risk assessment grid based on development phase and patient impact</p>
		<span class="user-badge">For IRB Reviewers</span>
	</a>

	<a href="{base}/reviewer" class="tool-card">
		<div class="tool-icon" style="background: #60a5fa20; color: #60a5fa;">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 11l3 3L22 4"/>
				<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
			</svg>
		</div>
		<h2>Reviewer Checklist</h2>
		<p>Structured prompts for systematic protocol review with CFR references</p>
		<span class="user-badge">For IRB Reviewers</span>
	</a>

	<a href="{base}/protocol-builder" class="tool-card">
		<div class="tool-icon" style="background: #f59e0b20; color: #f59e0b;">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
				<path d="M14 2v6h6"/>
				<line x1="16" y1="13" x2="8" y2="13"/>
				<line x1="16" y1="17" x2="8" y2="17"/>
				<line x1="10" y1="9" x2="8" y2="9"/>
			</svg>
		</div>
		<h2>Protocol Builder</h2>
		<p>Build IRB protocols with risk-based mitigation strategies and controls</p>
		<span class="user-badge">For Researchers</span>
	</a>
</div>

<section class="info-section">
	<h2>The 3-Phase IRB Framework</h2>
	<div class="phases">
		<div class="phase">
			<div class="phase-number">1</div>
			<h3>Discovery</h3>
			<p>Algorithm development using retrospective data. No clinical impact.</p>
		</div>
		<div class="phase">
			<div class="phase-number">2</div>
			<h3>Validation</h3>
			<p>Prospective testing in controlled settings. Limited clinical interaction.</p>
		</div>
		<div class="phase">
			<div class="phase-number">3</div>
			<h3>Clinical/Deployment</h3>
			<p>Live deployment influencing clinical decisions. Ongoing monitoring required.</p>
		</div>
	</div>
</section>

<style>
	.hero {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 1.25rem;
		color: #60a5fa;
		margin-bottom: 0.75rem;
	}

	.description {
		color: #94a3b8;
		max-width: 600px;
		margin: 0 auto;
	}

	.tools-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.tool-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.tool-card:hover {
		border-color: #60a5fa;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(96, 165, 250, 0.1);
	}

	.tool-icon {
		width: 56px;
		height: 56px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.tool-card h2 {
		font-size: 1.25rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.tool-card p {
		color: #94a3b8;
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.user-badge {
		display: inline-block;
		background: #334155;
		color: #94a3b8;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.info-section {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 2rem;
	}

	.info-section h2 {
		font-size: 1.5rem;
		color: #f1f5f9;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.phases {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.phase {
		text-align: center;
	}

	.phase-number {
		width: 40px;
		height: 40px;
		background: #60a5fa;
		color: #0f172a;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
		margin: 0 auto 0.75rem;
	}

	.phase h3 {
		color: #f1f5f9;
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.phase p {
		color: #94a3b8;
		font-size: 0.875rem;
		line-height: 1.4;
	}
</style>
