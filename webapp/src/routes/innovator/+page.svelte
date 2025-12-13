<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	interface RiskSubdomain {
		id: string;
		code: string;
		name: string;
		shortName: string;
		domain: string;
		description: string;
	}

	interface Mitigation {
		[phase: string]: string;
	}

	let riskSubdomains: RiskSubdomain[] = $state([]);
	let phaseMitigations: Record<string, Mitigation> = $state({});
	let loading = $state(true);

	// Direct selections - no pagination
	let selectedPhase = $state('phase-1');
	let selectedModelTypes = $state<Set<string>>(new Set());
	let toggles = $state<Record<string, boolean>>({
		'patient-data': false,
		'direct-care': false,
		'autonomous': false,
		'continuous-learning': false,
		'black-box': false,
		'generates-content': false,
		'external-api': false,
		'vulnerable-pop': false
	});

	// Active view tab
	let activeTab = $state<'risks' | 'controls'>('risks');

	// Risk trigger mappings
	const triggerMap: Record<string, string[]> = {
		'patient-data': ['privacy-breach-2.1', 'security-vulnerabilities-2.2'],
		'direct-care': ['overreliance-5.1', 'loss-of-agency-5.2', 'false-information-3.1'],
		'autonomous': ['overreliance-5.1', 'loss-of-agency-5.2', 'governance-failure-6.5', 'misaligned-goals-7.1'],
		'continuous-learning': ['lack-robustness-7.3', 'governance-failure-6.5', 'unequal-performance-1.3'],
		'black-box': ['lack-transparency-7.4', 'overreliance-5.1'],
		'generates-content': ['false-information-3.1', 'information-pollution-3.2', 'toxic-content-1.2'],
		'external-api': ['privacy-breach-2.1', 'security-vulnerabilities-2.2', 'governance-failure-6.5'],
		'vulnerable-pop': ['unfair-discrimination-1.1', 'unequal-performance-1.3']
	};

	const modelTypeTriggers: Record<string, string[]> = {
		'llm': ['toxic-content-1.2', 'false-information-3.1', 'privacy-breach-2.1', 'overreliance-5.1'],
		'computer-vision': ['unfair-discrimination-1.1', 'unequal-performance-1.3', 'lack-transparency-7.4'],
		'predictive': ['unfair-discrimination-1.1', 'false-information-3.1', 'lack-robustness-7.3'],
		'recommendation': ['unfair-discrimination-1.1', 'overreliance-5.1', 'loss-of-agency-5.2'],
		'generative': ['false-information-3.1', 'information-pollution-3.2', 'toxic-content-1.2'],
		'foundation': ['lack-transparency-7.4', 'governance-failure-6.5', 'privacy-breach-2.1']
	};

	const modelTypes = [
		{ id: 'llm', label: 'LLM / Chat', icon: '💬' },
		{ id: 'computer-vision', label: 'Vision', icon: '👁️' },
		{ id: 'predictive', label: 'Predictive', icon: '📊' },
		{ id: 'recommendation', label: 'Recommender', icon: '🎯' },
		{ id: 'generative', label: 'Generative', icon: '🎨' },
		{ id: 'foundation', label: 'Foundation', icon: '🏗️' }
	];

	const phases = [
		{ id: 'phase-1', label: 'Phase 1', name: 'Discovery', desc: 'Retrospective data, no clinical impact' },
		{ id: 'phase-2', label: 'Phase 2', name: 'Validation', desc: 'Prospective testing, controlled' },
		{ id: 'phase-3', label: 'Phase 3', name: 'Deployment', desc: 'Live clinical use' }
	];

	// Derived: triggered subdomains
	let triggeredIds = $derived.by(() => {
		const ids = new Set<string>();
		for (const [key, active] of Object.entries(toggles)) {
			if (active && triggerMap[key]) {
				triggerMap[key].forEach(id => ids.add(id));
			}
		}
		for (const mt of selectedModelTypes) {
			if (modelTypeTriggers[mt]) {
				modelTypeTriggers[mt].forEach(id => ids.add(id));
			}
		}
		return ids;
	});

	let relevantSubdomains = $derived(
		riskSubdomains.filter(s => triggeredIds.has(s.id))
	);

	// Group by domain for display
	let groupedRisks = $derived.by(() => {
		const groups: Record<string, RiskSubdomain[]> = {};
		for (const sub of relevantSubdomains) {
			if (!groups[sub.domain]) groups[sub.domain] = [];
			groups[sub.domain].push(sub);
		}
		return groups;
	});

	let riskLevel = $derived.by(() => {
		const count = relevantSubdomains.length;
		if (count === 0) return { label: 'Minimal', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
		if (count <= 3) return { label: 'Low', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' };
		if (count <= 6) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
		if (count <= 9) return { label: 'Elevated', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
		return { label: 'High', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
	});

	onMount(async () => {
		try {
			const [subdomainsRes, mitigationsRes] = await Promise.all([
				fetch(`${base}/data/risk-subdomains.json`),
				fetch(`${base}/data/phase-mitigations.json`)
			]);
			const subdomainsData = await subdomainsRes.json();
			const mitigationsData = await mitigationsRes.json();
			riskSubdomains = subdomainsData.riskSubdomains;
			phaseMitigations = mitigationsData.phaseMitigations;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	});

	function toggleModelType(id: string) {
		const newSet = new Set(selectedModelTypes);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedModelTypes = newSet;
	}

	function getMitigation(subdomainId: string): string {
		const mitigation = phaseMitigations[subdomainId];
		if (!mitigation) return 'No specific mitigation guidance available.';
		return mitigation[selectedPhase] || mitigation['phase-1'] || 'No specific mitigation guidance available.';
	}

	function getPhaseName(phaseId: string): string {
		return phases.find(p => p.id === phaseId)?.name || phaseId;
	}
</script>

<svelte:head>
	<title>Innovator Self-Assessment - AI Oversight Tools</title>
</svelte:head>

{#if loading}
	<div class="loading">Loading...</div>
{:else}
	<div class="dashboard">
		<!-- Left: Controls -->
		<div class="controls">
			<div class="control-section">
				<h2>Development Phase</h2>
				<div class="phase-selector">
					{#each phases as phase}
						<button
							class="phase-btn"
							class:active={selectedPhase === phase.id}
							onclick={() => selectedPhase = phase.id}
						>
							<span class="phase-label">{phase.label}</span>
							<span class="phase-name">{phase.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="control-section">
				<h2>AI Model Type</h2>
				<div class="model-grid">
					{#each modelTypes as mt}
						<button
							class="model-chip"
							class:active={selectedModelTypes.has(mt.id)}
							onclick={() => toggleModelType(mt.id)}
						>
							<span class="model-icon">{mt.icon}</span>
							<span>{mt.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="control-section">
				<h2>Risk Factors</h2>
				<div class="toggles">
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['patient-data']} />
						<span class="toggle-label">Uses patient health data</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['direct-care']} />
						<span class="toggle-label">Directly affects care decisions</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['autonomous']} />
						<span class="toggle-label">Operates autonomously</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['continuous-learning']} />
						<span class="toggle-label">Continuously learns/updates</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['black-box']} />
						<span class="toggle-label">Limited explainability</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['generates-content']} />
						<span class="toggle-label">Generates content/recommendations</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['external-api']} />
						<span class="toggle-label">Uses external APIs/cloud</span>
					</label>
					<label class="toggle-row">
						<input type="checkbox" bind:checked={toggles['vulnerable-pop']} />
						<span class="toggle-label">Vulnerable populations</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Right: Results -->
		<div class="results">
			<!-- Summary Bar -->
			<div class="risk-summary" style="background: {riskLevel.bg}; border-color: {riskLevel.color}">
				<div class="risk-indicator">
					<span class="risk-count" style="color: {riskLevel.color}">{relevantSubdomains.length}</span>
					<span class="risk-text">Risk Areas</span>
				</div>
				<div class="risk-level" style="color: {riskLevel.color}">
					{riskLevel.label} Risk Profile
				</div>
			</div>

			<!-- Tab Navigation -->
			{#if relevantSubdomains.length > 0}
				<div class="tab-nav">
					<button
						class="tab-btn"
						class:active={activeTab === 'risks'}
						onclick={() => activeTab = 'risks'}
					>
						Risk Areas
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'controls'}
						onclick={() => activeTab = 'controls'}
					>
						Risk Control Measures
					</button>
				</div>
			{/if}

			{#if relevantSubdomains.length === 0}
				<div class="empty-state">
					<p>Select options on the left to identify relevant risk areas and control measures for your AI project.</p>
				</div>
			{:else if activeTab === 'risks'}
				<!-- Risk Areas View -->
				<div class="risk-list">
					{#each Object.entries(groupedRisks) as [domain, subs]}
						<div class="domain-group">
							<h3 class="domain-title">{domain}</h3>
							{#each subs as sub}
								<div class="risk-item">
									<span class="risk-code">{sub.code}</span>
									<div class="risk-info">
										<span class="risk-name">{sub.shortName}</span>
										<span class="risk-desc">{sub.description}</span>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{:else}
				<!-- Risk Controls View -->
				<div class="controls-list">
					<div class="controls-header">
						<h3>Tailored Control Measures for {getPhaseName(selectedPhase)}</h3>
						<p class="controls-intro">Based on your selections, implement these controls to mitigate identified risks:</p>
					</div>

					{#each relevantSubdomains as sub, idx}
						<div class="control-card">
							<div class="control-header">
								<span class="control-number">{idx + 1}</span>
								<div class="control-meta">
									<span class="control-code">{sub.code}</span>
									<span class="control-name">{sub.shortName}</span>
								</div>
							</div>
							<div class="control-content">
								<p>{getMitigation(sub.id)}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.loading {
		text-align: center;
		color: #94a3b8;
		padding: 3rem;
	}

	.dashboard {
		display: grid;
		grid-template-columns: 340px 1fr;
		gap: 1.5rem;
		min-height: calc(100vh - 200px);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.control-section {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.control-section h2 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.phase-selector {
		display: flex;
		gap: 0.5rem;
	}

	.phase-btn {
		flex: 1;
		padding: 0.5rem;
		background: #0f172a;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: center;
	}

	.phase-btn:hover {
		border-color: #60a5fa;
	}

	.phase-btn.active {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.15);
	}

	.phase-label {
		display: block;
		font-size: 0.75rem;
		color: #64748b;
	}

	.phase-name {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.model-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.model-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.model-chip:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.model-chip.active {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.15);
		color: #f1f5f9;
	}

	.model-icon {
		font-size: 1rem;
	}

	.toggles {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: #0f172a;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.toggle-row:hover {
		background: #1e293b;
	}

	.toggle-row input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		accent-color: #60a5fa;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.8125rem;
		color: #e2e8f0;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.risk-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border: 2px solid;
		border-radius: 0.75rem;
		transition: all 0.3s ease;
	}

	.risk-indicator {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.risk-count {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.risk-text {
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.risk-level {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.tab-nav {
		display: flex;
		gap: 0.5rem;
		background: #1e293b;
		padding: 0.375rem;
		border-radius: 0.5rem;
	}

	.tab-btn {
		flex: 1;
		padding: 0.625rem 1rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab-btn:hover {
		color: #e2e8f0;
	}

	.tab-btn.active {
		background: #60a5fa;
		color: #0f172a;
	}

	.empty-state {
		background: #1e293b;
		border: 1px dashed #334155;
		border-radius: 0.75rem;
		padding: 3rem;
		text-align: center;
		color: #64748b;
	}

	.risk-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.domain-group {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.domain-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #334155;
	}

	.risk-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #0f172a;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.risk-item:last-child {
		margin-bottom: 0;
	}

	.risk-code {
		background: #f59e0b;
		color: #0f172a;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.risk-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.risk-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #e2e8f0;
	}

	.risk-desc {
		font-size: 0.75rem;
		color: #94a3b8;
		line-height: 1.4;
	}

	/* Controls Tab Styles */
	.controls-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls-header {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(34, 197, 94, 0.1));
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.controls-header h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.controls-intro {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.control-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.control-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #0f172a;
		border-bottom: 1px solid #334155;
	}

	.control-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: #60a5fa;
		color: #0f172a;
		font-size: 0.8125rem;
		font-weight: 700;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.control-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.control-code {
		background: #f59e0b;
		color: #0f172a;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.control-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.control-content {
		padding: 1rem;
	}

	.control-content p {
		font-size: 0.8125rem;
		color: #cbd5e1;
		line-height: 1.6;
	}

	@media (max-width: 900px) {
		.dashboard {
			grid-template-columns: 1fr;
		}
	}
</style>
