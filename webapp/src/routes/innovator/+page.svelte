<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// State
	let answers = $state<Record<string, string | string[]>>({});
	let selectedStrategies = $state<Record<string, Set<string>>>({});
	let expandedRisks = $state<Set<string>>(new Set());
	let controlSearch = $state('');
	let showControlsFor = $state<string | null>(null);

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
	let phaseName = $derived(
		selectedPhase === 'phase-1' ? 'Discovery' :
		selectedPhase === 'phase-2' ? 'Validation' :
		selectedPhase === 'phase-3' ? 'Deployment' : ''
	);

	// Calculate triggered subdomains
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
			let matches = Array.isArray(answer)
				? answer.some(val => answerValues.includes(val))
				: answerValues.includes(answer);
			if (matches) {
				if (selectedPhase && link.phases && !link.phases.includes(selectedPhase)) continue;
				triggered.add(link.to.id);
			}
		}

		// Model type relevance
		for (const modelType of (answers['model-types'] as string[] || [])) {
			const relevantSubdomains = data.modelTypeRelevance[modelType];
			if (relevantSubdomains) relevantSubdomains.forEach((s: string) => triggered.add(s));
		}

		// Vulnerability multipliers
		for (const vuln of (answers['vulnerable-populations'] as string[] || [])) {
			if (vuln === 'none') continue;
			const multiplier = data.vulnerabilityMultipliers[vuln];
			if (multiplier?.triggersSubdomains) {
				multiplier.triggersSubdomains.forEach((s: string) => triggered.add(s));
			}
		}

		return triggered;
	});

	// Get triggered risks with strategies
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

				const riskContext = subdomain.phaseGuidance?.[selectedPhase] || '';
				const riskStrategyLinks = mitigationLinks.filter((l: any) => l.from.id === subId);
				const linkedStrategies = riskStrategyLinks
					.map((link: any) => data.strategies.find((s: any) => s.id === link.to.id))
					.filter(Boolean);

				if (riskContext || linkedStrategies.length > 0) {
					risks.push({ subdomain, domain, riskContext, linkedStrategies });
				}
			}
		}
		return risks;
	});

	// Get controls for a strategy, filtered
	function getControlsForStrategy(strategyId: string): any[] {
		let controls = data.controls.filter((c: any) => c.subcategoryId === strategyId);
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
		// Filter by search
		if (controlSearch.trim()) {
			const search = controlSearch.toLowerCase();
			controls = controls.filter((c: any) =>
				c.name.toLowerCase().includes(search) ||
				c.description?.toLowerCase().includes(search)
			);
		}
		return controls;
	}

	function toggleMulti(questionId: string, value: string) {
		const current = (answers[questionId] as string[]) || [];
		const newSet = new Set(current);
		if (value === 'none') {
			answers[questionId] = ['none'];
			return;
		}
		newSet.delete('none');
		if (newSet.has(value)) newSet.delete(value);
		else newSet.add(value);
		answers[questionId] = Array.from(newSet);
	}

	function toggleStrategy(riskId: string, strategyId: string) {
		if (!selectedStrategies[riskId]) selectedStrategies[riskId] = new Set();
		const newSet = new Set(selectedStrategies[riskId]);
		if (newSet.has(strategyId)) newSet.delete(strategyId);
		else newSet.add(strategyId);
		selectedStrategies[riskId] = newSet;
	}

	function toggleRiskExpanded(riskId: string) {
		const newSet = new Set(expandedRisks);
		if (newSet.has(riskId)) newSet.delete(riskId);
		else newSet.add(riskId);
		expandedRisks = newSet;
	}

	function getSelectedCount(riskId: string): number {
		return selectedStrategies[riskId]?.size || 0;
	}

	function getDefenseCoverage(riskId: string, linkedStrategies: any[]) {
		const selected = selectedStrategies[riskId] || new Set();
		const coverage = { preventive: false, detective: false, corrective: false };
		for (const strategy of linkedStrategies) {
			if (selected.has(strategy.id)) {
				const layer = strategy.defenseLayer as keyof typeof coverage;
				if (layer in coverage) coverage[layer] = true;
			}
		}
		return coverage;
	}

	let totalSelectedStrategies = $derived(
		Object.values(selectedStrategies).reduce((acc, set) => acc + set.size, 0)
	);

	let risksAddressed = $derived(
		triggeredRisks.filter(r => getSelectedCount(r.subdomain.id) > 0).length
	);

	// Protocol items grouped by category
	let protocolByCategory = $derived.by(() => {
		const byCategory: Record<string, Array<{ risk: any; strategy: any; guidance: string }>> = {};
		for (const risk of triggeredRisks) {
			const riskSelected = selectedStrategies[risk.subdomain.id] || new Set();
			for (const strategy of risk.linkedStrategies) {
				if (riskSelected.has(strategy.id)) {
					const guidance = strategy.phaseGuidance?.[selectedPhase] || strategy.description;
					const catId = strategy.categoryId;
					if (!byCategory[catId]) byCategory[catId] = [];
					byCategory[catId].push({ risk, strategy, guidance });
				}
			}
		}
		return byCategory;
	});

	let hasProtocolContent = $derived(Object.keys(protocolByCategory).length > 0);

	function getAppropriateness(strategy: any): string {
		return strategy.phaseAppropriateness?.[selectedPhase] || 'optional';
	}

	// DOCX Export - generates document from scratch
	async function exportDocx() {
		if (!browser) return;

		const { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle, WidthType } = await import('docx');
		const { saveAs } = await import('file-saver');

		const children: any[] = [];

		// Title
		children.push(
			new Paragraph({
				text: 'AI Research Protocol',
				heading: HeadingLevel.TITLE,
				spacing: { after: 100 }
			}),
			new Paragraph({
				text: 'Risk Mitigation Plan',
				spacing: { after: 400 },
				children: [
					new TextRun({ text: 'Risk Mitigation Plan', italics: true, size: 24, color: '666666' })
				]
			})
		);

		// Metadata table
		children.push(
			new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				borders: {
					top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
				},
				rows: [
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Development Phase', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(phaseName || 'Not specified')] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Model Types', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(selectedModelTypes.join(', ') || 'Not specified')] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Risks Addressed', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(`${risksAddressed} of ${triggeredRisks.length}`)] })
						]
					})
				]
			}),
			new Paragraph({ spacing: { after: 400 } })
		);

		// Content by category
		for (const [catId, items] of Object.entries(protocolByCategory)) {
			const catName = items[0]?.strategy.categoryName || catId;

			children.push(
				new Paragraph({
					text: catName,
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);

			for (const item of items) {
				children.push(
					new Paragraph({
						text: `${item.strategy.code} ${item.strategy.name}`,
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					}),
					new Paragraph({
						children: [
							new TextRun({ text: 'Addressing: ', italics: true, color: '666666' }),
							new TextRun({ text: item.risk.subdomain.shortName, italics: true, color: '666666' })
						],
						spacing: { after: 100 }
					}),
					new Paragraph({
						text: item.guidance,
						spacing: { after: 200 }
					})
				);
			}
		}

		const doc = new Document({
			sections: [{
				properties: {},
				children
			}]
		});

		const blob = await Packer.toBlob(doc);
		saveAs(blob, `AI-Protocol-${phaseName}-${new Date().toISOString().split('T')[0]}.docx`);
	}

	// Copy as markdown
	function copyMarkdown() {
		let md = `# AI Research Protocol - Risk Mitigation Plan\n\n`;
		md += `**Phase:** ${phaseName}\n`;
		md += `**Model Types:** ${selectedModelTypes.join(', ') || 'Not specified'}\n`;
		md += `**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

		for (const [catId, items] of Object.entries(protocolByCategory)) {
			md += `## ${items[0]?.strategy.categoryName}\n\n`;
			for (const item of items) {
				md += `### ${item.strategy.code} ${item.strategy.name}\n`;
				md += `*Addressing: ${item.risk.subdomain.shortName}*\n\n`;
				md += `${item.guidance}\n\n`;
			}
		}

		navigator.clipboard.writeText(md);
		alert('Protocol copied to clipboard as Markdown.');
	}
