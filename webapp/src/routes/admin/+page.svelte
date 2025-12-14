<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Deep clone editable data
	let questions = $state(JSON.parse(JSON.stringify(data.questionCategories)));
	let riskConfigs = $state(JSON.parse(JSON.stringify(data.riskConfigurations)));

	// Phases
	const phases = [
		{ id: 'phase-1', name: 'Phase 1: Discovery', short: 'P1' },
		{ id: 'phase-2', name: 'Phase 2: Validation', short: 'P2' },
		{ id: 'phase-3', name: 'Phase 3: Deployment', short: 'P3' }
	];

	// UI State
	let activeTab = $state<'wiring' | 'questions' | 'risks'>('wiring');
	let selectedPhase = $state<string>('phase-1');
	let selectedRisk = $state<string | null>(null);
	let selectedQuestion = $state<string | null>(null);
	let showAddQuestionModal = $state(false);
	let showAddConnectionModal = $state(false);
	let pendingConnection = $state<{ riskId: string; phase: string } | null>(null);

	// New question form
	let newQuestion = $state({
		id: '',
		question: '',
		type: 'yes-no' as 'yes-no' | 'single-select' | 'multi-select',
		category: '',
		options: [] as Array<{ value: string; label: string; description?: string }>
	});

	// Build flat list of all questions
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

	// Build risk list with subdomain info
	let risks = $derived(
		data.domains.flatMap((d: any) =>
			d.subdomains.map((subId: string) => {
				const sub = data.subdomains.find((s: any) => s.id === subId);
				const config = riskConfigs[subId] || {
					applicablePhases: [],
					phaseTriggers: {},
					phaseMitigations: {}
				};
				return sub ? { ...sub, domainName: d.name, domainCode: d.code, config } : null;
			}).filter(Boolean)
		)
	);

	// Get connections for current phase (for wiring view)
	let phaseConnections = $derived.by(() => {
		const connections: Array<{
			riskId: string;
			riskCode: string;
			riskName: string;
			questionId: string;
			questionText: string;
			answerValues: string[];
			logic: string;
		}> = [];

		for (const risk of risks) {
			const config = riskConfigs[risk.id];
			if (!config?.phaseTriggers?.[selectedPhase]) continue;

			const trigger = config.phaseTriggers[selectedPhase];
			for (const condition of trigger.conditions || []) {
				const q = allQuestions.find(q => q.id === condition.questionId);
				if (q) {
					connections.push({
						riskId: risk.id,
						riskCode: risk.code,
						riskName: risk.shortName,
						questionId: condition.questionId,
						questionText: q.question,
						answerValues: condition.answerValues || [],
						logic: trigger.logic || 'AND'
					});
				}
			}
		}
		return connections;
	});

	// Check if risk applies to phase
	function riskAppliesTo(riskId: string, phase: string): boolean {
		return riskConfigs[riskId]?.applicablePhases?.includes(phase) || false;
	}

	// Toggle risk phase applicability
	function toggleRiskPhase(riskId: string, phase: string) {
		if (!riskConfigs[riskId]) {
			riskConfigs[riskId] = {
				riskId,
				applicablePhases: [],
				phaseTriggers: {},
				phaseMitigations: {}
			};
		}
		const phases = riskConfigs[riskId].applicablePhases;
		const idx = phases.indexOf(phase);
		if (idx >= 0) {
			riskConfigs[riskId].applicablePhases = phases.filter((p: string) => p !== phase);
			// Also remove triggers for this phase
			delete riskConfigs[riskId].phaseTriggers[phase];
		} else {
			riskConfigs[riskId].applicablePhases = [...phases, phase];
			// Initialize triggers for this phase
			if (!riskConfigs[riskId].phaseTriggers[phase]) {
				riskConfigs[riskId].phaseTriggers[phase] = { logic: 'OR', conditions: [] };
			}
		}
	}

	// Add a connection/trigger
	function addConnection(riskId: string, phase: string, questionId: string, answerValues: string[]) {
		if (!riskConfigs[riskId]) {
			riskConfigs[riskId] = {
				riskId,
				applicablePhases: [phase],
				phaseTriggers: {},
				phaseMitigations: {}
			};
		}
		if (!riskConfigs[riskId].phaseTriggers[phase]) {
			riskConfigs[riskId].phaseTriggers[phase] = { logic: 'OR', conditions: [] };
		}
		// Check if already exists
		const existing = riskConfigs[riskId].phaseTriggers[phase].conditions.find(
			(c: any) => c.questionId === questionId
		);
		if (existing) {
			existing.answerValues = answerValues;
		} else {
			riskConfigs[riskId].phaseTriggers[phase].conditions.push({
				questionId,
				answerValues
			});
		}
		showAddConnectionModal = false;
		pendingConnection = null;
	}

	// Remove a connection
	function removeConnection(riskId: string, phase: string, questionId: string) {
		if (!riskConfigs[riskId]?.phaseTriggers?.[phase]) return;
		riskConfigs[riskId].phaseTriggers[phase].conditions =
			riskConfigs[riskId].phaseTriggers[phase].conditions.filter(
				(c: any) => c.questionId !== questionId
			);
	}

	// Toggle trigger logic
	function toggleTriggerLogic(riskId: string, phase: string) {
		if (!riskConfigs[riskId]?.phaseTriggers?.[phase]) return;
		const current = riskConfigs[riskId].phaseTriggers[phase].logic;
		riskConfigs[riskId].phaseTriggers[phase].logic = current === 'AND' ? 'OR' : 'AND';
	}

	// Update mitigation text
	function updateMitigation(riskId: string, phase: string, text: string) {
		if (!riskConfigs[riskId]) {
			riskConfigs[riskId] = {
				riskId,
				applicablePhases: [],
				phaseTriggers: {},
				phaseMitigations: {}
			};
		}
		if (!riskConfigs[riskId].phaseMitigations) {
			riskConfigs[riskId].phaseMitigations = {};
		}
		riskConfigs[riskId].phaseMitigations[phase] = text;
	}

	// Add new question
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

		// Reset form
		newQuestion = {
			id: '',
			question: '',
			type: 'yes-no',
			category: '',
			options: []
		};
		showAddQuestionModal = false;
	}

	// Delete question
	function deleteQuestion(questionId: string) {
		if (!confirm('Delete this question? This will remove all its trigger connections.')) return;

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

	// Add option to new question
	function addOption() {
		newQuestion.options = [...newQuestion.options, { value: '', label: '' }];
	}

	// Remove option from new question
	function removeOption(index: number) {
		newQuestion.options = newQuestion.options.filter((_, i) => i !== index);
	}

	// Export configuration
	function exportConfig() {
		// Export risk configurations
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

		// Export questions
		setTimeout(() => {
			const questionsOutput = {
				"$schema": "./schemas/assessment-questions.schema.json",
				"version": "1.1.0",
				"lastUpdated": new Date().toISOString().split('T')[0],
				"source": "Derived from AIHSR Risk Reference Tool v1.5",
				"description": "Assessment questions with conditional visibility based on previous answers",
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

	// Selected risk details
	let selectedRiskData = $derived(risks.find((r: any) => r.id === selectedRisk));
</script>

<svelte:head>
	<title>Risk Configuration Admin - AI Oversight Tools</title>
</svelte:head>

<div class="admin">
	<header class="admin-header">
		<h1>Risk Configuration</h1>
		<div class="header-actions">
			<button class="btn primary" onclick={exportConfig}>Export All Config</button>
		</div>
	</header>

	<!-- Tab Navigation -->
	<nav class="tabs">
		<button class="tab" class:active={activeTab === 'wiring'} onclick={() => activeTab = 'wiring'}>
			Wiring Diagram
		</button>
		<button class="tab" class:active={activeTab === 'questions'} onclick={() => activeTab = 'questions'}>
			Questions
		</button>
		<button class="tab" class:active={activeTab === 'risks'} onclick={() => activeTab = 'risks'}>
			Risks & Mitigations
		</button>
	</nav>

	<!-- WIRING TAB -->
	{#if activeTab === 'wiring'}
		<div class="wiring-view">
			<!-- Phase Selector -->
			<div class="phase-selector">
				{#each phases as phase}
					<button
						class="phase-btn"
						class:active={selectedPhase === phase.id}
						onclick={() => selectedPhase = phase.id}
					>
						{phase.name}
					</button>
				{/each}
			</div>

			<div class="wiring-grid">
				<!-- Left: Questions -->
				<div class="wiring-column questions-column">
					<h3>Questions & Answers</h3>
					<div class="node-list">
						{#each allQuestions as q}
							{@const hasConnection = phaseConnections.some(c => c.questionId === q.id)}
							<div class="question-node" class:connected={hasConnection}>
								<div class="question-text">{q.question}</div>
								<div class="answers">
									{#each q.options as opt}
										{@const isTriggered = phaseConnections.some(
											c => c.questionId === q.id && c.answerValues.includes(opt.value)
										)}
										<span class="answer-chip" class:triggered={isTriggered}>
											{opt.label}
										</span>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Center: Connections -->
				<div class="wiring-column connections-column">
					<h3>Connections for {phases.find(p => p.id === selectedPhase)?.name}</h3>
					<div class="connection-list">
						{#each phaseConnections as conn}
							<div class="connection-card">
								<div class="conn-source">
									<span class="answers-label">
										{conn.answerValues.join(', ')}
									</span>
									<span class="q-text">{conn.questionText.slice(0, 40)}...</span>
								</div>
								<div class="conn-logic">{conn.logic}</div>
								<div class="conn-target">
									<span class="risk-code">{conn.riskCode}</span>
								</div>
								<button
									class="remove-conn-btn"
									onclick={() => removeConnection(conn.riskId, selectedPhase, conn.questionId)}
									title="Remove connection"
								>×</button>
							</div>
						{/each}

						{#if phaseConnections.length === 0}
							<div class="empty-connections">
								No connections for this phase yet.
								Select a risk and click "+ Add Trigger" to create one.
							</div>
						{/if}
					</div>
				</div>

				<!-- Right: Risks -->
				<div class="wiring-column risks-column">
					<h3>Risks</h3>
					<div class="node-list">
						{#each risks as risk}
							{@const appliesThisPhase = riskAppliesTo(risk.id, selectedPhase)}
							{@const triggerCount = phaseConnections.filter(c => c.riskId === risk.id).length}
							<div
								class="risk-node"
								class:active={appliesThisPhase}
								class:selected={selectedRisk === risk.id}
							>
								<div class="risk-header">
									<button
										class="phase-toggle"
										class:enabled={appliesThisPhase}
										onclick={() => toggleRiskPhase(risk.id, selectedPhase)}
										title={appliesThisPhase ? 'Disable for this phase' : 'Enable for this phase'}
									>
										{appliesThisPhase ? '✓' : '○'}
									</button>
									<span class="risk-code">{risk.code}</span>
									<span class="risk-name">{risk.shortName}</span>
								</div>
								{#if appliesThisPhase}
									<div class="risk-triggers">
										<span class="trigger-count">{triggerCount} trigger{triggerCount !== 1 ? 's' : ''}</span>
										<button
											class="add-trigger-btn"
											onclick={() => {
												pendingConnection = { riskId: risk.id, phase: selectedPhase };
												showAddConnectionModal = true;
											}}
										>+ Add</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- QUESTIONS TAB -->
	{#if activeTab === 'questions'}
		<div class="questions-view">
			<div class="questions-header">
				<h2>Manage Questions</h2>
				<button class="btn primary" onclick={() => showAddQuestionModal = true}>+ Add Question</button>
			</div>

			{#each questions as category}
				<div class="question-category">
					<h3>{category.name}</h3>
					<div class="question-list">
						{#each category.questions as q}
							<div class="question-item">
								<div class="q-main">
									<span class="q-id">{q.id}</span>
									<span class="q-type">{q.type}</span>
									<span class="q-text">{q.question}</span>
								</div>
								{#if q.options}
									<div class="q-options">
										{#each q.options as opt}
											<span class="opt-chip">{opt.label}</span>
										{/each}
									</div>
								{:else if q.type === 'yes-no'}
									<div class="q-options">
										<span class="opt-chip">Yes</span>
										<span class="opt-chip">No</span>
									</div>
								{/if}
								<button class="delete-q-btn" onclick={() => deleteQuestion(q.id)}>Delete</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- RISKS TAB -->
	{#if activeTab === 'risks'}
		<div class="risks-view">
			<div class="risks-layout">
				<!-- Risk List -->
				<div class="risks-list">
					<h2>Risks</h2>
					{#each risks as risk}
						<button
							class="risk-list-item"
							class:selected={selectedRisk === risk.id}
							onclick={() => selectedRisk = risk.id}
						>
							<span class="risk-code">{risk.code}</span>
							<span class="risk-name">{risk.shortName}</span>
							<div class="phase-indicators">
								{#each phases as phase}
									<span
										class="phase-dot"
										class:active={riskAppliesTo(risk.id, phase.id)}
										title={phase.name}
									>{phase.short}</span>
								{/each}
							</div>
						</button>
					{/each}
				</div>

				<!-- Risk Detail -->
				<div class="risk-detail">
					{#if selectedRiskData}
						<h2>{selectedRiskData.code}: {selectedRiskData.name}</h2>
						<p class="risk-desc">{selectedRiskData.description}</p>

						<div class="phase-config">
							<h3>Phase Applicability</h3>
							<div class="phase-toggles">
								{#each phases as phase}
									<label class="phase-checkbox">
										<input
											type="checkbox"
											checked={riskAppliesTo(selectedRiskData.id, phase.id)}
											onchange={() => toggleRiskPhase(selectedRiskData.id, phase.id)}
										/>
										{phase.name}
									</label>
								{/each}
							</div>
						</div>

						<div class="mitigations-config">
							<h3>Mitigations by Phase</h3>
							{#each phases as phase}
								{#if riskAppliesTo(selectedRiskData.id, phase.id)}
									<div class="mitigation-editor">
										<label for="mit-{selectedRiskData.id}-{phase.id}">{phase.name}</label>
										<textarea
											id="mit-{selectedRiskData.id}-{phase.id}"
											value={riskConfigs[selectedRiskData.id]?.phaseMitigations?.[phase.id] || ''}
											oninput={(e) => updateMitigation(selectedRiskData.id, phase.id, e.currentTarget.value)}
											rows="3"
											placeholder="Enter mitigation guidance for this phase..."
										></textarea>
									</div>
								{/if}
							{/each}
						</div>

						<div class="triggers-config">
							<h3>Triggers by Phase</h3>
							{#each phases as phase}
								{#if riskAppliesTo(selectedRiskData.id, phase.id)}
									{@const triggers = riskConfigs[selectedRiskData.id]?.phaseTriggers?.[phase.id]}
									<div class="trigger-section">
										<div class="trigger-header">
											<span>{phase.name}</span>
											{#if triggers?.conditions?.length > 1}
												<button
													class="logic-toggle"
													onclick={() => toggleTriggerLogic(selectedRiskData.id, phase.id)}
												>
													Logic: {triggers?.logic || 'OR'}
												</button>
											{/if}
										</div>
										<div class="trigger-list">
											{#if triggers?.conditions?.length > 0}
												{#each triggers.conditions as cond}
													{@const q = allQuestions.find(q => q.id === cond.questionId)}
													{#if q}
														<div class="trigger-item">
															<span class="trigger-q">{q.question}</span>
															<span class="trigger-answers">= {cond.answerValues.join(' or ')}</span>
															<button
																class="remove-trigger"
																onclick={() => removeConnection(selectedRiskData.id, phase.id, cond.questionId)}
															>×</button>
														</div>
													{/if}
												{/each}
											{:else}
												<div class="no-triggers">No triggers configured</div>
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="no-selection">
							<p>Select a risk from the list to configure it.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

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
					<label for="q-id">Question ID</label>
					<input id="q-id" type="text" bind:value={newQuestion.id} placeholder="e.g., data-retention" />
				</div>

				<div class="form-group">
					<label for="q-text">Question Text</label>
					<input id="q-text" type="text" bind:value={newQuestion.question} placeholder="e.g., How long is data retained?" />
				</div>

				<div class="form-group">
					<label for="q-type">Question Type</label>
					<select id="q-type" bind:value={newQuestion.type}>
						<option value="yes-no">Yes/No</option>
						<option value="single-select">Single Select</option>
						<option value="multi-select">Multi Select</option>
					</select>
				</div>

				<div class="form-group">
					<label for="q-cat">Category</label>
					<select id="q-cat" bind:value={newQuestion.category}>
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

<!-- Add Connection Modal -->
{#if showAddConnectionModal && pendingConnection}
	{@const targetRisk = risks.find((r: any) => r.id === pendingConnection.riskId)}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal wide">
			<div class="modal-header">
				<h3>Add Trigger for {targetRisk?.code}</h3>
				<button class="close-btn" onclick={() => { showAddConnectionModal = false; pendingConnection = null; }}>×</button>
			</div>

			<p class="modal-subtitle">Select a question and answer(s) that should trigger this risk in {phases.find(p => p.id === pendingConnection.phase)?.name}</p>

			<div class="modal-body">
				{#each allQuestions as q}
					{@const existingTrigger = riskConfigs[pendingConnection.riskId]?.phaseTriggers?.[pendingConnection.phase]?.conditions?.find((c: any) => c.questionId === q.id)}
					<div class="question-option" class:has-trigger={existingTrigger}>
						<div class="q-text">{q.question}</div>
						<div class="answer-options">
							{#each q.options as opt}
								<button
									class="answer-select"
									class:selected={existingTrigger?.answerValues?.includes(opt.value)}
									onclick={() => {
										const current = existingTrigger?.answerValues || [];
										const newValues = current.includes(opt.value)
											? current.filter((v: string) => v !== opt.value)
											: [...current, opt.value];
										if (newValues.length > 0) {
											addConnection(pendingConnection.riskId, pendingConnection.phase, q.id, newValues);
										} else if (existingTrigger) {
											removeConnection(pendingConnection.riskId, pendingConnection.phase, q.id);
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
				<button class="btn primary" onclick={() => { showAddConnectionModal = false; pendingConnection = null; }}>Done</button>
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

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.admin-header h1 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.tab {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.tab:hover {
		background: #1e293b;
		color: #e2e8f0;
	}

	.tab.active {
		background: #334155;
		color: #f1f5f9;
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

	/* Wiring View */
	.wiring-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.phase-selector {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 0;
		flex-shrink: 0;
	}

	.phase-btn {
		padding: 0.5rem 1rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.phase-btn:hover { border-color: #475569; }
	.phase-btn.active { background: #334155; border-color: #60a5fa; color: #f1f5f9; }

	.wiring-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
	}

	.wiring-column {
		background: #1e293b;
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.wiring-column h3 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #60a5fa;
		padding: 0.75rem;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.node-list, .connection-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	/* Question Nodes */
	.question-node {
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.question-node.connected { border-color: #22c55e; }

	.question-node .question-text {
		font-size: 0.75rem;
		color: #e2e8f0;
		margin-bottom: 0.375rem;
	}

	.answers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.answer-chip {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
	}

	.answer-chip.triggered {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	/* Risk Nodes */
	.risk-node {
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
		opacity: 0.5;
	}

	.risk-node.active {
		opacity: 1;
		border-color: #60a5fa;
	}

	.risk-node.selected {
		border-color: #fbbf24;
	}

	.risk-node .risk-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.phase-toggle {
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #64748b;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.phase-toggle.enabled {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.risk-node .risk-code {
		font-family: monospace;
		font-size: 0.625rem;
		color: #60a5fa;
	}

	.risk-node .risk-name {
		font-size: 0.75rem;
		color: #e2e8f0;
	}

	.risk-triggers {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.375rem;
		padding-top: 0.375rem;
		border-top: 1px solid #334155;
	}

	.trigger-count {
		font-size: 0.625rem;
		color: #64748b;
	}

	.add-trigger-btn {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		cursor: pointer;
	}

	.add-trigger-btn:hover {
		background: #475569;
		color: #e2e8f0;
	}

	/* Connections */
	.connection-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
	}

	.conn-source {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.conn-source .answers-label {
		font-size: 0.625rem;
		color: #22c55e;
		font-weight: 600;
	}

	.conn-source .q-text {
		font-size: 0.625rem;
		color: #64748b;
	}

	.conn-logic {
		font-size: 0.625rem;
		color: #fbbf24;
		padding: 0.125rem 0.25rem;
		background: rgba(251, 191, 36, 0.2);
		border-radius: 0.125rem;
	}

	.conn-target .risk-code {
		font-family: monospace;
		font-size: 0.75rem;
		color: #60a5fa;
	}

	.remove-conn-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.remove-conn-btn:hover {
		color: #ef4444;
	}

	.empty-connections {
		text-align: center;
		padding: 2rem;
		color: #64748b;
		font-size: 0.75rem;
	}

	/* Questions Tab */
	.questions-view {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 0;
	}

	.questions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.questions-header h2 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.question-category {
		margin-bottom: 1.5rem;
	}

	.question-category h3 {
		font-size: 0.875rem;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.question-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.question-item {
		padding: 0.75rem;
		background: #1e293b;
		border-radius: 0.375rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.question-item .q-main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 300px;
	}

	.question-item .q-id {
		font-family: monospace;
		font-size: 0.625rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.question-item .q-type {
		font-size: 0.625rem;
		color: #64748b;
		background: #334155;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.question-item .q-text {
		font-size: 0.8125rem;
		color: #e2e8f0;
	}

	.question-item .q-options {
		display: flex;
		gap: 0.25rem;
	}

	.opt-chip {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #334155;
		border-radius: 0.25rem;
		color: #94a3b8;
	}

	.delete-q-btn {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #ef4444;
		cursor: pointer;
	}

	.delete-q-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
	}

	/* Risks Tab */
	.risks-view {
		flex: 1;
		overflow: hidden;
	}

	.risks-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 1rem;
		height: 100%;
		padding: 1rem 0;
	}

	.risks-list {
		background: #1e293b;
		border-radius: 0.5rem;
		padding: 0.75rem;
		overflow-y: auto;
	}

	.risks-list h2 {
		font-size: 0.875rem;
		color: #f1f5f9;
		margin-bottom: 0.75rem;
	}

	.risk-list-item {
		width: 100%;
		text-align: left;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.risk-list-item:hover { border-color: #475569; }
	.risk-list-item.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.1); }

	.risk-list-item .risk-code {
		font-family: monospace;
		font-size: 0.625rem;
		color: #60a5fa;
	}

	.risk-list-item .risk-name {
		flex: 1;
		font-size: 0.75rem;
		color: #e2e8f0;
	}

	.phase-indicators {
		display: flex;
		gap: 0.125rem;
	}

	.phase-dot {
		font-size: 0.5rem;
		padding: 0.125rem 0.25rem;
		background: #334155;
		border-radius: 0.125rem;
		color: #64748b;
	}

	.phase-dot.active {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	/* Risk Detail */
	.risk-detail {
		background: #1e293b;
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-y: auto;
	}

	.risk-detail h2 {
		font-size: 1rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.risk-desc {
		font-size: 0.8125rem;
		color: #94a3b8;
		margin-bottom: 1rem;
	}

	.phase-config, .mitigations-config, .triggers-config {
		margin-bottom: 1.5rem;
	}

	.phase-config h3, .mitigations-config h3, .triggers-config h3 {
		font-size: 0.875rem;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.phase-toggles {
		display: flex;
		gap: 1rem;
	}

	.phase-checkbox {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #e2e8f0;
		cursor: pointer;
	}

	.phase-checkbox input {
		accent-color: #60a5fa;
	}

	.mitigation-editor {
		margin-bottom: 0.75rem;
	}

	.mitigation-editor label {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.mitigation-editor textarea {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		resize: vertical;
	}

	.mitigation-editor textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.trigger-section {
		margin-bottom: 0.75rem;
		padding: 0.5rem;
		background: #0f172a;
		border-radius: 0.375rem;
	}

	.trigger-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.logic-toggle {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #fbbf24;
		cursor: pointer;
	}

	.trigger-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.trigger-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem;
		background: #1e293b;
		border-radius: 0.25rem;
	}

	.trigger-item .trigger-q {
		flex: 1;
		font-size: 0.75rem;
		color: #e2e8f0;
	}

	.trigger-item .trigger-answers {
		font-size: 0.625rem;
		color: #22c55e;
	}

	.remove-trigger {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.125rem 0.375rem;
	}

	.remove-trigger:hover { color: #ef4444; }

	.no-triggers {
		font-size: 0.75rem;
		color: #64748b;
		text-align: center;
		padding: 0.5rem;
	}

	.no-selection {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #64748b;
	}

	/* Modals */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.modal.wide {
		max-width: 700px;
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

	.modal-subtitle {
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

	.option-row input {
		flex: 1;
	}

	.remove-opt {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 1.25rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem;
		border-top: 1px solid #334155;
	}

	/* Question options in connection modal */
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

	.answer-select {
		padding: 0.375rem 0.75rem;
		background: #334155;
		border: 1px solid #475569;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.answer-select:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.answer-select.selected {
		background: rgba(34, 197, 94, 0.2);
		border-color: #22c55e;
		color: #22c55e;
	}
</style>
