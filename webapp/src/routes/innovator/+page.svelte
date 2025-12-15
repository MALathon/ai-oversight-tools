<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State for answers
	let answers = $state<Record<string, string | string[]>>({});

	// State for selected strategies per risk
	let selectedStrategies = $state<Record<string, Set<string>>>({});

	// Expanded risk cards
	let expandedRisks = $state<Set<string>>(new Set());

	// Check showIf conditions
	function checkShowIf(showIf: Record<string, string | string[]> | undefined): boolean {
		if (!showIf) return true;
		for (const [questionId, requiredValue] of Object.entries(showIf)) {
			const answer = answers[questionId];
			if (!answer) return false;
			if (Array.isArray(requiredValue)) {
				if (Array.isArray(answer)) {
					if (!requiredValue.some(v => answer.includes(v))) return false;
				} else {
					if (!requiredValue.includes(answer)) return false;
				}
			} else {
				if (Array.isArray(answer)) {
					if (!answer.includes(requiredValue)) return false;
				} else {
					if (answer !== requiredValue) return false;
				}
			}
		}
		return true;
	}

	let visibleCategories = $derived(
		data.questionCategories.filter((cat: any) => checkShowIf(cat.showIf))
	);

	let selectedPhase = $derived(answers['phase'] as string || '');
	let selectedModelTypes = $derived((answers['model-types'] as string[]) || []);

	// Calculate triggered subdomains using links array
	let triggeredSubdomains = $derived.by(() => {
		const triggered = new Set<string>();

		const triggerLinks = data.links.filter((l: any) =>
			l.type === 'trigger' && l.from.entity === 'question' && l.to.entity === 'risk'
		);

		for (const link of triggerLinks) {
			const questionId = link.from.id;
			const answer = answers[questionId];
			if (!answer) continue;

			const answerValues = link.answerValues || [];
			let matches = false;

			if (Array.isArray(answer)) {
				matches = answer.some(val => answerValues.includes(val));
			} else {
				matches = answerValues.includes(answer);
			}

			if (matches) {
				if (selectedPhase && link.phases && !link.phases.includes(selectedPhase)) {
					continue;
				}
				triggered.add(link.to.id);
			}
		}

		// Model type relevance
		const modelTypes = answers['model-types'] as string[] || [];
		for (const modelType of modelTypes) {
			const relevantSubdomains = data.modelTypeRelevance[modelType];
			if (relevantSubdomains) {
				for (const subdomain of relevantSubdomains) {
					triggered.add(subdomain);
				}
			}
		}

		// Vulnerability multipliers
		const vulnerabilities = answers['vulnerable-populations'] as string[] || [];
		for (const vuln of vulnerabilities) {
			if (vuln === 'none') continue;
			const multiplier = data.vulnerabilityMultipliers[vuln];
			if (multiplier?.triggersSubdomains) {
				for (const subdomain of multiplier.triggersSubdomains) {
					triggered.add(subdomain);
				}
			}
		}

		return triggered;
	});

	// Get triggered risks with available strategies
	let triggeredRisks = $derived.by(() => {
		if (!selectedPhase) return [];

		const mitigationLinks = data.links.filter((l: any) =>
			l.type === 'mitigation' && l.from.entity === 'risk' && l.to.entity === 'subcategory'
		);

		const risks: Array<{
			subdomain: any;
			domain: any;
			riskContext: string;
			linkedStrategies: any[];
		}> = [];

		for (const domain of data.domains) {
			for (const subId of domain.subdomains) {
				if (!triggeredSubdomains.has(subId)) continue;

				const subdomain = data.subdomains.find((s: any) => s.id === subId);
				if (!subdomain) continue;

				// Get risk context (phaseGuidance) - WHY/WHAT the risk is
				const riskContext = subdomain.phaseGuidance?.[selectedPhase] || '';

				// Find strategies linked to this risk
				const riskStrategyLinks = mitigationLinks.filter((l: any) => l.from.id === subId);
				const linkedStrategies = riskStrategyLinks
					.map((link: any) => data.strategies.find((s: any) => s.id === link.to.id))
					.filter(Boolean);

				if (riskContext || linkedStrategies.length > 0) {
					risks.push({
						subdomain,
						domain,
						riskContext,
						linkedStrategies
					});
				}
			}
		}

		return risks;
	});

	function toggleMulti(questionId: string, value: string) {
		const current = (answers[questionId] as string[]) || [];
		const newSet = new Set(current);

		if (value === 'none') {
			answers[questionId] = ['none'];
			return;
		}

		newSet.delete('none');
		if (newSet.has(value)) {
			newSet.delete(value);
		} else {
			newSet.add(value);
		}
		answers[questionId] = Array.from(newSet);
	}

	function toggleStrategy(riskId: string, strategyId: string) {
		if (!selectedStrategies[riskId]) {
			selectedStrategies[riskId] = new Set();
		}
		const newSet = new Set(selectedStrategies[riskId]);
		if (newSet.has(strategyId)) {
			newSet.delete(strategyId);
		} else {
			newSet.add(strategyId);
		}
		selectedStrategies[riskId] = newSet;
	}

	function toggleRiskExpanded(riskId: string) {
		const newSet = new Set(expandedRisks);
		if (newSet.has(riskId)) {
			newSet.delete(riskId);
		} else {
			newSet.add(riskId);
		}
		expandedRisks = newSet;
	}

	// Get selected strategy count for a risk
	function getSelectedCount(riskId: string): number {
		return selectedStrategies[riskId]?.size || 0;
	}

	// Get defense layer coverage for a risk
	function getDefenseCoverage(riskId: string, linkedStrategies: any[]): { preventive: boolean; detective: boolean; corrective: boolean } {
		const selected = selectedStrategies[riskId] || new Set();
		const coverage = { preventive: false, detective: false, corrective: false };

		for (const strategy of linkedStrategies) {
			if (selected.has(strategy.id)) {
				const layer = strategy.defenseLayer as keyof typeof coverage;
				if (layer in coverage) {
					coverage[layer] = true;
				}
			}
		}
		return coverage;
	}

	// Total selected strategies across all risks
	let totalSelectedStrategies = $derived(
		Object.values(selectedStrategies).reduce((acc, set) => acc + set.size, 0)
	);

	// Risks with at least one strategy selected
	let risksAddressed = $derived(
		triggeredRisks.filter(r => getSelectedCount(r.subdomain.id) > 0).length
	);

	// All selected strategies with their risk context for protocol
	let protocolItems = $derived.by(() => {
		const items: Array<{
			risk: any;
			strategy: any;
			guidance: string;
		}> = [];

		for (const risk of triggeredRisks) {
			const riskSelected = selectedStrategies[risk.subdomain.id] || new Set();
			for (const strategy of risk.linkedStrategies) {
				if (riskSelected.has(strategy.id)) {
					const guidance = strategy.phaseGuidance?.[selectedPhase] || strategy.description;
					items.push({ risk, strategy, guidance });
				}
			}
		}

		return items;
	});

	// Group protocol items by category for display
	let protocolByCategory = $derived.by(() => {
		const byCategory: Record<string, typeof protocolItems> = {};
		for (const item of protocolItems) {
			const catId = item.strategy.categoryId;
			if (!byCategory[catId]) {
				byCategory[catId] = [];
			}
			byCategory[catId].push(item);
		}
		return byCategory;
	});

	function copyProtocol() {
		const phaseName = selectedPhase.replace('phase-', 'Phase ');
		let protocol = `# AI Research Protocol - Risk Mitigation Plan\n\n`;
		protocol += `**Development Phase:** ${phaseName}\n`;
		protocol += `**Model Types:** ${selectedModelTypes.join(', ') || 'Not specified'}\n\n`;
		protocol += `---\n\n`;

		for (const [catId, items] of Object.entries(protocolByCategory)) {
			const catName = items[0]?.strategy.categoryName || catId;
			protocol += `## ${catName}\n\n`;

			for (const item of items) {
				protocol += `### ${item.strategy.code} ${item.strategy.name}\n`;
				protocol += `*Addressing: ${item.risk.subdomain.shortName}*\n\n`;
				protocol += `${item.guidance}\n\n`;
			}
		}

		if (protocolItems.length === 0) {
			alert('Please select at least one mitigation strategy to generate a protocol.');
			return;
		}

		navigator.clipboard.writeText(protocol);
		alert('Protocol copied to clipboard!');
	}

	let hasAnswers = $derived(selectedPhase !== '');

	// Get phase appropriateness badge
	function getAppropriateness(strategy: any): string {
		return strategy.phaseAppropriateness?.[selectedPhase] || 'optional';
	}

	// Defense layer colors
	const layerColors: Record<string, string> = {
		preventive: '#3b82f6',
		detective: '#f59e0b',
		corrective: '#ef4444'
	};
