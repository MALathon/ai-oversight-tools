<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State for answers
	let answers = $state<Record<string, string | string[]>>({});

	// State for mitigation decisions per subdomain
	let mitigationDecisions = $state<Record<string, {
		status: 'pending' | 'accepted' | 'custom' | 'not-applicable';
		customText?: string;
		justification?: string;
	}>>({});

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

	// Calculate triggered subdomains using links array (single source of truth)
	let triggeredSubdomains = $derived.by(() => {
		const triggered = new Set<string>();

		// Get trigger links from traceability
		const triggerLinks = data.links.filter((l: any) =>
			l.type === 'trigger' && l.from.entity === 'question' && l.to.entity === 'risk'
		);

		// Check each trigger link against current answers
		for (const link of triggerLinks) {
			const questionId = link.from.id;
			const answer = answers[questionId];
			if (!answer) continue;

			// Check if the answer matches any of the trigger's answerValues
			const answerValues = link.answerValues || [];
			let matches = false;

			if (Array.isArray(answer)) {
				// Multi-select: check if any answer value matches
				matches = answer.some(val => answerValues.includes(val));
			} else {
				// Single value: check direct match
				matches = answerValues.includes(answer);
			}

			if (matches) {
				// Check phase applicability if we have a selected phase
				if (selectedPhase && link.phases && !link.phases.includes(selectedPhase)) {
					continue; // Skip if link doesn't apply to current phase
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

	// Get triggered risks with their suggested mitigations
	let triggeredRisks = $derived.by(() => {
		if (!selectedPhase) return [];

		const risks: Array<{
			subdomain: any;
			domain: any;
			suggestedMitigation: string;
		}> = [];

		for (const domain of data.domains) {
			for (const subId of domain.subdomains) {
				if (!triggeredSubdomains.has(subId)) continue;

				const subdomain = data.subdomains.find((s: any) => s.id === subId);
				if (!subdomain) continue;

				const mitigation = data.phaseMitigations[subId]?.[selectedPhase];
				if (mitigation) {
					risks.push({
						subdomain,
						domain,
						suggestedMitigation: mitigation
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

	function setDecision(subId: string, status: 'accepted' | 'custom' | 'not-applicable') {
		if (!mitigationDecisions[subId]) {
			mitigationDecisions[subId] = { status: 'pending' };
		}
		mitigationDecisions[subId] = { ...mitigationDecisions[subId], status };
	}

	function generateProtocol() {
		let protocol = `# AI Research Protocol - Risk Mitigation Plan\n\n`;
		protocol += `**Development Phase:** ${selectedPhase.replace('phase-', 'Phase ')}\n\n`;

		for (const risk of triggeredRisks) {
			const decision = mitigationDecisions[risk.subdomain.id];
			protocol += `## ${risk.subdomain.code}: ${risk.subdomain.name}\n`;
			protocol += `*${risk.domain.name}*\n\n`;

			if (!decision || decision.status === 'pending') {
				protocol += `**Status:** Pending review\n\n`;
				protocol += `**Suggested Mitigation:**\n${risk.suggestedMitigation}\n\n`;
			} else if (decision.status === 'accepted') {
				protocol += `**Mitigation Plan:**\n${risk.suggestedMitigation}\n\n`;
			} else if (decision.status === 'custom') {
				protocol += `**Custom Mitigation Plan:**\n${decision.customText || '[No custom text provided]'}\n\n`;
			} else if (decision.status === 'not-applicable') {
				protocol += `**Status:** Not Applicable\n`;
				protocol += `**Justification:** ${decision.justification || '[No justification provided]'}\n\n`;
			}
		}

		navigator.clipboard.writeText(protocol);
		alert('Protocol copied to clipboard!');
	}

	let completedCount = $derived(
		triggeredRisks.filter(r => {
			const d = mitigationDecisions[r.subdomain.id];
			return d && d.status !== 'pending';
		}).length
	);

	let hasAnswers = $derived(selectedPhase !== '');
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

	<!-- Right: Identified Risks & Mitigations -->
	<div class="risks-panel">
		<div class="panel-header">
			<div>
				<h2>Identified Risks</h2>
				{#if triggeredRisks.length > 0}
					<p class="progress">{completedCount} of {triggeredRisks.length} addressed</p>
				{/if}
			</div>
			{#if triggeredRisks.length > 0}
				<button class="generate-btn" onclick={generateProtocol}>Copy Protocol</button>
			{/if}
		</div>

		{#if !hasAnswers}
			<div class="empty">Select a development phase to identify risks.</div>
		{:else if triggeredRisks.length === 0}
			<div class="empty">Answer more questions to identify applicable risks.</div>
		{:else}
			{#each triggeredRisks as risk}
				{@const decision = mitigationDecisions[risk.subdomain.id] || { status: 'pending' }}
				<div class="risk-card" class:addressed={decision.status !== 'pending'}>
					<div class="risk-header">
						<span class="code">{risk.subdomain.code}</span>
						<span class="risk-name">{risk.subdomain.shortName}</span>
						<span class="domain-tag">{risk.domain.name}</span>
					</div>

					<div class="suggested-mitigation">
						<h4>Suggested Mitigation</h4>
						<p>{risk.suggestedMitigation}</p>
					</div>

					<div class="decision-buttons">
						<button
							class="decision-btn accept"
							class:active={decision.status === 'accepted'}
							onclick={() => setDecision(risk.subdomain.id, 'accepted')}
						>
							Accept
						</button>
						<button
							class="decision-btn custom"
							class:active={decision.status === 'custom'}
							onclick={() => setDecision(risk.subdomain.id, 'custom')}
						>
							Custom
						</button>
						<button
							class="decision-btn na"
							class:active={decision.status === 'not-applicable'}
							onclick={() => setDecision(risk.subdomain.id, 'not-applicable')}
						>
							N/A
						</button>
					</div>

					{#if decision.status === 'custom'}
						<div class="custom-input">
							<textarea
								placeholder="Enter your custom mitigation plan..."
								bind:value={mitigationDecisions[risk.subdomain.id].customText}
								rows="3"
							></textarea>
						</div>
					{/if}

					{#if decision.status === 'not-applicable'}
						<div class="custom-input">
							<textarea
								placeholder="Justify why this risk is not applicable..."
								bind:value={mitigationDecisions[risk.subdomain.id].justification}
								rows="2"
							></textarea>
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
	}

	.panel-header .progress {
		font-size: 0.625rem;
		color: #64748b;
	}

	.generate-btn {
		padding: 0.375rem 0.75rem;
		background: #22c55e;
		border: none;
		border-radius: 0.25rem;
		color: #0f172a;
		font-size: 0.6875rem;
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
		margin-bottom: 0.5rem;
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

	.risk-card {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #334155;
	}

	.risk-card.addressed {
		background: rgba(34, 197, 94, 0.05);
	}

	.risk-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.risk-header .code {
		font-family: monospace;
		font-size: 0.5625rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.risk-header .risk-name {
		flex: 1;
		font-size: 0.75rem;
		font-weight: 500;
		color: #f1f5f9;
	}

	.risk-header .domain-tag {
		font-size: 0.5rem;
		color: #64748b;
		background: #0f172a;
		padding: 0.0625rem 0.375rem;
		border-radius: 0.125rem;
	}

	.suggested-mitigation {
		background: #0f172a;
		border-radius: 0.25rem;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.suggested-mitigation h4 {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		margin-bottom: 0.25rem;
	}

	.suggested-mitigation p {
		font-size: 0.6875rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.decision-buttons {
		display: flex;
		gap: 0.375rem;
	}

	.decision-btn {
		flex: 1;
		padding: 0.375rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.625rem;
		font-weight: 500;
		cursor: pointer;
	}

	.decision-btn:hover {
		border-color: #60a5fa;
	}

	.decision-btn.accept.active {
		background: #22c55e;
		border-color: #22c55e;
		color: #0f172a;
	}

	.decision-btn.custom.active {
		background: #60a5fa;
		border-color: #60a5fa;
		color: #0f172a;
	}

	.decision-btn.na.active {
		background: #f59e0b;
		border-color: #f59e0b;
		color: #0f172a;
	}

	.custom-input {
		margin-top: 0.5rem;
	}

	.custom-input textarea {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.6875rem;
		line-height: 1.4;
		resize: vertical;
	}

	.custom-input textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	@media (max-width: 800px) {
		.generator {
			grid-template-columns: 1fr;
			height: auto;
		}

		.questions-panel, .risks-panel {
			max-height: 50vh;
		}
	}
</style>
