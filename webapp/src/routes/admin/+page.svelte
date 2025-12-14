<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Deep clone editable data
	let questions = $state(JSON.parse(JSON.stringify(data.questionCategories)));
	let riskConfigs = $state(JSON.parse(JSON.stringify(data.riskConfigurations)));

	const phases = [
		{ id: 'phase-1', name: 'Phase 1: Discovery', short: 'P1' },
		{ id: 'phase-2', name: 'Phase 2: Validation', short: 'P2' },
		{ id: 'phase-3', name: 'Phase 3: Deployment', short: 'P3' }
	];

	// UI State
	let selectedRiskId = $state<string | null>(null);
	let showQuestionManager = $state(false);
	let showAddTriggerModal = $state(false);
	let pendingTrigger = $state<{ riskId: string; phase: string } | null>(null);
	let searchQuery = $state('');

	// New question form
	let showAddQuestionModal = $state(false);
	let newQuestion = $state({
		id: '',
		question: '',
		type: 'yes-no' as 'yes-no' | 'single-select' | 'multi-select',
		category: '',
		options: [] as Array<{ value: string; label: string }>
	});

	// Build flat list of all questions with their options
	let allQuestions = $derived.by(() => {
		const items: Array<{
			id: string;
			question: string;
			type: string;
			categoryId: string;
			categoryName: string;
			options: Array<{ value: string; label: string }>;
		}> = [];

		for (const cat of questions) {
			for (const q of cat.questions) {
				let options: Array<{ value: string; label: string }> = [];
				if (q.type === 'yes-no') {
					options = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
				} else if (q.options) {
					options = q.options.map((o: any) => ({ value: o.value, label: o.label }));
				}
				items.push({
					id: q.id,
					question: q.question,
					type: q.type,
					categoryId: cat.id,
					categoryName: cat.name,
					options
				});
			}
		}
		return items;
	});

	// Build risk list
	let risks = $derived(
		data.domains.flatMap((d: any) =>
			d.subdomains.map((subId: string) => {
				const sub = data.subdomains.find((s: any) => s.id === subId);
				return sub ? { ...sub, domainName: d.name, domainCode: d.code } : null;
			}).filter(Boolean)
		)
	);

	// Filter risks
	let filteredRisks = $derived(
		risks.filter((r: any) =>
			searchQuery === '' ||
			r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.code.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Selected risk
	let selectedRisk = $derived(risks.find((r: any) => r.id === selectedRiskId));

	// Ensure risk config exists
	function ensureRiskConfig(riskId: string) {
		if (!riskConfigs[riskId]) {
			riskConfigs[riskId] = {
				riskId,
				applicablePhases: [],
				phaseTriggers: {},
				phaseMitigations: {}
			};
		}
	}

	// Check if phase is enabled
	function isPhaseEnabled(riskId: string, phase: string): boolean {
		return riskConfigs[riskId]?.applicablePhases?.includes(phase) || false;
	}

	// Toggle phase
	function togglePhase(riskId: string, phase: string) {
		ensureRiskConfig(riskId);
		const phases = riskConfigs[riskId].applicablePhases;
		if (phases.includes(phase)) {
			riskConfigs[riskId].applicablePhases = phases.filter((p: string) => p !== phase);
			delete riskConfigs[riskId].phaseTriggers[phase];
			delete riskConfigs[riskId].phaseMitigations[phase];
		} else {
			riskConfigs[riskId].applicablePhases = [...phases, phase];
			riskConfigs[riskId].phaseTriggers[phase] = { logic: 'OR', conditions: [] };
			riskConfigs[riskId].phaseMitigations[phase] = '';
		}
	}

	// Get triggers for phase
	function getTriggers(riskId: string, phase: string) {
		return riskConfigs[riskId]?.phaseTriggers?.[phase]?.conditions || [];
	}

	// Get trigger logic
	function getTriggerLogic(riskId: string, phase: string): string {
		return riskConfigs[riskId]?.phaseTriggers?.[phase]?.logic || 'OR';
	}

	// Toggle trigger logic
	function toggleLogic(riskId: string, phase: string) {
		if (!riskConfigs[riskId]?.phaseTriggers?.[phase]) return;
		const current = riskConfigs[riskId].phaseTriggers[phase].logic;
		riskConfigs[riskId].phaseTriggers[phase].logic = current === 'AND' ? 'OR' : 'AND';
	}

	// Add trigger
	function addTrigger(riskId: string, phase: string, questionId: string, answerValues: string[]) {
		ensureRiskConfig(riskId);
		if (!riskConfigs[riskId].phaseTriggers[phase]) {
			riskConfigs[riskId].phaseTriggers[phase] = { logic: 'OR', conditions: [] };
		}
		const existing = riskConfigs[riskId].phaseTriggers[phase].conditions.find(
			(c: any) => c.questionId === questionId
		);
		if (existing) {
			existing.answerValues = answerValues;
		} else {
			riskConfigs[riskId].phaseTriggers[phase].conditions.push({ questionId, answerValues });
		}
	}

	// Remove trigger
	function removeTrigger(riskId: string, phase: string, questionId: string) {
		if (!riskConfigs[riskId]?.phaseTriggers?.[phase]) return;
		riskConfigs[riskId].phaseTriggers[phase].conditions =
			riskConfigs[riskId].phaseTriggers[phase].conditions.filter(
				(c: any) => c.questionId !== questionId
			);
	}

	// Get mitigation
	function getMitigation(riskId: string, phase: string): string {
		return riskConfigs[riskId]?.phaseMitigations?.[phase] || '';
	}

	// Update mitigation
	function updateMitigation(riskId: string, phase: string, text: string) {
		ensureRiskConfig(riskId);
		if (!riskConfigs[riskId].phaseMitigations) {
			riskConfigs[riskId].phaseMitigations = {};
		}
		riskConfigs[riskId].phaseMitigations[phase] = text;
	}

	// Get question by ID
	function getQuestion(questionId: string) {
		return allQuestions.find(q => q.id === questionId);
	}

	// Check if trigger already exists
	function hasTrigger(riskId: string, phase: string, questionId: string): boolean {
		return getTriggers(riskId, phase).some((c: any) => c.questionId === questionId);
	}

	// Question CRUD
	function addQuestion() {
		if (!newQuestion.id || !newQuestion.question || !newQuestion.category) return;
		const category = questions.find((c: any) => c.id === newQuestion.category);
		if (!category) return;

		const questionObj: any = {
			id: newQuestion.id,
			question: newQuestion.question,
			type: newQuestion.type,
			required: true,
			triggers: {}
		};
		if (newQuestion.type !== 'yes-no' && newQuestion.options.length > 0) {
			questionObj.options = newQuestion.options;
		}
		category.questions.push(questionObj);
		newQuestion = { id: '', question: '', type: 'yes-no', category: '', options: [] };
		showAddQuestionModal = false;
	}

	function deleteQuestion(questionId: string) {
		if (!confirm('Delete this question? All its triggers will be removed.')) return;
		for (const cat of questions) {
			cat.questions = cat.questions.filter((q: any) => q.id !== questionId);
		}
		// Remove from all risk configs
		for (const riskId of Object.keys(riskConfigs)) {
			for (const phase of Object.keys(riskConfigs[riskId].phaseTriggers || {})) {
				if (riskConfigs[riskId].phaseTriggers[phase]?.conditions) {
					riskConfigs[riskId].phaseTriggers[phase].conditions =
						riskConfigs[riskId].phaseTriggers[phase].conditions.filter(
							(c: any) => c.questionId !== questionId
						);
				}
			}
		}
	}

	function addOption() {
		newQuestion.options = [...newQuestion.options, { value: '', label: '' }];
	}

	function removeOption(index: number) {
		newQuestion.options = newQuestion.options.filter((_, i) => i !== index);
	}

	// Export
	function exportConfig() {
		const riskConfigOutput = {
			"$schema": "./schemas/risk-configurations.schema.json",
			"version": "1.0.0",
			"lastUpdated": new Date().toISOString().split('T')[0],
			"description": "Phase-aware risk configurations with triggers and mitigations",
			"configurations": riskConfigs
		};
		const blob1 = new Blob([JSON.stringify(riskConfigOutput, null, 2)], { type: 'application/json' });
		const url1 = URL.createObjectURL(blob1);
		const a1 = document.createElement('a');
		a1.href = url1;
		a1.download = 'risk-configurations.json';
		a1.click();
		URL.revokeObjectURL(url1);

		setTimeout(() => {
			const questionsOutput = {
				"$schema": "./schemas/assessment-questions.schema.json",
				"version": "1.1.0",
				"lastUpdated": new Date().toISOString().split('T')[0],
				"source": "Derived from AIHSR Risk Reference Tool v1.5",
				"description": "Assessment questions",
				"questionCategories": questions
			};
			const blob2 = new Blob([JSON.stringify(questionsOutput, null, 2)], { type: 'application/json' });
			const url2 = URL.createObjectURL(blob2);
			const a2 = document.createElement('a');
			a2.href = url2;
			a2.download = 'assessment-questions.json';
			a2.click();
			URL.revokeObjectURL(url2);
		}, 500);
	}

	// Count configured phases for a risk
	function getConfiguredPhaseCount(riskId: string): number {
		return riskConfigs[riskId]?.applicablePhases?.length || 0;
	}
</script>

<svelte:head>
	<title>Risk Configuration - AI Oversight Tools</title>
</svelte:head>

<div class="admin">
	<header class="header">
		<h1>Risk Configuration</h1>
		<div class="header-actions">
			<button class="btn" onclick={() => showQuestionManager = !showQuestionManager}>
				{showQuestionManager ? 'Hide' : 'Manage'} Questions
			</button>
			<button class="btn primary" onclick={exportConfig}>Export Config</button>
		</div>
	</header>

	<div class="layout">
		<!-- Left: Risk List -->
		<aside class="sidebar">
			<input
				type="text"
				placeholder="Search risks..."
				bind:value={searchQuery}
				class="search"
			/>

			<div class="risk-list">
				{#each filteredRisks as risk}
					{@const phaseCount = getConfiguredPhaseCount(risk.id)}
					<button
						class="risk-item"
						class:selected={selectedRiskId === risk.id}
						onclick={() => selectedRiskId = risk.id}
					>
						<div class="risk-item-header">
							<span class="risk-code">{risk.code}</span>
							{#if phaseCount > 0}
								<span class="phase-count">{phaseCount} phase{phaseCount !== 1 ? 's' : ''}</span>
							{/if}
						</div>
						<div class="risk-name">{risk.shortName}</div>
						<div class="risk-domain">{risk.domainCode}</div>
					</button>
				{/each}
			</div>
		</aside>

		<!-- Right: Risk Configuration -->
		<main class="main">
			{#if selectedRisk}
				<div class="risk-config">
					<div class="risk-header">
						<span class="risk-code-large">{selectedRisk.code}</span>
						<h2>{selectedRisk.name}</h2>
					</div>
					<p class="risk-description">{selectedRisk.description}</p>

					<!-- Phase Configurations -->
					<div class="phases">
						{#each phases as phase}
							{@const enabled = isPhaseEnabled(selectedRisk.id, phase.id)}
							{@const triggers = getTriggers(selectedRisk.id, phase.id)}
							{@const logic = getTriggerLogic(selectedRisk.id, phase.id)}

							<div class="phase-card" class:enabled>
								<div class="phase-header">
									<button
										class="phase-toggle"
										class:on={enabled}
										onclick={() => togglePhase(selectedRisk.id, phase.id)}
									>
										{enabled ? '✓' : '○'}
									</button>
									<h3>{phase.name}</h3>
								</div>

								{#if enabled}
									<div class="phase-content">
										<!-- Triggers -->
										<div class="triggers-section">
											<div class="triggers-header">
												<span class="triggers-label">Triggers</span>
												{#if triggers.length > 1}
													<button
														class="logic-btn"
														onclick={() => toggleLogic(selectedRisk.id, phase.id)}
													>
														{logic}
													</button>
												{/if}
											</div>

											{#if triggers.length > 0}
												<div class="trigger-list">
													{#each triggers as trigger}
														{@const q = getQuestion(trigger.questionId)}
														{#if q}
															<div class="trigger-item">
																<div class="trigger-content">
																	<span class="trigger-question">{q.question}</span>
																	<span class="trigger-values">= {trigger.answerValues.join(' or ')}</span>
																</div>
																<button
																	class="remove-btn"
																	onclick={() => removeTrigger(selectedRisk.id, phase.id, trigger.questionId)}
																>×</button>
															</div>
														{/if}
													{/each}
												</div>
											{:else}
												<div class="no-triggers">No triggers configured</div>
											{/if}

											<button
												class="add-trigger-btn"
												onclick={() => {
													pendingTrigger = { riskId: selectedRisk.id, phase: phase.id };
													showAddTriggerModal = true;
												}}
											>+ Add Trigger</button>
										</div>

										<!-- Mitigation -->
										<div class="mitigation-section">
											<label for="mit-{selectedRisk.id}-{phase.id}">Mitigation Guidance</label>
											<textarea
												id="mit-{selectedRisk.id}-{phase.id}"
												value={getMitigation(selectedRisk.id, phase.id)}
												oninput={(e) => updateMitigation(selectedRisk.id, phase.id, e.currentTarget.value)}
												rows="3"
												placeholder="Enter mitigation guidance for this phase..."
											></textarea>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="no-selection">
					<div class="no-selection-icon">📋</div>
					<h3>Select a Risk</h3>
					<p>Choose a risk from the list to configure its phases, triggers, and mitigations.</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<!-- Question Manager Drawer -->
{#if showQuestionManager}
	<div class="drawer-overlay" role="button" tabindex="0" onclick={() => showQuestionManager = false} onkeydown={(e) => e.key === 'Escape' && (showQuestionManager = false)}></div>
	<aside class="drawer">
		<div class="drawer-header">
			<h2>Question Manager</h2>
			<button class="close-btn" onclick={() => showQuestionManager = false}>×</button>
		</div>

		<button class="btn primary full-width" onclick={() => showAddQuestionModal = true}>
			+ Add New Question
		</button>

		<div class="question-list">
			{#each questions as category}
				<div class="question-category">
					<h4>{category.name}</h4>
					{#each category.questions as q}
						<div class="question-item">
							<div class="q-info">
								<span class="q-id">{q.id}</span>
								<span class="q-type">{q.type}</span>
								<span class="q-text">{q.question}</span>
							</div>
							<button class="delete-btn" onclick={() => deleteQuestion(q.id)}>Delete</button>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</aside>
{/if}

<!-- Add Trigger Modal -->
{#if showAddTriggerModal && pendingTrigger}
	{@const currentTriggers = getTriggers(pendingTrigger.riskId, pendingTrigger.phase)}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal">
			<div class="modal-header">
				<h3>Add Trigger</h3>
				<button class="close-btn" onclick={() => { showAddTriggerModal = false; pendingTrigger = null; }}>×</button>
			</div>

			<p class="modal-hint">Select question and answer(s) that should trigger this risk:</p>

			<div class="modal-body">
				{#each allQuestions as q}
					{@const existingTrigger = currentTriggers.find((c: any) => c.questionId === q.id)}
					<div class="question-option" class:has-trigger={existingTrigger}>
						<div class="q-text">{q.question}</div>
						<div class="answer-options">
							{#each q.options as opt}
								<button
									class="answer-btn"
									class:selected={existingTrigger?.answerValues?.includes(opt.value)}
									onclick={() => {
										const current = existingTrigger?.answerValues || [];
										const newValues = current.includes(opt.value)
											? current.filter((v: string) => v !== opt.value)
											: [...current, opt.value];
										if (newValues.length > 0) {
											addTrigger(pendingTrigger.riskId, pendingTrigger.phase, q.id, newValues);
										} else if (existingTrigger) {
											removeTrigger(pendingTrigger.riskId, pendingTrigger.phase, q.id);
										}
									}}
								>
									{opt.label}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-footer">
				<button class="btn primary" onclick={() => { showAddTriggerModal = false; pendingTrigger = null; }}>Done</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Question Modal -->
{#if showAddQuestionModal}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal">
			<div class="modal-header">
				<h3>Add New Question</h3>
				<button class="close-btn" onclick={() => showAddQuestionModal = false}>×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="new-q-id">Question ID</label>
					<input id="new-q-id" type="text" bind:value={newQuestion.id} placeholder="e.g., data-retention" />
				</div>

				<div class="form-group">
					<label for="new-q-text">Question Text</label>
					<input id="new-q-text" type="text" bind:value={newQuestion.question} placeholder="e.g., How long is data retained?" />
				</div>

				<div class="form-group">
					<label for="new-q-type">Type</label>
					<select id="new-q-type" bind:value={newQuestion.type}>
						<option value="yes-no">Yes/No</option>
						<option value="single-select">Single Select</option>
						<option value="multi-select">Multi Select</option>
					</select>
				</div>

				<div class="form-group">
					<label for="new-q-cat">Category</label>
					<select id="new-q-cat" bind:value={newQuestion.category}>
						<option value="">Select category...</option>
						{#each questions as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				{#if newQuestion.type !== 'yes-no'}
					<div class="form-group">
						<label>Answer Options</label>
						{#each newQuestion.options as opt, i}
							<div class="option-row">
								<input type="text" bind:value={opt.value} placeholder="Value" />
								<input type="text" bind:value={opt.label} placeholder="Label" />
								<button class="remove-opt" onclick={() => removeOption(i)}>×</button>
							</div>
						{/each}
						<button class="btn small" onclick={addOption}>+ Add Option</button>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn" onclick={() => showAddQuestionModal = false}>Cancel</button>
				<button class="btn primary" onclick={addQuestion}>Add Question</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 80px);
		overflow: hidden;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.header h1 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		flex: 1;
		overflow: hidden;
	}

	/* Sidebar */
	.sidebar {
		background: #1e293b;
		border-right: 1px solid #334155;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.search {
		margin: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.search:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.risk-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.5rem 0.5rem;
	}

	.risk-item {
		width: 100%;
		text-align: left;
		padding: 0.625rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
		cursor: pointer;
	}

	.risk-item:hover { border-color: #475569; }
	.risk-item.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.1); }

	.risk-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.risk-code {
		font-family: monospace;
		font-size: 0.6875rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.phase-count {
		font-size: 0.625rem;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.risk-name {
		font-size: 0.8125rem;
		color: #e2e8f0;
		margin-bottom: 0.25rem;
	}

	.risk-domain {
		font-size: 0.625rem;
		color: #64748b;
	}

	/* Main Content */
	.main {
		overflow-y: auto;
		padding: 1rem;
	}

	.risk-config {
		max-width: 900px;
	}

	.risk-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.risk-code-large {
		font-family: monospace;
		font-size: 1rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.risk-header h2 {
		font-size: 1.25rem;
		color: #f1f5f9;
	}

	.risk-description {
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	/* Phase Cards */
	.phases {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.phase-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.phase-card.enabled {
		border-color: #475569;
	}

	.phase-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #0f172a;
	}

	.phase-toggle {
		width: 1.5rem;
		height: 1.5rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #64748b;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.phase-toggle.on {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.phase-header h3 {
		font-size: 0.9375rem;
		color: #e2e8f0;
	}

	.phase-content {
		padding: 1rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Triggers Section */
	.triggers-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.triggers-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.triggers-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.logic-btn {
		font-size: 0.625rem;
		padding: 0.125rem 0.5rem;
		background: rgba(251, 191, 36, 0.2);
		border: none;
		border-radius: 0.25rem;
		color: #fbbf24;
		cursor: pointer;
	}

	.trigger-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.trigger-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #0f172a;
		border-radius: 0.375rem;
	}

	.trigger-content {
		flex: 1;
		min-width: 0;
	}

	.trigger-question {
		display: block;
		font-size: 0.75rem;
		color: #e2e8f0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger-values {
		font-size: 0.6875rem;
		color: #22c55e;
	}

	.remove-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.125rem 0.375rem;
	}

	.remove-btn:hover { color: #ef4444; }

	.no-triggers {
		font-size: 0.75rem;
		color: #64748b;
		padding: 0.5rem;
		text-align: center;
		background: #0f172a;
		border-radius: 0.375rem;
	}

	.add-trigger-btn {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		cursor: pointer;
		align-self: flex-start;
	}

	.add-trigger-btn:hover {
		background: #475569;
		color: #e2e8f0;
	}

	/* Mitigation Section */
	.mitigation-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.mitigation-section label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.mitigation-section textarea {
		width: 100%;
		padding: 0.625rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		line-height: 1.5;
		resize: vertical;
		min-height: 80px;
	}

	.mitigation-section textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	/* No Selection */
	.no-selection {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: #64748b;
	}

	.no-selection-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-selection h3 {
		font-size: 1.125rem;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	/* Buttons */
	.btn {
		padding: 0.5rem 1rem;
		background: #334155;
		border: none;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.btn:hover { background: #475569; }
	.btn.primary { background: #60a5fa; color: #0f172a; }
	.btn.primary:hover { background: #3b82f6; }
	.btn.small { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
	.btn.full-width { width: 100%; margin-bottom: 1rem; }

	/* Drawer */
	.drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 90;
	}

	.drawer {
		position: fixed;
		right: 0;
		top: 0;
		bottom: 0;
		width: 400px;
		background: #1e293b;
		border-left: 1px solid #334155;
		z-index: 100;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.drawer-header h2 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.question-list {
		flex: 1;
		overflow-y: auto;
	}

	.question-category {
		margin-bottom: 1rem;
	}

	.question-category h4 {
		font-size: 0.75rem;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.question-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #0f172a;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
	}

	.q-info {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
	}

	.q-id {
		font-family: monospace;
		font-size: 0.625rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.q-type {
		font-size: 0.625rem;
		color: #64748b;
		background: #334155;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.q-text {
		font-size: 0.75rem;
		color: #e2e8f0;
		flex-basis: 100%;
	}

	.delete-btn {
		font-size: 0.6875rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #ef4444;
		cursor: pointer;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.modal-header h3 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.close-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.close-btn:hover { color: #e2e8f0; }

	.modal-hint {
		padding: 0.75rem 1rem;
		font-size: 0.8125rem;
		color: #94a3b8;
		background: #0f172a;
	}

	.modal-body {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem;
		border-top: 1px solid #334155;
	}

	/* Question Options in Modal */
	.question-option {
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.question-option.has-trigger {
		border-color: #22c55e;
	}

	.question-option .q-text {
		font-size: 0.8125rem;
		color: #e2e8f0;
		margin-bottom: 0.5rem;
	}

	.answer-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.answer-btn {
		padding: 0.375rem 0.75rem;
		background: #334155;
		border: 1px solid #475569;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.answer-btn:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.answer-btn.selected {
		background: rgba(34, 197, 94, 0.2);
		border-color: #22c55e;
		color: #22c55e;
	}

	/* Form Groups */
	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.form-group input, .form-group select {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.form-group input:focus, .form-group select:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.option-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.option-row input { flex: 1; }

	.remove-opt {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 1.25rem;
	}

	@media (max-width: 800px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			max-height: 200px;
		}

		.phase-content {
			grid-template-columns: 1fr;
		}

		.drawer {
			width: 100%;
		}
	}
</style>
