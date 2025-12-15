<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State for answers
	let answers = $state<Record<string, string | string[]>>({});

	// State for selected controls per risk
	let selectedControls = $state<Record<string, Set<string>>>({});

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

	// Get triggered risks with available controls
	let triggeredRisks = $derived.by(() => {
		if (!selectedPhase) return [];

		const mitigationLinks = data.links.filter((l: any) =>
			l.type === 'mitigation' && l.from.entity === 'risk' && l.to.entity === 'subcategory'
		);

		const risks: Array<{
			subdomain: any;
			domain: any;
			riskContext: string;
			subcategories: Array<{
				subcategory: any;
				controls: any[];
			}>;
			allControls: any[];
		}> = [];

		for (const domain of data.domains) {
			for (const subId of domain.subdomains) {
				if (!triggeredSubdomains.has(subId)) continue;

				const subdomain = data.subdomains.find((s: any) => s.id === subId);
				if (!subdomain) continue;

				// Get risk context (phaseGuidance) - WHY/WHAT the risk is
				const riskContext = subdomain.phaseGuidance?.[selectedPhase] || '';

				// Find subcategories linked to this risk
				const riskSubcategoryLinks = mitigationLinks.filter((l: any) => l.from.id === subId);
				const subcategoriesWithControls = riskSubcategoryLinks.map((link: any) => {
					const subcategory = data.subcategories.find((s: any) => s.id === link.to.id);
					if (!subcategory) return null;

					// Get controls for this subcategory, filtered by phase and tech type
					let controls = data.controls.filter((c: any) => c.subcategoryId === subcategory.id);

					// Filter by phase
					controls = controls.filter((c: any) =>
						!c.phases || c.phases.length === 0 || c.phases.includes(selectedPhase)
					);

					// Filter by tech type
					if (selectedModelTypes.length > 0) {
						controls = controls.filter((c: any) =>
							!c.techTypes || c.techTypes.includes('all') ||
							c.techTypes.some((t: string) => selectedModelTypes.includes(t))
						);
					}

					return { subcategory, controls };
				}).filter(Boolean);

				// Flatten all controls for this risk
				const allControls = subcategoriesWithControls.flatMap((sc: any) => sc.controls);

				if (riskContext || allControls.length > 0) {
					risks.push({
						subdomain,
						domain,
						riskContext,
						subcategories: subcategoriesWithControls,
						allControls
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

	function toggleControl(riskId: string, controlId: string) {
		if (!selectedControls[riskId]) {
			selectedControls[riskId] = new Set();
		}
		const newSet = new Set(selectedControls[riskId]);
		if (newSet.has(controlId)) {
			newSet.delete(controlId);
		} else {
			newSet.add(controlId);
		}
		selectedControls[riskId] = newSet;
	}

	function selectAllControls(riskId: string, controls: any[]) {
		selectedControls[riskId] = new Set(controls.map(c => c.id));
	}

	function clearAllControls(riskId: string) {
		selectedControls[riskId] = new Set();
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

	// Get selected control count for a risk
	function getSelectedCount(riskId: string): number {
		return selectedControls[riskId]?.size || 0;
	}

	// Total selected controls
	let totalSelectedControls = $derived(
		Object.values(selectedControls).reduce((acc, set) => acc + set.size, 0)
	);

	// Generate protocol from selected controls
	function generateProtocol() {
		const phaseName = selectedPhase.replace('phase-', 'Phase ');
		let protocol = `# AI Research Protocol - Risk Mitigation Plan\n\n`;
		protocol += `**Development Phase:** ${phaseName}\n`;
		protocol += `**Model Types:** ${selectedModelTypes.join(', ') || 'Not specified'}\n\n`;
		protocol += `---\n\n`;

		for (const risk of triggeredRisks) {
			const riskSelectedIds = selectedControls[risk.subdomain.id] || new Set();
			if (riskSelectedIds.size === 0) continue;

			protocol += `## ${risk.subdomain.code}: ${risk.subdomain.shortName}\n`;
			protocol += `*Domain: ${risk.domain.name}*\n\n`;

			// Risk context
			if (risk.riskContext) {
				protocol += `### Risk Context\n`;
				protocol += `${risk.riskContext}\n\n`;
			}

			// Selected controls and their implementation notes
			protocol += `### Mitigation Approach\n\n`;

			const selectedControlObjects = risk.allControls.filter((c: any) => riskSelectedIds.has(c.id));

			for (const control of selectedControlObjects) {
				const implNote = control.implementationNotes?.[selectedPhase];
				protocol += `**${control.name}**\n`;
				if (implNote) {
					protocol += `${implNote}\n\n`;
				} else {
					protocol += `${control.description || 'No implementation guidance available.'}\n\n`;
				}
			}

			protocol += `---\n\n`;
		}

		if (totalSelectedControls === 0) {
			alert('Please select at least one control measure to generate a protocol.');
			return;
		}

		navigator.clipboard.writeText(protocol);
		alert('Protocol copied to clipboard!');
	}

	let hasAnswers = $derived(selectedPhase !== '');

	// Risks with at least one control selected
	let risksAddressed = $derived(
		triggeredRisks.filter(r => getSelectedCount(r.subdomain.id) > 0).length
	);
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
							<label>{question.question}</label>

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

	<!-- Right: Identified Risks & Control Selection -->
	<div class="risks-panel">
		<div class="panel-header">
			<div>
				<h2>Identified Risks</h2>
				{#if triggeredRisks.length > 0}
					<p class="progress">{risksAddressed} of {triggeredRisks.length} addressed ({totalSelectedControls} controls selected)</p>
				{/if}
			</div>
			{#if triggeredRisks.length > 0}
				<button class="generate-btn" onclick={generateProtocol}>Generate Protocol</button>
			{/if}
		</div>

		{#if !hasAnswers}
			<div class="empty">Select a development phase to identify risks.</div>
		{:else if triggeredRisks.length === 0}
			<div class="empty">Answer more questions to identify applicable risks.</div>
		{:else}
			{#each triggeredRisks as risk}
				{@const isExpanded = expandedRisks.has(risk.subdomain.id)}
				{@const selectedCount = getSelectedCount(risk.subdomain.id)}
				<div class="risk-card" class:has-selections={selectedCount > 0}>
					<button class="risk-header" onclick={() => toggleRiskExpanded(risk.subdomain.id)}>
						<div class="risk-info">
							<span class="code">{risk.subdomain.code}</span>
							<span class="risk-name">{risk.subdomain.shortName}</span>
							<span class="domain-tag">{risk.domain.name}</span>
						</div>
						<div class="risk-meta">
							{#if selectedCount > 0}
								<span class="selected-badge">{selectedCount} selected</span>
							{/if}
							<span class="controls-available">{risk.allControls.length} controls</span>
							<span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
						</div>
					</button>

					{#if isExpanded}
						<div class="risk-body">
							<!-- Risk Context -->
							{#if risk.riskContext}
								<div class="risk-context">
									<h4>Why This Matters ({selectedPhase.replace('phase-', 'Phase ')})</h4>
									<p>{risk.riskContext}</p>
								</div>
							{/if}

							<!-- Control Selection -->
							<div class="controls-section">
								<div class="controls-header">
									<h4>Select Controls to Implement</h4>
									<div class="controls-actions">
										<button class="action-btn" onclick={() => selectAllControls(risk.subdomain.id, risk.allControls)}>Select All</button>
										<button class="action-btn" onclick={() => clearAllControls(risk.subdomain.id)}>Clear</button>
									</div>
								</div>

								{#each risk.subcategories as { subcategory, controls }}
									{#if controls.length > 0}
										<div class="subcategory-group">
											<div class="subcategory-label">{subcategory.name}</div>
											<div class="controls-grid">
												{#each controls as control}
													{@const isSelected = selectedControls[risk.subdomain.id]?.has(control.id)}
													<label class="control-checkbox" class:selected={isSelected}>
														<input
															type="checkbox"
															checked={isSelected}
															onchange={() => toggleControl(risk.subdomain.id, control.id)}
														/>
														<div class="control-content">
															<span class="control-name">{control.name}</span>
															{#if isSelected && control.implementationNotes?.[selectedPhase]}
																<span class="impl-note">{control.implementationNotes[selectedPhase]}</span>
															{/if}
														</div>
													</label>
												{/each}
											</div>
										</div>
									{/if}
								{/each}

								{#if risk.allControls.length === 0}
									<p class="no-controls">No controls match current phase and technology filters.</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.generator {
		display: grid;
		grid-template-columns: 340px 1fr;
		gap: 1rem;
		height: calc(100vh - 140px);
	}

	.questions-panel, .risks-panel {
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
		font-size: 0.875rem;
		color: #f1f5f9;
		margin: 0;
	}

	.panel-header .progress {
		font-size: 0.625rem;
		color: #64748b;
		margin: 0.25rem 0 0 0;
	}

	.generate-btn {
		padding: 0.5rem 1rem;
		background: #22c55e;
		border: none;
		border-radius: 0.375rem;
		color: #0f172a;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.generate-btn:hover {
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
		font-size: 0.625rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		margin: 0 0 0.5rem 0;
	}

	.question {
		margin-bottom: 0.625rem;
	}

	.question:last-child {
		margin-bottom: 0;
	}

	.question label {
		display: block;
		font-size: 0.75rem;
		color: #e2e8f0;
		margin-bottom: 0.375rem;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.option {
		padding: 0.25rem 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.625rem;
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
		padding: 2rem;
		text-align: center;
		color: #64748b;
		font-size: 0.75rem;
	}

	/* Risk Cards */
	.risk-card {
		border-bottom: 1px solid #334155;
	}

	.risk-card.has-selections {
		background: rgba(34, 197, 94, 0.05);
	}

	.risk-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
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
		font-size: 0.625rem;
		font-weight: 700;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.risk-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #f1f5f9;
	}

	.domain-tag {
		font-size: 0.5625rem;
		color: #64748b;
		background: #0f172a;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.risk-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selected-badge {
		font-size: 0.625rem;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.controls-available {
		font-size: 0.625rem;
		color: #64748b;
	}

	.expand-icon {
		font-size: 0.625rem;
		color: #64748b;
	}

	/* Risk Body (expanded) */
	.risk-body {
		padding: 0 1rem 1rem;
	}

	.risk-context {
		background: #0f172a;
		border-radius: 0.375rem;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
		border-left: 3px solid #f59e0b;
	}

	.risk-context h4 {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #f59e0b;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
	}

	.risk-context p {
		font-size: 0.75rem;
		color: #cbd5e1;
		line-height: 1.5;
		margin: 0;
	}

	/* Controls Section */
	.controls-section {
		background: #0f172a;
		border-radius: 0.375rem;
		padding: 0.75rem;
	}

	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.controls-header h4 {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #22c55e;
		margin: 0;
		text-transform: uppercase;
	}

	.controls-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		font-size: 0.5625rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
		cursor: pointer;
	}

	.action-btn:hover {
		border-color: #60a5fa;
		color: #60a5fa;
	}

	.subcategory-group {
		margin-bottom: 0.75rem;
	}

	.subcategory-group:last-child {
		margin-bottom: 0;
	}

	.subcategory-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: #8b5cf6;
		margin-bottom: 0.375rem;
		text-transform: uppercase;
	}

	.controls-grid {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.control-checkbox {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #1e293b;
		border-radius: 0.25rem;
		cursor: pointer;
		border: 1px solid transparent;
	}

	.control-checkbox:hover {
		background: #334155;
	}

	.control-checkbox.selected {
		border-color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
	}

	.control-checkbox input {
		margin-top: 0.125rem;
	}

	.control-content {
		flex: 1;
	}

	.control-name {
		font-size: 0.75rem;
		color: #e2e8f0;
		display: block;
	}

	.impl-note {
		font-size: 0.6875rem;
		color: #22c55e;
		display: block;
		margin-top: 0.25rem;
		font-style: italic;
	}

	.no-controls {
		font-size: 0.75rem;
		color: #64748b;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}
</style>
