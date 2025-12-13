<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	interface Cell {
		phase: string;
		impact: string;
		riskLevel: string;
		oversightLevel: string;
		color: string;
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

	let cells: Cell[] = [];
	let riskSubdomains: RiskSubdomain[] = [];
	let selectedCell: Cell | null = $state(null);
	let loading = $state(true);

	const phaseLabels: Record<string, string> = {
		'phase-1': 'Discovery',
		'phase-2': 'Validation',
		'phase-3': 'Clinical/Deployment'
	};

	const impactLabels: Record<string, string> = {
		'no-impact': 'No Direct Impact',
		'indirect': 'Indirect Impact',
		'direct-care': 'Direct Care'
	};

	const oversightDescriptions: Record<string, string> = {
		'minimal': 'Expedited administrative review',
		'standard': 'Standard IRB review process',
		'enhanced': 'Additional safeguards required',
		'full': 'Full committee review with ongoing oversight'
	};

	onMount(async () => {
		try {
			const [schemaRes, subdomainsRes] = await Promise.all([
				fetch(`${base}/data/unified-schema.json`),
				fetch(`${base}/data/risk-subdomains.json`)
			]);
			const schema = await schemaRes.json();
			const subdomainsData = await subdomainsRes.json();

			cells = schema.riskMatrix.cells;
			riskSubdomains = subdomainsData.riskSubdomains;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	});

	function getCell(phase: string, impact: string): Cell | undefined {
		return cells.find(c => c.phase === phase && c.impact === impact);
	}

	function handleCellClick(cell: Cell) {
		selectedCell = selectedCell?.phase === cell.phase && selectedCell?.impact === cell.impact ? null : cell;
	}

	function getRelevantSubdomains(cell: Cell): RiskSubdomain[] {
		// Show subdomains based on risk level - higher risk = more subdomains
		const riskLevelMap: Record<string, string[]> = {
			'low': ['privacy-breach-2.1', 'governance-failure-6.5'],
			'medium': ['privacy-breach-2.1', 'unfair-discrimination-1.1', 'lack-transparency-7.4', 'governance-failure-6.5'],
			'high': ['privacy-breach-2.1', 'unfair-discrimination-1.1', 'false-information-3.1', 'overreliance-5.1', 'loss-of-agency-5.2', 'lack-transparency-7.4', 'governance-failure-6.5', 'unequal-performance-1.3']
		};
		const subdomainIds = riskLevelMap[cell.riskLevel] || [];
		return riskSubdomains.filter(s => subdomainIds.includes(s.id));
	}
</script>

<svelte:head>
	<title>Risk Matrix - AI Oversight Tools</title>
</svelte:head>

<div class="page-header">
	<h1>Risk Assessment Matrix</h1>
	<p>Click any cell to see applicable risk subdomains and oversight requirements</p>
</div>

{#if loading}
	<div class="loading">Loading risk matrix...</div>
{:else}
	<div class="matrix-container">
		<div class="matrix">
			<!-- Header row -->
			<div class="cell header corner"></div>
			{#each ['phase-1', 'phase-2', 'phase-3'] as phase}
				<div class="cell header">{phaseLabels[phase]}</div>
			{/each}

			<!-- Data rows -->
			{#each ['direct-care', 'indirect', 'no-impact'] as impact}
				<div class="cell header row-header">{impactLabels[impact]}</div>
				{#each ['phase-1', 'phase-2', 'phase-3'] as phase}
					{@const cell = getCell(phase, impact)}
					{#if cell}
						<button
							class="cell data"
							class:selected={selectedCell?.phase === phase && selectedCell?.impact === impact}
							style="background-color: {cell.color}20; border-color: {cell.color}"
							onclick={() => handleCellClick(cell)}
						>
							<span class="risk-level" style="color: {cell.color}">{cell.riskLevel.toUpperCase()}</span>
							<span class="oversight">{cell.oversightLevel}</span>
						</button>
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Axis labels -->
		<div class="x-axis-label">Development Phase →</div>
		<div class="y-axis-label">← Patient Impact</div>
	</div>

	<!-- Selected cell details -->
	{#if selectedCell}
		<div class="details-panel">
			<div class="details-header" style="border-color: {selectedCell.color}">
				<h2>{phaseLabels[selectedCell.phase]} + {impactLabels[selectedCell.impact]}</h2>
				<div class="badges">
					<span class="badge risk" style="background: {selectedCell.color}">{selectedCell.riskLevel.toUpperCase()} RISK</span>
					<span class="badge oversight">{selectedCell.oversightLevel.toUpperCase()} REVIEW</span>
				</div>
			</div>

			<div class="oversight-description">
				<strong>Oversight Level:</strong> {oversightDescriptions[selectedCell.oversightLevel]}
			</div>

			<h3>Applicable Risk Subdomains</h3>
			<div class="subdomains">
				{#each getRelevantSubdomains(selectedCell) as subdomain}
					<div class="subdomain-card">
						<div class="subdomain-header">
							<span class="code">{subdomain.code}</span>
							<span class="name">{subdomain.shortName}</span>
						</div>
						<p class="description">{subdomain.description}</p>
						{#if subdomain.cfrReferences.length > 0}
							<div class="cfr-refs">
								{#each subdomain.cfrReferences as ref}
									<span class="cfr-badge">{ref}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="action-hint">
				<a href="{base}/reviewer">→ View full reviewer checklist for these risks</a>
			</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="legend">
		<h3>Risk Levels</h3>
		<div class="legend-items">
			<div class="legend-item"><span class="dot" style="background: #22c55e"></span> Low</div>
			<div class="legend-item"><span class="dot" style="background: #eab308"></span> Medium</div>
			<div class="legend-item"><span class="dot" style="background: #f97316"></span> High</div>
		</div>
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

	.matrix-container {
		position: relative;
		margin-bottom: 2rem;
	}

	.matrix {
		display: grid;
		grid-template-columns: 140px repeat(3, 1fr);
		gap: 0.5rem;
		max-width: 800px;
	}

	.cell {
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}

	.cell.header {
		background: #1e293b;
		color: #94a3b8;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.cell.header.corner {
		background: transparent;
	}

	.cell.header.row-header {
		text-align: right;
		padding-right: 1rem;
	}

	.cell.data {
		border: 2px solid;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: 80px;
	}

	.cell.data:hover {
		transform: scale(1.02);
	}

	.cell.data.selected {
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.5);
	}

	.risk-level {
		font-weight: 700;
		font-size: 0.875rem;
	}

	.oversight {
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: capitalize;
	}

	.x-axis-label, .y-axis-label {
		position: absolute;
		color: #64748b;
		font-size: 0.75rem;
	}

	.x-axis-label {
		bottom: -1.5rem;
		left: 50%;
		transform: translateX(-50%);
	}

	.y-axis-label {
		top: 50%;
		left: -2rem;
		transform: rotate(-90deg) translateX(-50%);
		transform-origin: left center;
	}

	.details-panel {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		padding-bottom: 1rem;
		margin-bottom: 1rem;
		border-bottom: 2px solid;
	}

	.details-header h2 {
		font-size: 1.25rem;
		color: #f1f5f9;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.risk {
		color: #0f172a;
	}

	.badge.oversight {
		background: #334155;
		color: #94a3b8;
	}

	.oversight-description {
		background: #0f172a;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		color: #94a3b8;
	}

	.details-panel h3 {
		font-size: 1rem;
		color: #f1f5f9;
		margin-bottom: 1rem;
	}

	.subdomains {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.subdomain-card {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.subdomain-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.code {
		background: #60a5fa;
		color: #0f172a;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.name {
		color: #f1f5f9;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.description {
		color: #94a3b8;
		font-size: 0.8125rem;
		line-height: 1.4;
		margin-bottom: 0.75rem;
	}

	.cfr-refs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.cfr-badge {
		background: #334155;
		color: #94a3b8;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
	}

	.action-hint {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.action-hint a {
		color: #60a5fa;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.action-hint a:hover {
		text-decoration: underline;
	}

	.legend {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
		display: inline-block;
	}

	.legend h3 {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.legend-items {
		display: flex;
		gap: 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #e2e8f0;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}
</style>