</script>

<svelte:head>
	<title>Protocol Generator - AI Oversight Tools</title>
</svelte:head>

<div class="generator">
	<!-- Left: Questions -->
	<div class="questions-panel">
		<div class="panel-header">
			<h2>Assessment</h2>
		</div>

		{#each visibleCategories as category}
			<div class="category">
				<h3>{category.name}</h3>

				{#each category.questions as question}
					{#if checkShowIf(question.showIf)}
						<div class="question">
							<span class="question-text">{question.question}</span>

							{#if question.type === 'single-select'}
								<div class="options">
									{#each question.options as option}
										<button
											class="option"
											class:selected={answers[question.id] === option.value}
											onclick={() => answers[question.id] = option.value}
										>
											{option.label}
										</button>
									{/each}
								</div>
							{:else if question.type === 'multi-select'}
								<div class="options">
									{#each question.options as option}
										<button
											class="option"
											class:selected={(answers[question.id] as string[] || []).includes(option.value)}
											onclick={() => toggleMulti(question.id, option.value)}
										>
											{option.label}
										</button>
									{/each}
								</div>
							{:else if question.type === 'yes-no'}
								<div class="options">
									<button class="option" class:selected={answers[question.id] === 'yes'} onclick={() => answers[question.id] = 'yes'}>Yes</button>
									<button class="option" class:selected={answers[question.id] === 'no'} onclick={() => answers[question.id] = 'no'}>No</button>
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/each}
	</div>

	<!-- Middle: Identified Risks & Strategy Selection -->
	<div class="risks-panel">
		<div class="panel-header">
			<div>
				<h2>Identified Risks</h2>
				{#if triggeredRisks.length > 0}
					<p class="progress">{risksAddressed} of {triggeredRisks.length} risks addressed</p>
				{/if}
			</div>
		</div>

		{#if !hasAnswers}
			<div class="empty">Select a development phase to identify risks.</div>
		{:else if triggeredRisks.length === 0}
			<div class="empty">Answer more questions to identify applicable risks.</div>
		{:else}
			{#each triggeredRisks as risk}
				{@const isExpanded = expandedRisks.has(risk.subdomain.id)}
				{@const selectedCount = getSelectedCount(risk.subdomain.id)}
				{@const coverage = getDefenseCoverage(risk.subdomain.id, risk.linkedStrategies)}
				<div class="risk-card" class:has-selections={selectedCount > 0}>
					<button class="risk-header" onclick={() => toggleRiskExpanded(risk.subdomain.id)}>
						<div class="risk-info">
							<span class="code">{risk.subdomain.code}</span>
							<span class="risk-name">{risk.subdomain.shortName}</span>
						</div>
						<div class="risk-meta">
							<!-- Swiss cheese indicator -->
							<div class="defense-dots">
								<span class="dot" class:filled={coverage.preventive} style="background-color: {coverage.preventive ? layerColors.preventive : 'transparent'}" title="Preventive">P</span>
								<span class="dot" class:filled={coverage.detective} style="background-color: {coverage.detective ? layerColors.detective : 'transparent'}" title="Detective">D</span>
								<span class="dot" class:filled={coverage.corrective} style="background-color: {coverage.corrective ? layerColors.corrective : 'transparent'}" title="Corrective">C</span>
							</div>
							{#if selectedCount > 0}
								<span class="selected-badge">{selectedCount}</span>
							{/if}
							<span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
						</div>
					</button>

					{#if isExpanded}
						<div class="risk-body">
							<!-- Risk Context -->
							{#if risk.riskContext}
								<div class="risk-context">
									<p>{risk.riskContext}</p>
								</div>
							{/if}

							<!-- Strategy Selection grouped by category -->
							<div class="strategies-section">
								{#each data.mitigationCategories as category}
									{@const categoryStrategies = risk.linkedStrategies.filter((s: any) => s.categoryId === category.id)}
									{#if categoryStrategies.length > 0}
										<div class="category-group">
											<div class="category-label">{category.name}</div>
											{#each categoryStrategies as strategy}
												{@const isSelected = selectedStrategies[risk.subdomain.id]?.has(strategy.id)}
												{@const appropriateness = getAppropriateness(strategy)}
												<label class="strategy-checkbox" class:selected={isSelected} class:essential={appropriateness === 'essential'} class:overkill={appropriateness === 'overkill'}>
													<input
														type="checkbox"
														checked={isSelected}
														onchange={() => toggleStrategy(risk.subdomain.id, strategy.id)}
													/>
													<div class="strategy-content">
														<div class="strategy-header">
															<span class="strategy-code">{strategy.code}</span>
															<span class="strategy-name">{strategy.name}</span>
															<span class="defense-tag" style="background-color: {layerColors[strategy.defenseLayer]}">{strategy.defenseLayer.charAt(0).toUpperCase()}</span>
															{#if appropriateness === 'essential'}
																<span class="appropriateness essential">Essential</span>
															{:else if appropriateness === 'overkill'}
																<span class="appropriateness overkill">Overkill</span>
															{:else if appropriateness === 'recommended'}
																<span class="appropriateness recommended">Recommended</span>
															{/if}
														</div>
														{#if isSelected}
															<span class="strategy-guidance">{strategy.phaseGuidance?.[selectedPhase] || strategy.description}</span>
														{/if}
													</div>
												</label>
											{/each}
										</div>
									{/if}
								{/each}

								{#if risk.linkedStrategies.length === 0}
									<p class="no-strategies">No mitigation strategies linked to this risk.</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Right: Protocol Preview -->
	<div class="protocol-panel">
		<div class="panel-header">
			<div>
				<h2>Protocol Preview</h2>
				<p class="progress">{totalSelectedStrategies} strategies selected</p>
			</div>
			{#if protocolItems.length > 0}
				<button class="copy-btn" onclick={copyProtocol}>Copy</button>
			{/if}
		</div>

		{#if protocolItems.length === 0}
			<div class="empty">
				<p>Select mitigation strategies to build your protocol.</p>
				<div class="legend">
					<div class="legend-title">Defense Layers (Swiss Cheese Model)</div>
					<div class="legend-item">
						<span class="legend-dot" style="background-color: {layerColors.preventive}">P</span>
						<span>Preventive - Stops problems before they occur</span>
					</div>
					<div class="legend-item">
						<span class="legend-dot" style="background-color: {layerColors.detective}">D</span>
						<span>Detective - Identifies problems when they occur</span>
					</div>
					<div class="legend-item">
						<span class="legend-dot" style="background-color: {layerColors.corrective}">C</span>
						<span>Corrective - Fixes problems after detection</span>
					</div>
					<p class="legend-hint">Aim for coverage across all three layers for robust risk mitigation.</p>
				</div>
			</div>
		{:else}
			<div class="protocol-content">
				{#each Object.entries(protocolByCategory) as [catId, items]}
					<div class="protocol-category">
						<h3>{items[0]?.strategy.categoryName}</h3>
						{#each items as item}
							<div class="protocol-item">
								<div class="protocol-item-header">
									<span class="protocol-code">{item.strategy.code}</span>
									<span class="protocol-name">{item.strategy.name}</span>
									<span class="protocol-risk" title={item.risk.subdomain.name}>{item.risk.subdomain.shortName}</span>
								</div>
								<p class="protocol-guidance">{item.guidance}</p>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.generator {
		display: grid;
		grid-template-columns: 280px 1fr 380px;
		gap: 0.75rem;
		height: calc(100vh - 140px);
	}

	.questions-panel, .risks-panel, .protocol-panel {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #334155;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: #1e293b;
		z-index: 10;
	}

	.panel-header h2 {
		font-size: 0.8125rem;
		color: #f1f5f9;
		margin: 0;
	}

	.panel-header .progress {
		font-size: 0.625rem;
		color: #64748b;
		margin: 0.25rem 0 0 0;
	}

	.copy-btn {
		padding: 0.375rem 0.75rem;
		background: #22c55e;
		border: none;
		border-radius: 0.375rem;
		color: #0f172a;
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.copy-btn:hover {
		background: #16a34a;
	}

	.questions-panel {
		padding: 0 0.75rem 0.75rem;
	}

	.category {
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
	}

	.category:last-child {
		border-bottom: none;
	}

	.category h3 {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		margin: 0 0 0.5rem 0;
		letter-spacing: 0.05em;
	}

	.question {
		margin-bottom: 0.5rem;
	}

	.question:last-child {
		margin-bottom: 0;
	}

	.question-text {
		display: block;
		font-size: 0.6875rem;
		color: #e2e8f0;
		margin-bottom: 0.375rem;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.option {
		padding: 0.1875rem 0.375rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.5625rem;
		cursor: pointer;
	}

	.option:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.option.selected {
		background: #60a5fa;
		border-color: #60a5fa;
		color: #0f172a;
	}

	.risks-panel {
		padding: 0;
	}

	.empty {
		padding: 1.5rem;
		text-align: center;
		color: #64748b;
		font-size: 0.75rem;
	}

	/* Risk Cards */
	.risk-card {
		border-bottom: 1px solid #334155;
	}

	.risk-card.has-selections {
		background: rgba(34, 197, 94, 0.03);
	}

	.risk-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.risk-header:hover {
		background: rgba(96, 165, 250, 0.05);
	}

	.risk-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.code {
		font-size: 0.5625rem;
		font-weight: 700;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}

	.risk-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: #f1f5f9;
	}

	.risk-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.defense-dots {
		display: flex;
		gap: 0.125rem;
	}

	.dot {
		width: 1rem;
		height: 1rem;
		border-radius: 0.125rem;
		border: 1px solid #475569;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5rem;
		font-weight: 700;
		color: #475569;
	}

	.dot.filled {
		color: #0f172a;
		border-color: transparent;
	}

	.selected-badge {
		font-size: 0.5625rem;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.15);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.expand-icon {
		font-size: 0.5625rem;
		color: #64748b;
	}

	/* Risk Body (expanded) */
	.risk-body {
		padding: 0 0.75rem 0.75rem;
	}

	.risk-context {
		background: #0f172a;
		border-radius: 0.25rem;
		padding: 0.625rem;
		margin-bottom: 0.625rem;
		border-left: 2px solid #f59e0b;
	}

	.risk-context p {
		font-size: 0.6875rem;
		color: #cbd5e1;
		line-height: 1.5;
		margin: 0;
	}

	/* Strategies Section */
	.strategies-section {
		background: #0f172a;
		border-radius: 0.25rem;
		padding: 0.5rem;
	}

	.category-group {
		margin-bottom: 0.5rem;
	}

	.category-group:last-child {
		margin-bottom: 0;
	}

	.category-label {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #8b5cf6;
		margin-bottom: 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.strategy-checkbox {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		padding: 0.375rem;
		background: #1e293b;
		border-radius: 0.25rem;
		cursor: pointer;
		border: 1px solid transparent;
		margin-bottom: 0.25rem;
	}

	.strategy-checkbox:last-child {
		margin-bottom: 0;
	}

	.strategy-checkbox:hover {
		background: #334155;
	}

	.strategy-checkbox.selected {
		border-color: #22c55e;
		background: rgba(34, 197, 94, 0.08);
	}

	.strategy-checkbox.essential {
		border-left: 2px solid #22c55e;
	}

	.strategy-checkbox.overkill {
		opacity: 0.6;
	}

	.strategy-checkbox input {
		margin-top: 0.125rem;
		flex-shrink: 0;
	}

	.strategy-content {
		flex: 1;
		min-width: 0;
	}

	.strategy-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.strategy-code {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #94a3b8;
	}

	.strategy-name {
		font-size: 0.6875rem;
		color: #e2e8f0;
	}

	.defense-tag {
		font-size: 0.5rem;
		font-weight: 700;
		color: #0f172a;
		padding: 0 0.25rem;
		border-radius: 0.125rem;
	}

	.appropriateness {
		font-size: 0.5rem;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
		font-weight: 500;
	}

	.appropriateness.essential {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.appropriateness.recommended {
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
	}

	.appropriateness.overkill {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.strategy-guidance {
		font-size: 0.625rem;
		color: #94a3b8;
		display: block;
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.no-strategies {
		font-size: 0.6875rem;
		color: #64748b;
		text-align: center;
		padding: 0.75rem;
		margin: 0;
	}

	/* Protocol Panel */
	.protocol-panel {
		background: #0f172a;
	}

	.protocol-panel .panel-header {
		background: #0f172a;
		border-bottom-color: #1e293b;
	}

	.legend {
		text-align: left;
		margin-top: 1rem;
		padding: 0.75rem;
		background: #1e293b;
		border-radius: 0.375rem;
	}

	.legend-title {
		font-size: 0.625rem;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
		font-size: 0.625rem;
		color: #cbd5e1;
	}

	.legend-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 0.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5rem;
		font-weight: 700;
		color: #0f172a;
		flex-shrink: 0;
	}

	.legend-hint {
		font-size: 0.5625rem;
		color: #64748b;
		margin: 0.5rem 0 0 0;
		font-style: italic;
	}

	.protocol-content {
		padding: 0.75rem;
		flex: 1;
	}

	.protocol-category {
		margin-bottom: 1rem;
	}

	.protocol-category:last-child {
		margin-bottom: 0;
	}

	.protocol-category h3 {
		font-size: 0.625rem;
		font-weight: 600;
		color: #8b5cf6;
		text-transform: uppercase;
		margin: 0 0 0.5rem 0;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid #1e293b;
	}

	.protocol-item {
		background: #1e293b;
		border-radius: 0.25rem;
		padding: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.protocol-item:last-child {
		margin-bottom: 0;
	}

	.protocol-item-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.25rem;
	}

	.protocol-code {
		font-size: 0.5625rem;
		font-weight: 700;
		color: #60a5fa;
	}

	.protocol-name {
		font-size: 0.6875rem;
		font-weight: 500;
		color: #f1f5f9;
	}

	.protocol-risk {
		font-size: 0.5rem;
		color: #64748b;
		margin-left: auto;
		background: #0f172a;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}

	.protocol-guidance {
		font-size: 0.625rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0;
	}
</style>