</script>

<svelte:head>
	<title>Protocol Builder - AI Oversight Tools</title>
</svelte:head>

<div class="builder">
	<!-- Header -->
	<header class="builder-header">
		<div class="header-left">
			<h1>Protocol Builder</h1>
			<p class="subtitle">AI Risk Mitigation for Human Subjects Research</p>
		</div>
		<div class="header-right">
			{#if hasProtocolContent}
				<button class="btn btn-secondary" onclick={copyMarkdown}>Copy Markdown</button>
				<button class="btn btn-primary" onclick={exportDocx}>Export DOCX</button>
			{/if}
		</div>
	</header>

	<div class="builder-content">
		<!-- Sidebar: Assessment -->
		<aside class="sidebar">
			<div class="sidebar-section">
				<h2>Assessment</h2>
				{#each visibleCategories as category}
					<fieldset class="question-group">
						<legend>{category.name}</legend>
						{#each category.questions as question}
							{#if checkShowIf(question.showIf)}
								<div class="field">
									<span class="field-label">{question.question}</span>
									<div class="field-options">
										{#if question.type === 'single-select'}
											{#each question.options as option}
												<label class="chip" class:active={answers[question.id] === option.value}>
													<input type="radio" name={question.id} value={option.value}
														checked={answers[question.id] === option.value}
														onchange={() => answers[question.id] = option.value} />
													{option.label}
												</label>
											{/each}
										{:else if question.type === 'multi-select'}
											{#each question.options as option}
												<label class="chip" class:active={(answers[question.id] as string[] || []).includes(option.value)}>
													<input type="checkbox"
														checked={(answers[question.id] as string[] || []).includes(option.value)}
														onchange={() => toggleMulti(question.id, option.value)} />
													{option.label}
												</label>
											{/each}
										{:else if question.type === 'yes-no'}
											<label class="chip" class:active={answers[question.id] === 'yes'}>
												<input type="radio" name={question.id} value="yes"
													checked={answers[question.id] === 'yes'}
													onchange={() => answers[question.id] = 'yes'} />
												Yes
											</label>
											<label class="chip" class:active={answers[question.id] === 'no'}>
												<input type="radio" name={question.id} value="no"
													checked={answers[question.id] === 'no'}
													onchange={() => answers[question.id] = 'no'} />
												No
											</label>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</fieldset>
				{/each}
			</div>
		</aside>

		<!-- Main: Risk Selection -->
		<main class="main-area">
			{#if !selectedPhase}
				<div class="empty-state">
					<h3>Select a Development Phase</h3>
					<p>Choose your project phase in the Assessment panel to identify applicable risks.</p>
				</div>
			{:else if triggeredRisks.length === 0}
				<div class="empty-state">
					<h3>No Risks Identified Yet</h3>
					<p>Answer more assessment questions to identify risks relevant to your project.</p>
				</div>
			{:else}
				<div class="risks-header">
					<h2>Identified Risks ({triggeredRisks.length})</h2>
					<div class="coverage-legend">
						<span class="legend-label">Defense Coverage:</span>
						<span class="legend-item"><span class="dot preventive"></span> Preventive</span>
						<span class="legend-item"><span class="dot detective"></span> Detective</span>
						<span class="legend-item"><span class="dot corrective"></span> Corrective</span>
					</div>
				</div>

				<div class="risks-list">
					{#each triggeredRisks as risk}
						{@const isExpanded = expandedRisks.has(risk.subdomain.id)}
						{@const selectedCount = getSelectedCount(risk.subdomain.id)}
						{@const coverage = getDefenseCoverage(risk.subdomain.id, risk.linkedStrategies)}
						<article class="risk-item" class:addressed={selectedCount > 0}>
							<button class="risk-toggle" onclick={() => toggleRiskExpanded(risk.subdomain.id)}>
								<div class="risk-title">
									<span class="risk-code">{risk.subdomain.code}</span>
									<span class="risk-name">{risk.subdomain.shortName}</span>
								</div>
								<div class="risk-status">
									<div class="coverage-dots">
										<span class="dot preventive" class:filled={coverage.preventive}></span>
										<span class="dot detective" class:filled={coverage.detective}></span>
										<span class="dot corrective" class:filled={coverage.corrective}></span>
									</div>
									{#if selectedCount > 0}
										<span class="count-badge">{selectedCount}</span>
									{/if}
									<span class="chevron">{isExpanded ? '−' : '+'}</span>
								</div>
							</button>

							{#if isExpanded}
								<div class="risk-details">
									{#if risk.riskContext}
										<p class="risk-context">{risk.riskContext}</p>
									{/if}

									<div class="strategies-list">
										{#each data.mitigationCategories as category}
											{@const catStrategies = risk.linkedStrategies.filter((s: any) => s.categoryId === category.id)}
											{#if catStrategies.length > 0}
												<div class="strategy-category">
													<h4>{category.name}</h4>
													{#each catStrategies as strategy}
														{@const isSelected = selectedStrategies[risk.subdomain.id]?.has(strategy.id)}
														{@const appropriateness = getAppropriateness(strategy)}
														<label class="strategy-row" class:selected={isSelected}>
															<input type="checkbox" checked={isSelected}
																onchange={() => toggleStrategy(risk.subdomain.id, strategy.id)} />
															<div class="strategy-info">
																<span class="strategy-code">{strategy.code}</span>
																<span class="strategy-name">{strategy.name}</span>
																<span class="defense-badge {strategy.defenseLayer}">{strategy.defenseLayer.charAt(0).toUpperCase()}</span>
																{#if appropriateness !== 'optional'}
																	<span class="phase-badge {appropriateness}">{appropriateness}</span>
																{/if}
															</div>
															<button class="controls-toggle" onclick={(e) => { e.preventDefault(); e.stopPropagation(); showControlsFor = showControlsFor === strategy.id ? null : strategy.id; }}
																title="View specific controls">
																{getControlsForStrategy(strategy.id).length} controls
															</button>
														</label>
														{#if showControlsFor === strategy.id}
															<div class="controls-panel">
																<div class="controls-search">
																	<input type="text" placeholder="Search controls..." bind:value={controlSearch} />
																</div>
																<div class="controls-list">
																	{#each getControlsForStrategy(strategy.id) as control}
																		<div class="control-item">
																			<strong>{control.name}</strong>
																			{#if control.description}
																				<p>{control.description}</p>
																			{/if}
																		</div>
																	{:else}
																		<p class="no-controls">No controls match filters.</p>
																	{/each}
																</div>
															</div>
														{/if}
													{/each}
												</div>
											{/if}
										{/each}
									</div>
								</div>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</main>

		<!-- Document Preview -->
		<aside class="document-preview">
			<div class="document">
				<div class="document-header">
					<h2>AI Research Protocol</h2>
					<p class="doc-subtitle">Risk Mitigation Plan</p>
				</div>

				<div class="document-meta">
					<div class="meta-row">
						<span class="meta-label">Phase:</span>
						<span class="meta-value">{phaseName || '—'}</span>
					</div>
					<div class="meta-row">
						<span class="meta-label">Model Types:</span>
						<span class="meta-value">{selectedModelTypes.join(', ') || '—'}</span>
					</div>
					<div class="meta-row">
						<span class="meta-label">Risks Addressed:</span>
						<span class="meta-value">{risksAddressed} of {triggeredRisks.length}</span>
					</div>
				</div>

				{#if !hasProtocolContent}
					<div class="document-empty">
						<p>Select mitigation strategies to build your protocol document.</p>
					</div>
				{:else}
					<div class="document-body">
						{#each Object.entries(protocolByCategory) as [catId, items]}
							<section class="doc-section">
								<h3>{items[0]?.strategy.categoryName}</h3>
								{#each items as item}
									<div class="doc-strategy">
										<h4>{item.strategy.code} {item.strategy.name}</h4>
										<p class="doc-risk">Addressing: {item.risk.subdomain.shortName}</p>
										<p class="doc-guidance">{item.guidance}</p>
									</div>
								{/each}
							</section>
						{/each}
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>

<style>
	/* Reset and base */
	.builder {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 80px);
		background: #f8fafc;
		color: #1e293b;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	/* Header */
	.builder-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: white;
		border-bottom: 1px solid #e2e8f0;
	}

	.builder-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: #0f172a;
	}

	.subtitle {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0.25rem 0 0 0;
	}

	.header-right {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid;
		transition: all 0.15s;
	}

	.btn-secondary {
		background: white;
		border-color: #d1d5db;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-primary {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	/* Content layout */
	.builder-content {
		display: grid;
		grid-template-columns: 280px 1fr 360px;
		flex: 1;
		overflow: hidden;
	}

	/* Sidebar */
	.sidebar {
		background: white;
		border-right: 1px solid #e2e8f0;
		overflow-y: auto;
		padding: 1rem;
	}

	.sidebar h2 {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		margin: 0 0 1rem 0;
	}

	.question-group {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.question-group legend {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #475569;
		padding: 0 0.25rem;
	}

	.field {
		margin-bottom: 0.75rem;
	}

	.field:last-child {
		margin-bottom: 0;
	}

	.field-label {
		display: block;
		font-size: 0.75rem;
		color: #334155;
		margin-bottom: 0.375rem;
	}

	.field-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		color: #475569;
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip input {
		display: none;
	}

	.chip:hover {
		border-color: #94a3b8;
	}

	.chip.active {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	/* Main area */
	.main-area {
		overflow-y: auto;
		padding: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.empty-state h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #475569;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		font-size: 0.875rem;
		margin: 0;
	}

	.risks-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.risks-header h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.coverage-legend {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.6875rem;
		color: #64748b;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 2px;
		border: 1px solid;
	}

	.dot.preventive { border-color: #3b82f6; background: transparent; }
	.dot.detective { border-color: #f59e0b; background: transparent; }
	.dot.corrective { border-color: #ef4444; background: transparent; }
	.dot.preventive.filled { background: #3b82f6; }
	.dot.detective.filled { background: #f59e0b; }
	.dot.corrective.filled { background: #ef4444; }

	/* Risk items */
	.risks-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.risk-item {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.risk-item.addressed {
		border-color: #86efac;
		background: #f0fdf4;
	}

	.risk-toggle {
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

	.risk-toggle:hover {
		background: #f8fafc;
	}

	.risk-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.risk-code {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #2563eb;
		background: #eff6ff;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.risk-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #1e293b;
	}

	.risk-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.coverage-dots {
		display: flex;
		gap: 0.125rem;
	}

	.count-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #16a34a;
		background: #dcfce7;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.chevron {
		font-size: 1rem;
		color: #94a3b8;
		font-weight: 300;
	}

	.risk-details {
		padding: 0 1rem 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.risk-context {
		font-size: 0.8125rem;
		color: #475569;
		line-height: 1.6;
		margin: 1rem 0;
		padding: 0.75rem;
		background: #fefce8;
		border-radius: 0.375rem;
		border-left: 3px solid #facc15;
	}

	/* Strategies */
	.strategies-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.strategy-category h4 {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		margin: 0 0 0.5rem 0;
	}

	.strategy-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		margin-bottom: 0.25rem;
	}

	.strategy-row:hover {
		background: #f1f5f9;
	}

	.strategy-row.selected {
		background: #eff6ff;
		border-color: #3b82f6;
	}

	.strategy-row input[type="checkbox"] {
		flex-shrink: 0;
	}

	.strategy-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.strategy-code {
		font-size: 0.625rem;
		color: #64748b;
	}

	.strategy-name {
		font-size: 0.75rem;
		color: #1e293b;
	}

	.defense-badge {
		font-size: 0.5rem;
		font-weight: 700;
		padding: 0.125rem 0.25rem;
		border-radius: 2px;
		color: white;
	}

	.defense-badge.preventive { background: #3b82f6; }
	.defense-badge.detective { background: #f59e0b; }
	.defense-badge.corrective { background: #ef4444; }

	.phase-badge {
		font-size: 0.5625rem;
		padding: 0.0625rem 0.25rem;
		border-radius: 2px;
	}

	.phase-badge.essential { background: #dcfce7; color: #166534; }
	.phase-badge.recommended { background: #dbeafe; color: #1e40af; }
	.phase-badge.overkill { background: #fee2e2; color: #991b1b; }

	.controls-toggle {
		font-size: 0.625rem;
		color: #6366f1;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	.controls-toggle:hover {
		text-decoration: underline;
	}

	.controls-panel {
		margin: 0.5rem 0 0.5rem 1.5rem;
		padding: 0.75rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
	}

	.controls-search input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.controls-list {
		max-height: 200px;
		overflow-y: auto;
	}

	.control-item {
		padding: 0.375rem 0;
		border-bottom: 1px solid #f1f5f9;
		font-size: 0.75rem;
	}

	.control-item:last-child {
		border-bottom: none;
	}

	.control-item strong {
		display: block;
		color: #1e293b;
	}

	.control-item p {
		margin: 0.25rem 0 0 0;
		color: #64748b;
		font-size: 0.6875rem;
	}

	.no-controls {
		font-size: 0.75rem;
		color: #94a3b8;
		text-align: center;
		padding: 1rem;
	}

	/* Document preview */
	.document-preview {
		background: #64748b;
		padding: 1rem;
		overflow-y: auto;
	}

	.document {
		background: white;
		border-radius: 0.25rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		min-height: 100%;
		padding: 1.5rem;
	}

	.document-header {
		text-align: center;
		padding-bottom: 1rem;
		border-bottom: 2px solid #1e293b;
		margin-bottom: 1rem;
	}

	.document-header h2 {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		color: #0f172a;
	}

	.doc-subtitle {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0.25rem 0 0 0;
	}

	.document-meta {
		background: #f8fafc;
		padding: 0.75rem;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		padding: 0.25rem 0;
	}

	.meta-label {
		color: #64748b;
	}

	.meta-value {
		color: #1e293b;
		font-weight: 500;
	}

	.document-empty {
		text-align: center;
		padding: 2rem;
		color: #94a3b8;
		font-size: 0.8125rem;
	}

	.document-body {
		font-size: 0.8125rem;
	}

	.doc-section {
		margin-bottom: 1.5rem;
	}

	.doc-section h3 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #1e293b;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid #e2e8f0;
		margin: 0 0 0.75rem 0;
	}

	.doc-strategy {
		margin-bottom: 1rem;
	}

	.doc-strategy h4 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.25rem 0;
	}

	.doc-risk {
		font-size: 0.6875rem;
		color: #64748b;
		font-style: italic;
		margin: 0 0 0.375rem 0;
	}

	.doc-guidance {
		font-size: 0.75rem;
		color: #334155;
		line-height: 1.6;
		margin: 0;
	}
</style>
