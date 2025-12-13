<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	interface Question {
		id: string;
		question: string;
		type: string;
		required: boolean;
		options?: { value: string; label: string; description?: string }[];
		triggers?: Record<string, string[]>;
	}

	interface Category {
		id: string;
		name: string;
		order: number;
		questions: Question[];
	}

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

	let categories: Category[] = $state([]);
	let riskSubdomains: RiskSubdomain[] = $state([]);
	let phaseMitigations: Record<string, Mitigation> = $state({});
	let answers: Record<string, string | string[]> = $state({});
	let loading = $state(true);
	let currentStep = $state(0);

	// Derived values for results
	let relevantSubdomains = $derived(getRelevantSubdomainsComputed());
	let selectedPhaseValue = $derived(getSelectedPhase());

	function getRelevantSubdomainsComputed(): RiskSubdomain[] {
		const triggered = getTriggeredSubdomains();
		if (triggered.size === 0) return [];
		return riskSubdomains.filter(s => triggered.has(s.id));
	}

	onMount(async () => {
		try {
			const [questionsRes, subdomainsRes, mitigationsRes] = await Promise.all([
				fetch(`${base}/data/assessment-questions.json`),
				fetch(`${base}/data/risk-subdomains.json`),
				fetch(`${base}/data/phase-mitigations.json`)
			]);

			const questionsData = await questionsRes.json();
			const subdomainsData = await subdomainsRes.json();
			const mitigationsData = await mitigationsRes.json();

			categories = questionsData.questionCategories;
			riskSubdomains = subdomainsData.riskSubdomains;
			phaseMitigations = mitigationsData.phaseMitigations;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	});

	function setAnswer(questionId: string, value: string | string[]) {
		answers = { ...answers, [questionId]: value };
	}

	function toggleMultiSelect(questionId: string, value: string) {
		const current = (answers[questionId] as string[]) || [];
		if (current.includes(value)) {
			setAnswer(questionId, current.filter(v => v !== value));
		} else {
			setAnswer(questionId, [...current, value]);
		}
	}

	function getTriggeredSubdomains(): Set<string> {
		const triggered = new Set<string>();
		for (const category of categories) {
			for (const question of category.questions) {
				const answer = answers[question.id];
				if (!answer || !question.triggers) continue;

				if (question.type === 'yes-no') {
					const triggerIds = question.triggers[answer as string] || [];
					triggerIds.forEach(id => triggered.add(id));
				} else if (question.type === 'single-select') {
					const triggerIds = question.triggers[answer as string] || [];
					triggerIds.forEach(id => triggered.add(id));
				} else if (question.type === 'multi-select') {
					const selectedValues = answer as string[];
					for (const val of selectedValues) {
						const triggerIds = question.triggers[val] || [];
						triggerIds.forEach(id => triggered.add(id));
					}
				}
			}
		}
		return triggered;
	}

	function getRelevantSubdomains(): RiskSubdomain[] {
		const triggered = getTriggeredSubdomains();
		if (triggered.size === 0) return [];
		return riskSubdomains.filter(s => triggered.has(s.id));
	}

	function getSelectedPhase(): string {
		return (answers['phase'] as string) || 'phase-1';
	}

	function getMitigation(subdomainId: string): string {
		const phase = getSelectedPhase();
		const mitigation = phaseMitigations[subdomainId];
		if (!mitigation) return 'No specific mitigation guidance available.';
		return mitigation[phase] || mitigation['phase-1'] || 'No specific mitigation guidance available.';
	}

	function nextStep() {
		if (currentStep < categories.length) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function getProgressPercent(): number {
		const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.filter(q => q.required).length, 0);
		const answeredQuestions = Object.keys(answers).filter(key => {
			const val = answers[key];
			return val && (typeof val === 'string' ? val.length > 0 : val.length > 0);
		}).length;
		return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
	}
</script>

<svelte:head>
	<title>Innovator Checklist - AI Oversight Tools</title>
</svelte:head>

<div class="page-header">
	<h1>AI Research Self-Assessment</h1>
	<p>Answer questions about your AI project to identify potential risks and get mitigation guidance</p>
</div>

{#if loading}
	<div class="loading">Loading assessment questions...</div>
{:else}
	<!-- Progress indicator -->
	<div class="progress-bar">
		<div class="progress-text">
			<span>Step {Math.min(currentStep + 1, categories.length + 1)} of {categories.length + 1}</span>
			<span>{getProgressPercent()}% complete</span>
		</div>
		<div class="progress-track">
			<div class="progress-fill" style="width: {(currentStep / (categories.length)) * 100}%"></div>
		</div>
	</div>

	<!-- Step navigation -->
	<div class="step-nav">
		{#each categories as cat, idx}
			<button
				class="step-dot"
				class:active={currentStep === idx}
				class:completed={currentStep > idx}
				onclick={() => currentStep = idx}
			>
				{idx + 1}
			</button>
		{/each}
		<button
			class="step-dot"
			class:active={currentStep === categories.length}
			onclick={() => currentStep = categories.length}
		>
			Results
		</button>
	</div>

	<!-- Question steps -->
	{#if currentStep < categories.length}
		{@const category = categories[currentStep]}
		<div class="question-panel">
			<h2>{category.name}</h2>

			{#each category.questions as question}
				<div class="question">
					<label class="question-label">
						{question.question}
						{#if question.required}<span class="required">*</span>{/if}
					</label>

					{#if question.type === 'yes-no'}
						<div class="options-row">
							<button
								class="option-btn"
								class:selected={answers[question.id] === 'yes'}
								onclick={() => setAnswer(question.id, 'yes')}
							>Yes</button>
							<button
								class="option-btn"
								class:selected={answers[question.id] === 'no'}
								onclick={() => setAnswer(question.id, 'no')}
							>No</button>
						</div>
					{:else if question.type === 'single-select' && question.options}
						<div class="options-list">
							{#each question.options as option}
								<button
									class="option-card"
									class:selected={answers[question.id] === option.value}
									onclick={() => setAnswer(question.id, option.value)}
								>
									<span class="option-label">{option.label}</span>
									{#if option.description}
										<span class="option-desc">{option.description}</span>
									{/if}
								</button>
							{/each}
						</div>
					{:else if question.type === 'multi-select' && question.options}
						<div class="options-list">
							{#each question.options as option}
								<button
									class="option-card"
									class:selected={(answers[question.id] as string[] || []).includes(option.value)}
									onclick={() => toggleMultiSelect(question.id, option.value)}
								>
									<span class="option-label">{option.label}</span>
									{#if option.description}
										<span class="option-desc">{option.description}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			<div class="nav-buttons">
				<button class="nav-btn secondary" onclick={prevStep} disabled={currentStep === 0}>
					← Previous
				</button>
				<button class="nav-btn primary" onclick={nextStep}>
					{currentStep === categories.length - 1 ? 'View Results' : 'Next →'}
				</button>
			</div>
		</div>
	{:else}
		<!-- Results panel -->
		<div class="results-panel">
			<h2>Assessment Results</h2>

			{#if relevantSubdomains.length === 0}
				<div class="no-results">
					<p>Answer more questions to see relevant risk areas and mitigations.</p>
					<button class="nav-btn primary" onclick={() => currentStep = 0}>Start Assessment</button>
				</div>
			{:else}
				<div class="results-summary">
					<div class="summary-stat">
						<span class="stat-number">{relevantSubdomains.length}</span>
						<span class="stat-label">Risk Areas Identified</span>
					</div>
					<div class="summary-stat">
						<span class="stat-number">{selectedPhaseValue.replace('phase-', 'Phase ')}</span>
						<span class="stat-label">Development Stage</span>
					</div>
				</div>

				<h3>Identified Risk Areas & Mitigations</h3>

				<div class="mitigations">
					{#each relevantSubdomains as subdomain}
						<div class="mitigation-card">
							<div class="mitigation-header">
								<span class="code">{subdomain.code}</span>
								<h4>{subdomain.shortName}</h4>
							</div>
							<p class="mitigation-desc">{subdomain.description}</p>
							<div class="mitigation-content">
								<strong>Recommended Mitigation ({selectedPhaseValue.replace('phase-', 'Phase ')}):</strong>
								<p>{getMitigation(subdomain.id)}</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="nav-buttons">
					<button class="nav-btn secondary" onclick={() => currentStep = 0}>
						← Edit Responses
					</button>
					<a href="{base}/reviewer" class="nav-btn primary">
						View Full Reviewer Checklist →
					</a>
				</div>
			{/if}
		</div>
	{/if}
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

	.progress-bar {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
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
		background: #60a5fa;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.step-nav {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.step-dot {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid #334155;
		background: #1e293b;
		color: #94a3b8;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.step-dot.active {
		border-color: #60a5fa;
		background: #60a5fa;
		color: #0f172a;
	}

	.step-dot.completed {
		border-color: #22c55e;
		background: #22c55e;
		color: #0f172a;
	}

	.question-panel, .results-panel {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.question-panel h2, .results-panel h2 {
		font-size: 1.25rem;
		color: #f1f5f9;
		margin-bottom: 1.5rem;
	}

	.question {
		margin-bottom: 1.5rem;
	}

	.question-label {
		display: block;
		font-size: 0.9375rem;
		color: #e2e8f0;
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.required {
		color: #ef4444;
	}

	.options-row {
		display: flex;
		gap: 0.75rem;
	}

	.option-btn {
		flex: 1;
		max-width: 120px;
		padding: 0.75rem 1.5rem;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		background: #0f172a;
		color: #94a3b8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.option-btn:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.option-btn.selected {
		border-color: #60a5fa;
		background: #1e40af;
		color: #f1f5f9;
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.option-card {
		padding: 0.75rem 1rem;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		background: #0f172a;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.option-card:hover {
		border-color: #60a5fa;
	}

	.option-card.selected {
		border-color: #60a5fa;
		background: rgba(30, 64, 175, 0.3);
	}

	.option-label {
		display: block;
		color: #e2e8f0;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.option-desc {
		display: block;
		color: #94a3b8;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.nav-buttons {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #334155;
	}

	.nav-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
	}

	.nav-btn.primary {
		background: #60a5fa;
		color: #0f172a;
		border: none;
	}

	.nav-btn.primary:hover {
		background: #3b82f6;
	}

	.nav-btn.secondary {
		background: transparent;
		color: #94a3b8;
		border: 1px solid #334155;
	}

	.nav-btn.secondary:hover:not(:disabled) {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.nav-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.results-panel h3 {
		font-size: 1rem;
		color: #f1f5f9;
		margin: 1.5rem 0 1rem;
	}

	.no-results {
		text-align: center;
		padding: 2rem;
		color: #94a3b8;
	}

	.results-summary {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.summary-stat {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		text-align: center;
	}

	.stat-number {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #60a5fa;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.mitigations {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mitigation-card {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.mitigation-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.code {
		background: #f59e0b;
		color: #0f172a;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.mitigation-header h4 {
		color: #f1f5f9;
		font-size: 0.9375rem;
	}

	.mitigation-desc {
		color: #94a3b8;
		font-size: 0.8125rem;
		margin-bottom: 0.75rem;
	}

	.mitigation-content {
		background: #1e293b;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.mitigation-content strong {
		color: #60a5fa;
		display: block;
		margin-bottom: 0.5rem;
	}

	.mitigation-content p {
		color: #e2e8f0;
		line-height: 1.5;
	}
</style>
