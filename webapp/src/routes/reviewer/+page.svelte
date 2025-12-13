<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	interface Phase {
		id: string;
		name: string;
		shortName: string;
	}

	interface ModelType {
		id: string;
		name: string;
		description: string;
	}

	interface RiskSubdomain {
		id: string;
		code: string;
		name: string;
		shortName: string;
		domain: string;
		description: string;
		cfrReferences: string[];
	}

	interface Prompt {
		text: string;
		phases: string[];
	}

	interface PromptsData {
		[key: string]: {
			shortName: string;
			prompts: Prompt[];
		};
	}

	let phases: Phase[] = $state([]);
	let modelTypes: ModelType[] = $state([]);
	let riskSubdomains: RiskSubdomain[] = $state([]);
	let reviewerPrompts: PromptsData = $state({});
	let modelTypeRelevance: Record<string, string[]> = $state({});

	let selectedPhase: string = $state('');
	let selectedModelTypes: string[] = $state([]);
	let checkedItems: Set<string> = $state(new Set());
	let loading = $state(true);

	onMount(async () => {
		try {
			const [phasesRes, modelsRes, subdomainsRes, promptsRes, schemaRes] = await Promise.all([
				fetch(`${base}/data/phases.json`),
				fetch(`${base}/data/model-types.json`),
				fetch(`${base}/data/risk-subdomains.json`),
				fetch(`${base}/data/reviewer-prompts.json`),
				fetch(`${base}/data/unified-schema.json`)
			]);

			const phasesData = await phasesRes.json();
			const modelsData = await modelsRes.json();
			const subdomainsData = await subdomainsRes.json();
			const promptsData = await promptsRes.json();
			const schemaData = await schemaRes.json();

			phases = phasesData.phases;
			modelTypes = modelsData.modelTypes;
			riskSubdomains = subdomainsData.riskSubdomains;
			reviewerPrompts = promptsData.reviewerPrompts;
			modelTypeRelevance = schemaData.modelTypeToSubdomainRelevance || {};
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	});

	function toggleModelType(id: string) {
		if (selectedModelTypes.includes(id)) {
			selectedModelTypes = selectedModelTypes.filter(m => m !== id);
		} else {
			selectedModelTypes = [...selectedModelTypes, id];
		}
	}

	function getRelevantSubdomains(): RiskSubdomain[] {
		if (selectedModelTypes.length === 0) {
			return riskSubdomains;
		}
		const relevantIds = new Set<string>();
		for (const modelType of selectedModelTypes) {
			const ids = modelTypeRelevance[modelType] || [];
			ids.forEach(id => relevantIds.add(id));
		}
		return riskSubdomains.filter(s => relevantIds.has(s.id));
	}

	function getPromptsForSubdomain(subdomainId: string): Prompt[] {
		const promptData = reviewerPrompts[subdomainId];
		if (!promptData) return [];
		if (!selectedPhase) return promptData.prompts;
		return promptData.prompts.filter(p => p.phases.includes(selectedPhase));
	}

	function toggleCheck(id: string) {
		const newSet = new Set(checkedItems);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		checkedItems = newSet;
	}

	function getProgress(): { checked: number; total: number } {
		let total = 0;
		const relevantSubdomains = getRelevantSubdomains();
		for (const subdomain of relevantSubdomains) {
			const prompts = getPromptsForSubdomain(subdomain.id);
			total += prompts.length;
		}
		return { checked: checkedItems.size, total };
	}

	$effect(() => {
		// Reset checked items when filters change
		checkedItems = new Set();
	});
</script>

<svelte:head>
	<title>Reviewer Checklist - AI Oversight Tools</title>
</svelte:head>

<div class="page-header">
	<h1>IRB Reviewer Checklist</h1>
	<p>Select the development phase and AI model type(s) to see applicable review prompts</p>
</div>

{#if loading}
	<div class="loading">Loading checklist data...</div>
{:else}
	<div class="filters">
		<div class="filter-group">
			<label for="phase-select">Development Phase</label>
			<select id="phase-select" bind:value={selectedPhase}>
				<option value="">All Phases</option>
				{#each phases as phase}
					<option value={phase.id}>{phase.shortName}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label>AI Model Type(s)</label>
			<div class="model-chips">
				{#each modelTypes.slice(0, 8) as model}
					<button
						class="chip"
						class:selected={selectedModelTypes.includes(model.id)}
						onclick={() => toggleModelType(model.id)}
					>
						{model.name}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Progress bar -->
	{@const progress = getProgress()}
	<div class="progress-bar">
		<div class="progress-text">
			<span>Progress: {progress.checked} / {progress.total} items reviewed</span>
			<span>{progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0}%</span>
		</div>
		<div class="progress-track">
			<div class="progress-fill" style="width: {progress.total > 0 ? (progress.checked / progress.total) * 100 : 0}%"></div>
		</div>
	</div>

	<!-- Checklist -->
	<div class="checklist">
		{#each getRelevantSubdomains() as subdomain}
			{@const prompts = getPromptsForSubdomain(subdomain.id)}
			{#if prompts.length > 0}
				<div class="subdomain-section">
					<div class="subdomain-header">
						<div class="subdomain-title">
							<span class="code">{subdomain.code}</span>
							<h2>{subdomain.shortName}</h2>
						</div>
						{#if subdomain.cfrReferences.length > 0}
							<div class="cfr-refs">
								{#each subdomain.cfrReferences.slice(0, 2) as ref}
									<span class="cfr-badge">{ref}</span>
								{/each}
							</div>
						{/if}
					</div>

					<div class="prompts">
						{#each prompts as prompt, idx}
							{@const itemId = `${subdomain.id}-${idx}`}
							<label class="prompt-item" class:checked={checkedItems.has(itemId)}>
								<input
									type="checkbox"
									checked={checkedItems.has(itemId)}
									onchange={() => toggleCheck(itemId)}
								/>
								<span class="prompt-text">{prompt.text}</span>
								<span class="phase-tags">
									{#each prompt.phases as phase}
										<span class="phase-tag">{phase.replace('phase-', 'P')}</span>
									{/each}
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.75rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.page-header p {
		color: #94a3b8;
	}

	.loading {
		text-align: center;
		color: #94a3b8;
		padding: 3rem;
	}

	.filters {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filter-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	select {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		color: #e2e8f0;
		font-size: 0.875rem;
		width: 100%;
		max-width: 300px;
	}

	.model-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 1rem;
		padding: 0.375rem 0.875rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.chip:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.chip.selected {
		background: #1e40af;
		border-color: #60a5fa;
		color: #f1f5f9;
	}

	.progress-bar {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.progress-text {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.progress-track {
		height: 8px;
		background: #0f172a;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #22c55e;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.checklist {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.subdomain-section {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.subdomain-header {
		background: #0f172a;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.subdomain-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.code {
		background: #60a5fa;
		color: #0f172a;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.subdomain-header h2 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.cfr-refs {
		display: flex;
		gap: 0.375rem;
	}

	.cfr-badge {
		background: #334155;
		color: #94a3b8;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
	}

	.prompts {
		padding: 0.5rem;
	}

	.prompt-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.prompt-item:hover {
		background: #0f172a;
	}

	.prompt-item.checked {
		opacity: 0.6;
	}

	.prompt-item input[type="checkbox"] {
		width: 18px;
		height: 18px;
		margin-top: 0.125rem;
		flex-shrink: 0;
		accent-color: #22c55e;
	}

	.prompt-text {
		flex: 1;
		color: #e2e8f0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.phase-tags {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.phase-tag {
		background: #334155;
		color: #94a3b8;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
	}
</style>
