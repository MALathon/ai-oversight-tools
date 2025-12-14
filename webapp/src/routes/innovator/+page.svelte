<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State for all answers
	let answers = $state<Record<string, string | string[]>>({});

	// Get selected phase
	let selectedPhase = $derived(answers['phase'] as string || '');

	// Calculate triggered subdomains based on all answers
	let triggeredSubdomains = $derived.by(() => {
		const triggered = new Set<string>();

		// Go through each question category and question
		for (const category of data.questionCategories) {
			for (const question of category.questions) {
				const answer = answers[question.id];
				if (!answer) continue;

				const triggers = question.triggers;
				if (!triggers) continue;

				// Handle multi-select (array of values)
				if (Array.isArray(answer)) {
					for (const val of answer) {
						if (triggers[val]) {
							for (const subdomain of triggers[val]) {
								triggered.add(subdomain);
							}
						}
					}
				} else {
					// Single select or yes/no
					if (triggers[answer]) {
						for (const subdomain of triggers[answer]) {
							triggered.add(subdomain);
						}
					}
				}
			}
		}

		// Add model type relevance
		const modelTypes = answers['model-types'] as string[] || [];
		for (const modelType of modelTypes) {
			const relevantSubdomains = data.modelTypeRelevance[modelType];
			if (relevantSubdomains) {
				for (const subdomain of relevantSubdomains) {
					triggered.add(subdomain);
				}
			}
		}

		// Add vulnerability multipliers
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

	// Generate report sections grouped by domain
	let reportSections = $derived.by(() => {
		if (!selectedPhase || triggeredSubdomains.size === 0) return [];

		const sections: Array<{
			domain: { id: string; name: string; description: string };
			items: Array<{
				subdomain: { id: string; code: string; name: string; shortName: string };
				mitigation: string;
			}>;
		}> = [];

		for (const domain of data.domains) {
			const items: typeof sections[0]['items'] = [];

			for (const subdomainId of domain.subdomains) {
				if (!triggeredSubdomains.has(subdomainId)) continue;

				const subdomain = data.subdomains.find((s: any) => s.id === subdomainId);
				if (!subdomain) continue;

				const mitigation = data.phaseMitigations[subdomainId]?.[selectedPhase];
				if (mitigation) {
					items.push({ subdomain, mitigation });
				}
			}

			if (items.length > 0) {
				sections.push({ domain, items });
			}
		}

		return sections;
	});

	// Copy all report sections to clipboard
	function copyAllSections() {
		const text = reportSections.map(section => {
			const header = `## ${section.domain.name}\n`;
			const content = section.items.map(item =>
				`### ${item.subdomain.name}\n${item.mitigation}`
			).join('\n\n');
			return header + content;
		}).join('\n\n');
		navigator.clipboard.writeText(text);
	}

	function copySection(text: string) {
		navigator.clipboard.writeText(text);
	}

	// Toggle multi-select value
	function toggleMulti(questionId: string, value: string) {
		const current = (answers[questionId] as string[]) || [];
		const newSet = new Set(current);

		// Handle "none" specially - clear others if selected
		if (value === 'none') {
			answers[questionId] = ['none'];
			return;
		}

		// Remove "none" if selecting something else
		newSet.delete('none');

		if (newSet.has(value)) {
			newSet.delete(value);
		} else {
			newSet.add(value);
		}
		answers[questionId] = Array.from(newSet);
	}

	let hasContent = $derived(selectedPhase !== '' && triggeredSubdomains.size > 0);
</script>

<svelte:head>
	<title>Protocol Generator - AI Oversight Tools</title>
</svelte:head>

<div class="generator">
	<!-- Left: Questions -->
	<div class="questions">
		<div class="questions-header">
			<h2>Assessment Questions</h2>
			<p>Answer questions to generate protocol language</p>
		</div>

		{#each data.questionCategories as category}
			<div class="category">
				<h3>{category.name}</h3>

				{#each category.questions as question}
					<div class="question">
						<label>{question.question}</label>

						{#if question.type === 'single-select'}
							<div class="options">
								{#each question.options as option}
									<button
										class="option"
										class:selected={answers[question.id] === option.value}
										onclick={() => answers[question.id] = option.value}
										title={option.description}
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
										title={option.description}
									>
										{option.label}
									</button>
								{/each}
							</div>
						{:else if question.type === 'yes-no'}
							<div class="options">
								<button
									class="option"
									class:selected={answers[question.id] === 'yes'}
									onclick={() => answers[question.id] = 'yes'}
								>
									Yes
								</button>
								<button
									class="option"
									class:selected={answers[question.id] === 'no'}
									onclick={() => answers[question.id] = 'no'}
								>
									No
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Right: Report Generator -->
	<div class="report">
		<div class="report-header">
			<div>
				<h2>IRB Protocol Sections</h2>
				<p>Copy these sections into your IRB submission</p>
			</div>
			{#if hasContent}
				<button class="copy-all-btn" onclick={copyAllSections}>Copy All</button>
			{/if}
		</div>

		{#if !hasContent}
			<div class="empty-report">
				<p>Select a development phase and answer questions to generate protocol language.</p>
				<p class="hint">Your answers will trigger relevant risk subdomains, and the system will provide phase-specific mitigation language.</p>
			</div>
		{:else}
			<div class="triggered-summary">
				<span class="count">{triggeredSubdomains.size}</span> risk subdomains identified
			</div>

			{#each reportSections as section}
				<div class="report-section">
					<div class="section-header">
						<h4>{section.domain.name}</h4>
					</div>

					{#each section.items as item}
						<div class="mitigation-item">
							<div class="item-header">
								<span class="code">{item.subdomain.code}</span>
								<span class="name">{item.subdomain.shortName}</span>
								<button class="copy-btn" onclick={() => copySection(item.mitigation)}>Copy</button>
							</div>
							<div class="item-content">{item.mitigation}</div>
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.generator {
		display: grid;
		grid-template-columns: 420px 1fr;
		gap: 1.5rem;
		min-height: calc(100vh - 160px);
	}

	.questions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		max-height: calc(100vh - 160px);
		padding-right: 0.5rem;
	}

	.questions-header {
		margin-bottom: 0.5rem;
	}

	.questions-header h2 {
		font-size: 1.125rem;
		color: #f1f5f9;
		margin-bottom: 0.25rem;
	}

	.questions-header p {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.category {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.category h3 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #334155;
	}

	.question {
		margin-bottom: 0.875rem;
	}

	.question:last-child {
		margin-bottom: 0;
	}

	.question label {
		display: block;
		font-size: 0.8125rem;
		color: #e2e8f0;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.option {
		padding: 0.375rem 0.625rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.1s ease;
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

	.report {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.25rem;
		overflow-y: auto;
		max-height: calc(100vh - 160px);
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #334155;
	}

	.report-header h2 {
		font-size: 1.125rem;
		color: #f1f5f9;
		margin-bottom: 0.25rem;
	}

	.report-header p {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.copy-all-btn {
		padding: 0.5rem 1rem;
		background: #60a5fa;
		border: none;
		border-radius: 0.375rem;
		color: #0f172a;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.copy-all-btn:hover {
		background: #3b82f6;
	}

	.empty-report {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.empty-report p {
		margin-bottom: 0.5rem;
	}

	.empty-report .hint {
		font-size: 0.75rem;
		color: #475569;
	}

	.triggered-summary {
		background: rgba(96, 165, 250, 0.1);
		border: 1px solid rgba(96, 165, 250, 0.3);
		border-radius: 0.375rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.triggered-summary .count {
		font-weight: 700;
		color: #60a5fa;
	}

	.report-section {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.section-header {
		padding: 0.75rem 1rem;
		background: rgba(96, 165, 250, 0.1);
		border-bottom: 1px solid #334155;
	}

	.section-header h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #60a5fa;
		margin: 0;
	}

	.mitigation-item {
		border-bottom: 1px solid #334155;
	}

	.mitigation-item:last-child {
		border-bottom: none;
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: rgba(51, 65, 85, 0.3);
	}

	.item-header .code {
		font-family: monospace;
		font-size: 0.6875rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.item-header .name {
		flex: 1;
		font-size: 0.75rem;
		font-weight: 500;
		color: #e2e8f0;
	}

	.copy-btn {
		padding: 0.25rem 0.625rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.copy-btn:hover {
		background: #60a5fa;
		color: #0f172a;
	}

	.item-content {
		padding: 1rem;
		font-size: 0.8125rem;
		color: #e2e8f0;
		line-height: 1.7;
	}

	@media (max-width: 900px) {
		.generator {
			grid-template-columns: 1fr;
		}

		.questions, .report {
			max-height: none;
		}
	}
</style>
